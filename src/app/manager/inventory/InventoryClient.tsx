"use client";

import { useState } from "react";
import {
  Plus, Pencil, Trash2, Search, X, AlertTriangle,
  TrendingUp, TrendingDown, Minus, RotateCcw, History,
  Package, ChevronDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { format } from "date-fns";
import type { InventoryItem, InventoryCategory, InventoryMovement, MovementType } from "@/lib/supabase/types";

type ItemWithCat = InventoryItem & { category: InventoryCategory | null };
type MovementWithItem = InventoryMovement & { item: { name: string; unit: string } | null };

const UNITS = ["kg","g","litre","ml","pcs","box","packet","dozen","other"] as const;
const MOVEMENT_LABELS: Record<MovementType, string> = {
  add: "Stock Added", reduce: "Stock Used", wastage: "Wastage",
  adjustment: "Adjustment", opening: "Opening Stock",
};
const MOVEMENT_COLORS: Record<MovementType, string> = {
  add: "text-green-600 bg-green-50", reduce: "text-orange-600 bg-orange-50",
  wastage: "text-red-600 bg-red-50", adjustment: "text-blue-600 bg-blue-50",
  opening: "text-purple-600 bg-purple-50",
};

function stockBadge(item: InventoryItem) {
  if (item.current_stock <= 0)
    return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Out of Stock</span>;
  if (item.current_stock < item.min_stock)
    return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Low Stock</span>;
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">In Stock</span>;
}

const EMPTY_FORM = {
  id: "", name: "", category_id: "", unit: "pcs" as const,
  current_stock: "0", min_stock: "0", purchase_price: "", supplier: "", notes: "",
};

export default function InventoryClient({
  items: init, categories, recentMovements: initMov,
}: {
  items: ItemWithCat[];
  categories: InventoryCategory[];
  recentMovements: MovementWithItem[];
}) {
  const [items, setItems] = useState<ItemWithCat[]>(init);
  const [movements, setMovements] = useState<MovementWithItem[]>(initMov);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [activeTab, setActiveTab] = useState<"items" | "history">("items");
  const [itemModal, setItemModal] = useState<"add" | "edit" | null>(null);
  const [movModal, setMovModal] = useState<{
    item: ItemWithCat; type: MovementType;
  } | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [movForm, setMovForm] = useState({ quantity: "", note: "" });
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const db = supabase as any;

  // Derived filtered list
  const filtered = items.filter((i) => {
    const matchSearch = search === "" || i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.supplier ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "All" || i.category?.name === filterCat;
    const matchStatus =
      filterStatus === "All" ? true :
      filterStatus === "out" ? i.current_stock <= 0 :
      filterStatus === "low" ? (i.current_stock > 0 && i.current_stock < i.min_stock) :
      i.current_stock >= i.min_stock;
    return matchSearch && matchCat && matchStatus && i.is_active;
  });

  const lowCount = items.filter(i => i.is_active && i.current_stock > 0 && i.current_stock < i.min_stock).length;
  const outCount = items.filter(i => i.is_active && i.current_stock <= 0).length;

  function openAdd() {
    setForm({ ...EMPTY_FORM, category_id: categories[0]?.id ?? "" });
    setItemModal("add");
  }
  function openEdit(item: ItemWithCat) {
    setForm({
      id: item.id, name: item.name, category_id: item.category_id ?? "",
      unit: item.unit as any, current_stock: String(item.current_stock),
      min_stock: String(item.min_stock),
      purchase_price: item.purchase_price != null ? String(item.purchase_price) : "",
      supplier: item.supplier ?? "", notes: item.notes ?? "",
    });
    setItemModal("edit");
  }

  async function saveItem() {
    if (!form.name) { toast.error("Item name required"); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name, category_id: form.category_id || null,
        unit: form.unit, min_stock: parseFloat(form.min_stock) || 0,
        purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : null,
        supplier: form.supplier || null, notes: form.notes || null,
      };
      if (itemModal === "edit" && form.id) {
        const { data, error } = await db.from("inventory_items").update(payload)
          .eq("id", form.id).select("*, category:inventory_categories(*)").single();
        if (error) throw error;
        setItems(p => p.map(i => i.id === form.id ? data : i));
        toast.success("Item updated");
      } else {
        const { data, error } = await db.from("inventory_items")
          .insert([{ ...payload, current_stock: parseFloat(form.current_stock) || 0 }])
          .select("*, category:inventory_categories(*)").single();
        if (error) throw error;
        // If opening stock > 0, record a movement
        const openQty = parseFloat(form.current_stock) || 0;
        if (openQty > 0) {
          await db.from("inventory_movements").insert([{
            item_id: data.id, type: "opening", quantity: openQty, note: "Opening stock",
          }]);
        }
        setItems(p => [...p, data]);
        toast.success("Item added");
      }
      setItemModal(null);
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  }

  async function deactivateItem(id: string) {
    if (!confirm("Deactivate this item?")) return;
    const { error } = await db.from("inventory_items").update({ is_active: false }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setItems(p => p.filter(i => i.id !== id));
    toast.success("Item deactivated");
  }

  async function saveMovement() {
    if (!movModal) return;
    const qty = parseFloat(movForm.quantity);
    if (!qty || qty <= 0) { toast.error("Enter a valid quantity"); return; }
    setSaving(true);
    try {
      const { data: mov, error } = await db.from("inventory_movements").insert([{
        item_id: movModal.item.id, type: movModal.type,
        quantity: movModal.type === "adjustment" ? qty : qty,
        note: movForm.note || null,
      }]).select("*, item:inventory_items(name,unit)").single();
      if (error) throw error;

      // Refresh item stock from DB
      const { data: updated } = await db.from("inventory_items")
        .select("*, category:inventory_categories(*)").eq("id", movModal.item.id).single();
      if (updated) setItems(p => p.map(i => i.id === updated.id ? updated : i));
      setMovements(p => [mov, ...p]);
      toast.success(MOVEMENT_LABELS[movModal.type] + " recorded");
      setMovModal(null);
      setMovForm({ quantity: "", note: "" });
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1108]">Inventory</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {items.filter(i => i.is_active).length} items
            {lowCount > 0 && <span className="text-yellow-600 ml-2">· {lowCount} low stock</span>}
            {outCount > 0 && <span className="text-red-600 ml-2">· {outCount} out of stock</span>}
          </p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-[#BF4E19] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#A33D10] transition-colors">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Alert bar */}
      {(lowCount > 0 || outCount > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
          <p className="text-sm text-yellow-800">
            {outCount > 0 && <strong>{outCount} item{outCount > 1 ? "s" : ""} out of stock. </strong>}
            {lowCount > 0 && <span>{lowCount} item{lowCount > 1 ? "s" : ""} running low.</span>}
            {" "}Restock soon to avoid disruption.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 bg-white rounded-2xl p-1 w-fit shadow-sm border border-gray-100">
        {(["items", "history"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all capitalize ${
              activeTab === tab ? "bg-[#BF4E19] text-white shadow-sm" : "text-gray-500 hover:text-[#1A1108]"}`}>
            {tab === "items" ? <span className="flex items-center gap-2"><Package className="w-4 h-4" />Items</span>
              : <span className="flex items-center gap-2"><History className="w-4 h-4" />Stock History</span>}
          </button>
        ))}
      </div>

      {activeTab === "items" && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search items or supplier..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19]" />
            </div>
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19]">
              <option value="All">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19]">
              <option value="All">All Status</option>
              <option value="ok">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>

          {/* Items grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(item => (
              <div key={item.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-[#1A1108]">{item.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.category?.name ?? "Uncategorised"}
                      {item.supplier && <> · {item.supplier}</>}
                    </p>
                  </div>
                  {stockBadge(item)}
                </div>

                {/* Stock bar */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-bold text-[#1A1108] text-lg">
                      {item.current_stock} <span className="text-sm font-normal text-gray-500">{item.unit}</span>
                    </span>
                    <span className="text-xs text-gray-400">Min: {item.min_stock} {item.unit}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${
                      item.current_stock <= 0 ? "bg-red-500" :
                      item.current_stock < item.min_stock ? "bg-yellow-400" : "bg-green-500"
                    }`} style={{ width: `${Math.min(100, item.min_stock > 0 ? (item.current_stock / (item.min_stock * 2)) * 100 : 100)}%` }} />
                  </div>
                </div>

                {item.purchase_price != null && (
                  <p className="text-xs text-gray-500">Purchase: ₹{item.purchase_price}/{item.unit}</p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setMovModal({ item, type: "add" })}
                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-50 text-green-700 rounded-xl text-xs font-semibold hover:bg-green-100 transition-colors">
                    <TrendingUp className="w-3.5 h-3.5" /> Add
                  </button>
                  <button onClick={() => setMovModal({ item, type: "reduce" })}
                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-orange-50 text-orange-700 rounded-xl text-xs font-semibold hover:bg-orange-100 transition-colors">
                    <TrendingDown className="w-3.5 h-3.5" /> Use
                  </button>
                  <button onClick={() => setMovModal({ item, type: "wastage" })}
                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-50 text-red-700 rounded-xl text-xs font-semibold hover:bg-red-100 transition-colors">
                    <Minus className="w-3.5 h-3.5" /> Waste
                  </button>
                  <button onClick={() => openEdit(item)}
                    className="p-2 rounded-xl bg-[#FAF3E8] text-[#BF4E19] hover:bg-[#F2E6D0] transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deactivateItem(item.id)}
                    className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-16 text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No items found</p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "history" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#FAF3E8] text-left">
                  <th className="px-5 py-3.5 font-semibold text-[#1A1108]">Item</th>
                  <th className="px-4 py-3.5 font-semibold text-[#1A1108]">Type</th>
                  <th className="px-4 py-3.5 font-semibold text-[#1A1108]">Qty</th>
                  <th className="px-4 py-3.5 font-semibold text-[#1A1108]">Note</th>
                  <th className="px-4 py-3.5 font-semibold text-[#1A1108]">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {movements.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5 font-medium text-[#1A1108]">{m.item?.name ?? "—"}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${MOVEMENT_COLORS[m.type]}`}>
                        {MOVEMENT_LABELS[m.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-[#1A1108]">
                      {m.type === "add" || m.type === "opening" ? "+" : "−"}{m.quantity} {m.item?.unit}
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 text-xs">{m.note ?? "—"}</td>
                    <td className="px-4 py-3.5 text-gray-400 text-xs">
                      {format(new Date(m.created_at), "MMM d, hh:mm a")}
                    </td>
                  </tr>
                ))}
                {movements.length === 0 && (
                  <tr><td colSpan={5} className="py-12 text-center text-gray-400">No movements yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Item Modal */}
      {itemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setItemModal(null)} />
          <div className="relative bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-[#1A1108] text-xl">
                {itemModal === "add" ? "Add Inventory Item" : "Edit Item"}
              </h2>
              <button onClick={() => setItemModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#1A1108] mb-1.5">Item Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Whole Milk"
                  className="w-full px-4 py-3 bg-[#FAF3E8] border border-[#E8D5B7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1A1108] mb-1.5">Category</label>
                  <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}
                    className="w-full px-4 py-3 bg-[#FAF3E8] border border-[#E8D5B7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19]">
                    <option value="">Uncategorised</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1A1108] mb-1.5">Unit</label>
                  <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value as any })}
                    className="w-full px-4 py-3 bg-[#FAF3E8] border border-[#E8D5B7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19]">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {itemModal === "add" && (
                  <div>
                    <label className="block text-sm font-semibold text-[#1A1108] mb-1.5">Opening Stock</label>
                    <input type="number" min="0" step="0.001" value={form.current_stock}
                      onChange={e => setForm({ ...form, current_stock: e.target.value })}
                      className="w-full px-4 py-3 bg-[#FAF3E8] border border-[#E8D5B7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19]" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-[#1A1108] mb-1.5">Min Stock Level</label>
                  <input type="number" min="0" step="0.001" value={form.min_stock}
                    onChange={e => setForm({ ...form, min_stock: e.target.value })}
                    className="w-full px-4 py-3 bg-[#FAF3E8] border border-[#E8D5B7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1A1108] mb-1.5">Purchase Price (₹)</label>
                  <input type="number" min="0" step="0.01" value={form.purchase_price}
                    onChange={e => setForm({ ...form, purchase_price: e.target.value })}
                    placeholder="Per unit"
                    className="w-full px-4 py-3 bg-[#FAF3E8] border border-[#E8D5B7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1A1108] mb-1.5">Supplier</label>
                  <input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })}
                    placeholder="Supplier name"
                    className="w-full px-4 py-3 bg-[#FAF3E8] border border-[#E8D5B7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A1108] mb-1.5">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-4 py-3 bg-[#FAF3E8] border border-[#E8D5B7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19] resize-none" />
              </div>
              <button onClick={saveItem} disabled={saving}
                className="w-full bg-[#BF4E19] text-white py-3.5 rounded-2xl font-semibold hover:bg-[#A33D10] transition-colors disabled:opacity-60">
                {saving ? "Saving..." : itemModal === "add" ? "Add Item" : "Update Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Movement Modal */}
      {movModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMovModal(null)} />
          <div className="relative bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[#1A1108]">{MOVEMENT_LABELS[movModal.type]}</h2>
              <button onClick={() => setMovModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <p className="text-sm text-[#6B4C35] mb-4">
              <strong>{movModal.item.name}</strong> — Current: {movModal.item.current_stock} {movModal.item.unit}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#1A1108] mb-1.5">
                  {movModal.type === "adjustment" ? "New Stock Quantity" : "Quantity"} ({movModal.item.unit})
                </label>
                <input type="number" min="0.001" step="0.001" value={movForm.quantity}
                  onChange={e => setMovForm({ ...movForm, quantity: e.target.value })}
                  placeholder="0.000" autoFocus
                  className="w-full px-4 py-3 bg-[#FAF3E8] border border-[#E8D5B7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A1108] mb-1.5">Note (optional)</label>
                <input value={movForm.note} onChange={e => setMovForm({ ...movForm, note: e.target.value })}
                  placeholder="e.g. Morning delivery"
                  className="w-full px-4 py-3 bg-[#FAF3E8] border border-[#E8D5B7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19]" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setMovModal({ ...movModal, type: "add" })}
                  className={`py-2 rounded-xl text-sm font-semibold transition-colors ${movModal.type === "add" ? "bg-green-600 text-white" : "bg-green-50 text-green-700"}`}>
                  Add Stock
                </button>
                <button onClick={() => setMovModal({ ...movModal, type: "reduce" })}
                  className={`py-2 rounded-xl text-sm font-semibold transition-colors ${movModal.type === "reduce" ? "bg-orange-600 text-white" : "bg-orange-50 text-orange-700"}`}>
                  Used
                </button>
                <button onClick={() => setMovModal({ ...movModal, type: "wastage" })}
                  className={`py-2 rounded-xl text-sm font-semibold transition-colors ${movModal.type === "wastage" ? "bg-red-600 text-white" : "bg-red-50 text-red-700"}`}>
                  Wastage
                </button>
                <button onClick={() => setMovModal({ ...movModal, type: "adjustment" })}
                  className={`py-2 rounded-xl text-sm font-semibold transition-colors ${movModal.type === "adjustment" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700"}`}>
                  Adjustment
                </button>
              </div>
              <button onClick={saveMovement} disabled={saving}
                className="w-full bg-[#BF4E19] text-white py-3.5 rounded-2xl font-semibold hover:bg-[#A33D10] transition-colors disabled:opacity-60">
                {saving ? "Saving..." : "Record"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
