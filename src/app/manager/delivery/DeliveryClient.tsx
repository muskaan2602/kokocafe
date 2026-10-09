"use client";

import { useState, useMemo } from "react";
import {
  Plus, X, Search, ShoppingBag,
  Trash2, Minus, IndianRupee, RefreshCw,
  CheckCircle2, ChefHat, Bell, Filter,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { formatPrice, calculateTax } from "@/lib/utils";

const SOURCES = [
  { value: "zomato",   label: "Zomato",   emoji: "🔴", color: "bg-red-50 text-red-700 border-red-200"          },
  { value: "swiggy",   label: "Swiggy",   emoji: "🟠", color: "bg-orange-50 text-orange-700 border-orange-200"  },
  { value: "phone",    label: "Phone",    emoji: "📞", color: "bg-blue-50 text-blue-700 border-blue-200"        },
  { value: "takeaway", label: "Takeaway", emoji: "🛍️", color: "bg-purple-50 text-purple-700 border-purple-200"  },
  { value: "other",    label: "Other",    emoji: "📦", color: "bg-gray-50 text-gray-600 border-gray-200"        },
] as const;

type Source = typeof SOURCES[number]["value"];

const STATUS_FLOW: Record<string, string | null> = {
  pending: "accepted", accepted: "preparing",
  preparing: "ready", ready: "completed",
  completed: null, rejected: null,
};
const NEXT_LABEL: Record<string, string> = {
  pending: "Accept Order", accepted: "Start Preparing",
  preparing: "Mark Ready", ready: "Mark Completed",
};
const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-700",
  accepted:  "bg-blue-100 text-blue-700",
  preparing: "bg-orange-100 text-orange-700",
  ready:     "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-500",
  rejected:  "bg-red-100 text-red-600",
};

function SourceBadge({ source }: { source: string }) {
  const s = SOURCES.find(x => x.value === source) ?? SOURCES[4];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${s.color}`}>
      {s.emoji} {s.label}
    </span>
  );
}

interface CartLine { menuItemId: string; name: string; price: number; qty: number; }

interface Props {
  orders: any[];
  menuItems: any[];
  categories: any[];
  today: string;
}

export default function DeliveryClient({ orders: initOrders, menuItems, categories, today }: Props) {
  const [orders, setOrders] = useState<any[]>(initOrders);
  const [showForm, setShowForm] = useState(false);
  const [filterSource, setFilterSource] = useState("all");
  const [filterStatus, setFilterStatus] = useState("active");
  const [updating, setUpdating] = useState<string | null>(null);
  const [itemSearch, setItemSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  // Form state
  const [source, setSource] = useState<Source>("zomato");
  const [externalId, setExternalId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [saving, setSaving] = useState(false);

  const db = createClient() as any;

  // Cart calculations
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;

  // Filtered menu for item picker
  const filteredMenu = useMemo(() => {
    return menuItems.filter(item => {
      const matchCat = activeCategory === "All" ||
        categories.find((c: any) => c.id === item.category_id)?.name === activeCategory;
      const matchSearch = itemSearch === "" ||
        item.name.toLowerCase().includes(itemSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [menuItems, categories, activeCategory, itemSearch]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchSource = filterSource === "all" || o.order_source === filterSource;
      const matchStatus = filterStatus === "active"
        ? !["completed", "rejected"].includes(o.status)
        : ["completed", "rejected"].includes(o.status);
      return matchSource && matchStatus;
    });
  }, [orders, filterSource, filterStatus]);

  // Today stats
  const todayOrders = orders.filter(o => o.created_at?.startsWith(today));
  const todayRevenue = todayOrders
    .filter(o => o.status === "completed")
    .reduce((s: number, o: any) => s + o.total, 0);

  // Cart helpers
  function addToCart(item: any) {
    setCart(prev => {
      const ex = prev.find(l => l.menuItemId === item.id);
      if (ex) return prev.map(l => l.menuItemId === item.id ? { ...l, qty: l.qty + 1 } : l);
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, qty: 1 }];
    });
  }
  function updateQty(id: string, qty: number) {
    if (qty <= 0) setCart(p => p.filter(l => l.menuItemId !== id));
    else setCart(p => p.map(l => l.menuItemId === id ? { ...l, qty } : l));
  }
  function cartQty(id: string) { return cart.find(l => l.menuItemId === id)?.qty ?? 0; }

  function resetForm() {
    setSource("zomato"); setExternalId(""); setCustomerName("");
    setCustomerPhone(""); setDeliveryAddress(""); setNotes("");
    setCart([]); setItemSearch(""); setActiveCategory("All");
  }

  async function placeOrder() {
    if (cart.length === 0) { toast.error("Add at least one item to the cart"); return; }
    setSaving(true);
    try {
      // Use first table as a placeholder for delivery orders
      const { data: tables } = await db.from("tables").select("id").limit(1);
      const tableId = tables?.[0]?.id;
      if (!tableId) throw new Error("No tables found — please add tables first");

      const { data: order, error: oErr } = await db.from("orders").insert([{
        table_id: tableId,
        status: "pending",
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        total: Math.round(total * 100) / 100,
        order_source: source,
        external_order_id: externalId.trim() || null,
        customer_name: customerName.trim() || null,
        customer_phone: customerPhone.trim() || null,
        delivery_address: deliveryAddress.trim() || null,
        notes: notes.trim() || null,
      }]).select().single();

      if (oErr) throw oErr;

      const { error: iErr } = await db.from("order_items").insert(
        cart.map(l => ({
          order_id: order.id,
          menu_item_id: l.menuItemId,
          item_name: l.name,
          quantity: l.qty,
          price: l.price,
        }))
      );
      if (iErr) throw iErr;

      // Reload order with items
      const { data: full } = await db.from("orders")
        .select("*, order_items(*)")
        .eq("id", order.id)
        .single();

      setOrders(p => [full, ...p]);
      toast.success(`${SOURCES.find(s => s.value === source)?.emoji} ${SOURCES.find(s => s.value === source)?.label} order placed — #${order.order_number}`);
      resetForm();
      setShowForm(false);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to place order");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(orderId: string, newStatus: string) {
    setUpdating(orderId);
    try {
      const { error } = await db.from("orders").update({ status: newStatus }).eq("id", orderId);
      if (error) throw error;
      setOrders(p => p.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast.success(`Order marked as ${newStatus}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1108]">Delivery Orders</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Zomato · Swiggy · Phone · Takeaway — all in one place
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-[#BF4E19] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#A33D10] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Delivery Order
        </button>
      </div>

      {/* Today stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="col-span-2 sm:col-span-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-[#BF4E19]">{formatPrice(todayRevenue)}</div>
          <div className="text-xs text-gray-500 mt-0.5">Today's Revenue</div>
        </div>
        {SOURCES.map(s => {
          const count = todayOrders.filter((o: any) => o.order_source === s.value).length;
          return (
            <div key={s.value} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="text-xl font-bold text-[#1A1108]">{s.emoji} {count}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-200">
          {["active", "completed"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${
                filterStatus === s ? "bg-[#BF4E19] text-white" : "text-gray-500 hover:text-[#1A1108]"}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-200 flex-wrap">
          <button onClick={() => setFilterSource("all")}
            className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
              filterSource === "all" ? "bg-[#1A1108] text-white" : "text-gray-500 hover:text-[#1A1108]"}`}>
            All
          </button>
          {SOURCES.map(s => (
            <button key={s.value} onClick={() => setFilterSource(s.value)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filterSource === s.value ? "bg-[#1A1108] text-white" : "text-gray-500 hover:text-[#1A1108]"}`}>
              {s.emoji} {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400 font-medium">No {filterStatus} orders</p>
          <p className="text-gray-400 text-sm mt-1">
            Click "New Delivery Order" to add one manually
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOrders.map(order => {
            const nextStatus = STATUS_FLOW[order.status];
            return (
              <div key={order.id}
                className={`bg-white rounded-3xl p-5 shadow-sm border-2 space-y-4 ${
                  order.status === "pending" ? "border-yellow-300 ring-2 ring-yellow-100" : "border-gray-100"}`}>
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#1A1108]">#{order.order_number}</span>
                      <SourceBadge source={order.order_source} />
                    </div>
                    {order.customer_name && (
                      <p className="text-sm text-gray-500 mt-1">👤 {order.customer_name}
                        {order.customer_phone && <span className="ml-1">· {order.customer_phone}</span>}
                      </p>
                    )}
                    {order.external_order_id && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Platform ID: <span className="font-mono font-semibold">{order.external_order_id}</span>
                      </p>
                    )}
                    {order.delivery_address && (
                      <p className="text-xs text-gray-400 mt-0.5">📍 {order.delivery_address}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(order.created_at), "hh:mm a")}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div className="bg-[#FAF3E8] rounded-2xl p-3 space-y-1">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-[#3D2B1A]">{item.quantity} × {item.item_name}</span>
                      <span className="font-medium text-[#1A1108]">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  {order.notes && (
                    <p className="text-xs text-[#6B4C35] pt-1 border-t border-[#F2E6D0] mt-1">
                      📝 {order.notes}
                    </p>
                  )}
                </div>

                {/* Bill */}
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>GST (5%)</span><span>{formatPrice(order.tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[#1A1108] pt-1 border-t border-gray-100 text-base">
                    <span>Total</span>
                    <span className="text-[#BF4E19]">{formatPrice(order.total)}</span>
                  </div>
                </div>

                {/* Action buttons */}
                {nextStatus && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(order.id, nextStatus)}
                      disabled={updating === order.id}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#BF4E19] text-white py-3 rounded-2xl text-sm font-bold hover:bg-[#A33D10] transition-colors disabled:opacity-60"
                    >
                      {updating === order.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          {nextStatus === "accepted"  && <CheckCircle2 className="w-4 h-4" />}
                          {nextStatus === "preparing" && <ChefHat className="w-4 h-4" />}
                          {nextStatus === "ready"     && <Bell className="w-4 h-4" />}
                          {nextStatus === "completed" && <CheckCircle2 className="w-4 h-4" />}
                          {NEXT_LABEL[order.status]}
                        </>
                      )}
                    </button>
                    {order.status === "pending" && (
                      <button
                        onClick={() => updateStatus(order.id, "rejected")}
                        disabled={updating === order.id}
                        className="px-4 py-3 bg-red-50 text-red-600 rounded-2xl text-sm font-bold hover:bg-red-100 transition-colors"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── New Order Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-2xl">

            {/* Modal header */}
            <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between z-10">
              <h2 className="font-bold text-[#1A1108] text-xl">New Delivery Order</h2>
              <button onClick={() => setShowForm(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Source selector */}
              <div>
                <label className="block text-sm font-semibold text-[#1A1108] mb-2">
                  Order Source <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {SOURCES.map(s => (
                    <button key={s.value} type="button"
                      onClick={() => setSource(s.value)}
                      className={`flex flex-col items-center gap-1 py-3 rounded-2xl border-2 text-xs font-semibold transition-all ${
                        source === s.value
                          ? "border-[#BF4E19] bg-[#FAF3E8] text-[#BF4E19]"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                      <span className="text-xl">{s.emoji}</span>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Platform order ID */}
              {(source === "zomato" || source === "swiggy") && (
                <div>
                  <label className="block text-sm font-semibold text-[#1A1108] mb-1.5">
                    {source === "zomato" ? "Zomato" : "Swiggy"} Order ID
                    <span className="text-gray-400 font-normal ml-1">(from their app/tablet)</span>
                  </label>
                  <input
                    type="text"
                    value={externalId}
                    onChange={e => setExternalId(e.target.value)}
                    placeholder={source === "zomato" ? "e.g. 12345678" : "e.g. SW-987654"}
                    className="w-full px-4 py-3 bg-[#FAF3E8] border border-[#E8D5B7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19]"
                  />
                </div>
              )}

              {/* Customer details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1A1108] mb-1.5">
                    Customer Name <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Rahul Sharma"
                    className="w-full px-4 py-3 bg-[#FAF3E8] border border-[#E8D5B7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1A1108] mb-1.5">
                    Phone <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 bg-[#FAF3E8] border border-[#E8D5B7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19]"
                  />
                </div>
              </div>

              {(source === "zomato" || source === "swiggy" || source === "other") && (
                <div>
                  <label className="block text-sm font-semibold text-[#1A1108] mb-1.5">
                    Delivery Address <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                    placeholder="Full delivery address..."
                    rows={2}
                    className="w-full px-4 py-3 bg-[#FAF3E8] border border-[#E8D5B7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19] resize-none"
                  />
                </div>
              )}

              {/* Item picker */}
              <div>
                <label className="block text-sm font-semibold text-[#1A1108] mb-2">
                  Add Items <span className="text-red-500">*</span>
                </label>

                {/* Category tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
                  <button
                    onClick={() => setActiveCategory("All")}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      activeCategory === "All" ? "bg-[#BF4E19] text-white" : "bg-[#FAF3E8] text-[#3D2B1A] hover:bg-[#F2E6D0]"}`}>
                    All
                  </button>
                  {categories.map((cat: any) => (
                    <button key={cat.id}
                      onClick={() => setActiveCategory(cat.name)}
                      className={`flex-shrink-0 flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        activeCategory === cat.name ? "bg-[#BF4E19] text-white" : "bg-[#FAF3E8] text-[#3D2B1A] hover:bg-[#F2E6D0]"}`}>
                      {cat.icon} {cat.name}
                    </button>
                  ))}
                </div>

                {/* Item search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={itemSearch}
                    onChange={e => setItemSearch(e.target.value)}
                    placeholder="Search menu items..."
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF3E8] border border-[#E8D5B7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19]"
                  />
                </div>

                {/* Items grid */}
                <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                  {filteredMenu.map((item: any) => {
                    const qty = cartQty(item.id);
                    return (
                      <div key={item.id}
                        className="flex items-center justify-between bg-[#FAF3E8] rounded-xl px-3 py-2.5 gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[#1A1108] truncate">{item.name}</p>
                          <p className="text-xs text-[#BF4E19] font-bold">{formatPrice(item.price)}</p>
                        </div>
                        {qty === 0 ? (
                          <button
                            onClick={() => addToCart(item)}
                            className="w-7 h-7 bg-[#BF4E19] text-white rounded-lg flex items-center justify-center hover:bg-[#A33D10] transition-colors shrink-0">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => updateQty(item.id, qty - 1)}
                              className="w-6 h-6 bg-white rounded-lg flex items-center justify-center border border-[#E8D5B7] hover:bg-[#F2E6D0]">
                              <Minus className="w-3 h-3 text-[#1A1108]" />
                            </button>
                            <span className="text-xs font-bold text-[#1A1108] w-4 text-center">{qty}</span>
                            <button onClick={() => addToCart(item)}
                              className="w-6 h-6 bg-[#BF4E19] text-white rounded-lg flex items-center justify-center hover:bg-[#A33D10]">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {filteredMenu.length === 0 && (
                    <div className="col-span-2 text-center py-6 text-gray-400 text-sm">No items found</div>
                  )}
                </div>
              </div>

              {/* Cart summary */}
              {cart.length > 0 && (
                <div className="bg-[#FAF3E8] rounded-2xl p-4 space-y-2">
                  <p className="text-sm font-bold text-[#1A1108] mb-3">
                    🛒 Cart ({cart.reduce((s, i) => s + i.qty, 0)} items)
                  </p>
                  {cart.map(line => (
                    <div key={line.menuItemId} className="flex items-center justify-between text-sm gap-2">
                      <span className="text-[#3D2B1A] flex-1 truncate">{line.qty} × {line.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-semibold text-[#1A1108]">{formatPrice(line.price * line.qty)}</span>
                        <button onClick={() => updateQty(line.menuItemId, 0)}
                          className="text-red-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-[#E8D5B7] pt-2 mt-2 space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>GST (5%)</span><span>{formatPrice(tax)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-[#1A1108]">
                      <span>Total</span>
                      <span className="text-[#BF4E19] text-base">{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-[#1A1108] mb-1.5">
                  Order Notes <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Special instructions, allergies, etc."
                  rows={2}
                  className="w-full px-4 py-3 bg-[#FAF3E8] border border-[#E8D5B7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19] resize-none"
                />
              </div>

              {/* Place order button */}
              <button
                onClick={placeOrder}
                disabled={saving || cart.length === 0}
                className="w-full bg-[#BF4E19] text-white py-4 rounded-2xl font-bold text-base hover:bg-[#A33D10] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                {saving ? (
                  <><RefreshCw className="w-5 h-5 animate-spin" /> Placing Order...</>
                ) : (
                  <>
                    {SOURCES.find(s => s.value === source)?.emoji} Place{" "}
                    {SOURCES.find(s => s.value === source)?.label} Order
                    {cart.length > 0 && ` — ${formatPrice(total)}`}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
