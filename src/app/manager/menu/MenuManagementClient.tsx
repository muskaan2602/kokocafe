"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Plus, Pencil, Trash2, Search, ToggleLeft, ToggleRight,
  X, Check, Upload, LayoutGrid, List, ImageIcon,
  AlertCircle, Loader2, ChevronUp, ChevronDown,
  Eye, EyeOff, IndianRupee,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import type { Category, MenuItem } from "@/lib/supabase/types";
import { formatPrice } from "@/lib/utils";

type MenuItemWithCat = MenuItem & { category: Category };
type ViewMode = "table" | "card";

interface Props {
  categories: Category[];
  menuItems: MenuItemWithCat[];
}

interface FormData {
  id?: string;
  category_id: string;
  name: string;
  description: string;
  price: string;
  image_url: string;
  is_veg: boolean;
  is_available: boolean;
  sort_order: string;
}

const EMPTY_FORM: FormData = {
  category_id: "",
  name: "",
  description: "",
  price: "",
  image_url: "",
  is_veg: true,
  is_available: true,
  sort_order: "0",
};

// ── Image uploader sub-component ─────────────────────────────────────────
function ImageUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  async function uploadFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (JPG, PNG, WebP)"); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB"); return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/menu/upload-image", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onChange(data.url);
      toast.success("Photo uploaded successfully");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed — please try again");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    // Reset input so same file can be selected again
    e.target.value = "";
  }

  function applyUrl() {
    const trimmed = urlInput.trim();
    if (!trimmed.startsWith("http")) {
      toast.error("Please enter a valid image URL starting with http");
      return;
    }
    onChange(trimmed);
    setShowUrlInput(false);
    setUrlInput("");
    toast.success("Image URL applied");
  }

  const hasImage = value && value.startsWith("http");

  return (
    <div className="space-y-2">
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileInput}
      />

      {/* Main upload area */}
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={`relative rounded-2xl overflow-hidden transition-all ${
          dragOver
            ? "ring-2 ring-[#E86A2A] ring-offset-2"
            : ""
        }`}
      >
        {hasImage ? (
          /* ── Has image — show preview with overlay controls ── */
          <div className="relative group">
            <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-[#F5EBDD]">
              <Image
                src={value}
                alt="Menu item photo"
                fill
                className="object-cover"
                sizes="480px"
              />
            </div>
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 bg-white text-[#2B1B14] px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#FFF7ED] transition-colors"
              >
                {uploading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                ) : (
                  <><Upload className="w-4 h-4" /> Change Photo</>
                )}
              </button>
              <button
                type="button"
                onClick={() => onChange("")}
                className="flex items-center gap-2 bg-red-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" /> Remove
              </button>
            </div>
            {/* Upload progress indicator */}
            {uploading && (
              <div className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
                <p className="text-white text-sm font-semibold">Uploading photo...</p>
              </div>
            )}
          </div>
        ) : (
          /* ── No image — show upload dropzone ── */
          <div
            onClick={() => !uploading && inputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
              dragOver
                ? "border-[#E86A2A] bg-[#FFF7ED]"
                : "border-[#E8D5C0] bg-[#FFF7ED]/50 hover:border-[#E86A2A] hover:bg-[#FFF7ED]"
            } ${uploading ? "pointer-events-none" : ""}`}
          >
            <div className="py-8 px-4 text-center">
              {uploading ? (
                <div className="space-y-3">
                  <Loader2 className="w-10 h-10 mx-auto text-[#E86A2A] animate-spin" />
                  <p className="text-sm font-semibold text-[#E86A2A]">Uploading photo...</p>
                  <p className="text-xs text-gray-400">Please wait</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-14 h-14 bg-[#F5EBDD] rounded-2xl flex items-center justify-center mx-auto">
                    <Upload className="w-7 h-7 text-[#E86A2A]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#2B1B14]">
                      Click to upload a photo
                    </p>
                    <p className="text-xs text-[#8B5E44] mt-1">
                      or drag and drop from your computer / phone
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {["JPG", "PNG", "WebP", "GIF"].map(f => (
                      <span key={f} className="text-[10px] bg-white border border-[#E8D5C0] text-[#8B5E44] px-2 py-0.5 rounded-full font-medium">
                        {f}
                      </span>
                    ))}
                    <span className="text-[10px] text-gray-400">· Max 5 MB</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Secondary actions row */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 text-xs text-[#E86A2A] font-semibold hover:text-[#C94F16] transition-colors disabled:opacity-50"
        >
          <Upload className="w-3.5 h-3.5" />
          {hasImage ? "Replace photo" : "Browse files"}
        </button>

        <button
          type="button"
          onClick={() => setShowUrlInput(p => !p)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          Use image URL instead
        </button>
      </div>

      {/* URL input — shown only when toggled */}
      {showUrlInput && (
        <div className="bg-[#FFF7ED] border border-[#E8D5C0] rounded-xl p-3 space-y-2 animate-fade-in">
          <p className="text-xs text-[#8B5E44] font-medium">Paste an image URL (from Google, Unsplash, etc.)</p>
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="https://example.com/image.jpg"
              onKeyDown={e => e.key === "Enter" && applyUrl()}
              autoFocus
              className="flex-1 px-3 py-2.5 bg-white border border-[#E8D5C0] rounded-xl text-sm text-[#2B1B14] placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E86A2A]"
            />
            <button
              type="button"
              onClick={applyUrl}
              className="px-4 py-2.5 bg-[#E86A2A] text-white rounded-xl text-sm font-semibold hover:bg-[#C94F16] transition-colors whitespace-nowrap"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => { setShowUrlInput(false); setUrlInput(""); }}
              className="p-2.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function MenuManagementClient({ categories, menuItems: initial }: Props) {
  const [items, setItems] = useState<MenuItemWithCat[]>(initial);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [filterAvail, setFilterAvail] = useState("All");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const supabase = createClient();
  const db = supabase as any;

  // ── Filtering ──────────────────────────────────────────────────────────
  const filtered = items.filter(item => {
    const matchCat   = filterCat === "All" || item.category?.name === filterCat;
    const matchSearch = search === "" || item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchAvail  = filterAvail === "All" ||
      (filterAvail === "available" ? item.is_available : !item.is_available);
    return matchCat && matchSearch && matchAvail;
  });

  const availableCount   = items.filter(i => i.is_available).length;
  const unavailableCount = items.filter(i => !i.is_available).length;

  // ── Modal handlers ─────────────────────────────────────────────────────
  function openAdd() {
    setForm({
      ...EMPTY_FORM,
      category_id: categories[0]?.id ?? "",
      sort_order: String(items.length + 1),
    });
    setModal("add");
  }

  function openEdit(item: MenuItemWithCat) {
    setForm({
      id: item.id,
      category_id: item.category_id,
      name: item.name,
      description: item.description ?? "",
      price: String(item.price),
      image_url: item.image_url ?? "",
      is_veg: item.is_veg,
      is_available: item.is_available,
      sort_order: String(item.sort_order),
    });
    setModal("edit");
  }

  // ── Save (add or edit) ─────────────────────────────────────────────────
  async function saveItem() {
    if (!form.name.trim()) { toast.error("Item name is required"); return; }
    if (!form.price || parseFloat(form.price) <= 0) { toast.error("Enter a valid price"); return; }
    if (!form.category_id) { toast.error("Please select a category"); return; }

    setSaving(true);
    try {
      const payload = {
        category_id: form.category_id,
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: parseFloat(form.price),
        image_url: form.image_url || null,
        is_veg: form.is_veg,
        is_available: form.is_available,
        sort_order: parseInt(form.sort_order) || 0,
      };

      if (modal === "edit" && form.id) {
        const { data, error } = await db.from("menu_items")
          .update(payload).eq("id", form.id)
          .select("*, category:categories(*)").single();
        if (error) throw error;
        setItems(p => p.map(i => i.id === form.id ? data : i));
        toast.success("Item updated successfully");
      } else {
        const { data, error } = await db.from("menu_items")
          .insert([payload])
          .select("*, category:categories(*)").single();
        if (error) throw error;
        setItems(p => [...p, data]);
        toast.success(`"${data.name}" added to menu`);
      }
      setModal(null);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────
  async function deleteItem(id: string, name: string) {
    if (!confirm(`Delete "${name}" from the menu? This cannot be undone.`)) return;
    const { error } = await db.from("menu_items").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setItems(p => p.filter(i => i.id !== id));
    toast.success(`"${name}" removed`);
  }

  // ── Toggle availability ────────────────────────────────────────────────
  async function toggleAvailability(item: MenuItemWithCat) {
    const next = !item.is_available;
    const { error } = await db.from("menu_items")
      .update({ is_available: next }).eq("id", item.id);
    if (error) { toast.error(error.message); return; }
    setItems(p => p.map(i => i.id === item.id ? { ...i, is_available: next } : i));
    toast.success(next ? `"${item.name}" is now available` : `"${item.name}" marked unavailable`);
  }

  // ── Bulk actions ───────────────────────────────────────────────────────
  function toggleSelect(id: string) {
    setBulkSelected(p => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function selectAll() {
    setBulkSelected(new Set(filtered.map(i => i.id)));
  }

  function clearSelection() { setBulkSelected(new Set()); }

  async function bulkSetAvailability(avail: boolean) {
    const ids = [...bulkSelected];
    const { error } = await db.from("menu_items")
      .update({ is_available: avail })
      .in("id", ids);
    if (error) { toast.error(error.message); return; }
    setItems(p => p.map(i => ids.includes(i.id) ? { ...i, is_available: avail } : i));
    toast.success(`${ids.length} item${ids.length > 1 ? "s" : ""} marked ${avail ? "available" : "unavailable"}`);
    setBulkSelected(new Set());
  }

  async function bulkDelete() {
    const ids = [...bulkSelected];
    if (!confirm(`Delete ${ids.length} item${ids.length > 1 ? "s" : ""}? This cannot be undone.`)) return;
    const { error } = await db.from("menu_items").delete().in("id", ids);
    if (error) { toast.error(error.message); return; }
    setItems(p => p.filter(i => !ids.includes(i.id)));
    toast.success(`${ids.length} item${ids.length > 1 ? "s" : ""} deleted`);
    setBulkSelected(new Set());
  }

  // ── Reorder (sort_order) ───────────────────────────────────────────────
  async function moveItem(item: MenuItemWithCat, dir: "up" | "down") {
    const catItems = items
      .filter(i => i.category_id === item.category_id)
      .sort((a, b) => a.sort_order - b.sort_order);
    const idx = catItems.findIndex(i => i.id === item.id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= catItems.length) return;

    const other = catItems[swapIdx];
    const [newOrder, otherOrder] = [other.sort_order, item.sort_order];

    await Promise.all([
      db.from("menu_items").update({ sort_order: newOrder }).eq("id", item.id),
      db.from("menu_items").update({ sort_order: otherOrder }).eq("id", other.id),
    ]);
    setItems(p => p.map(i =>
      i.id === item.id ? { ...i, sort_order: newOrder } :
      i.id === other.id ? { ...i, sort_order: otherOrder } : i
    ));
  }

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#2B1B14]">Menu Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {items.length} items · {availableCount} available · {unavailableCount} unavailable
          </p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-[#E86A2A] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#C94F16] transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Menu Item
        </button>
      </div>

      {/* ── Filters + view toggle ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search items or description..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E86A2A]" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E86A2A]">
          <option value="All">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
        </select>
        <select value={filterAvail} onChange={e => setFilterAvail(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E86A2A]">
          <option value="All">All Status</option>
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
        </select>
        {/* View toggle */}
        <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden">
          <button onClick={() => setViewMode("table")}
            className={`px-3 py-2.5 transition-colors ${viewMode === "table" ? "bg-[#E86A2A] text-white" : "text-gray-500 hover:bg-gray-50"}`}>
            <List className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode("card")}
            className={`px-3 py-2.5 transition-colors ${viewMode === "card" ? "bg-[#E86A2A] text-white" : "text-gray-500 hover:bg-gray-50"}`}>
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Bulk action bar ── */}
      {bulkSelected.size > 0 && (
        <div className="bg-[#2B1B14] text-white rounded-2xl px-5 py-3 flex items-center gap-4 flex-wrap animate-fade-in">
          <span className="font-semibold text-sm">{bulkSelected.size} selected</span>
          <button onClick={() => bulkSetAvailability(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 rounded-xl text-xs font-semibold hover:bg-green-700 transition-colors">
            <Eye className="w-3.5 h-3.5" /> Mark Available
          </button>
          <button onClick={() => bulkSetAvailability(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 rounded-xl text-xs font-semibold hover:bg-yellow-600 transition-colors">
            <EyeOff className="w-3.5 h-3.5" /> Mark Unavailable
          </button>
          <button onClick={bulkDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 rounded-xl text-xs font-semibold hover:bg-red-700 transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
          <button onClick={clearSelection} className="ml-auto text-gray-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── TABLE VIEW ── */}
      {viewMode === "table" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#FFF7ED] text-left">
                  <th className="px-4 py-3.5">
                    <input type="checkbox"
                      checked={bulkSelected.size === filtered.length && filtered.length > 0}
                      onChange={e => e.target.checked ? selectAll() : clearSelection()}
                      className="rounded" />
                  </th>
                  <th className="px-4 py-3.5 font-semibold text-[#2B1B14]">Item</th>
                  <th className="px-4 py-3.5 font-semibold text-[#2B1B14]">Category</th>
                  <th className="px-4 py-3.5 font-semibold text-[#2B1B14]">Price</th>
                  <th className="px-4 py-3.5 font-semibold text-[#2B1B14]">Type</th>
                  <th className="px-4 py-3.5 font-semibold text-[#2B1B14]">Status</th>
                  <th className="px-4 py-3.5 font-semibold text-[#2B1B14]">Order</th>
                  <th className="px-4 py-3.5 font-semibold text-[#2B1B14]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map(item => (
                  <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${!item.is_available ? "opacity-60" : ""}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={bulkSelected.has(item.id)}
                        onChange={() => toggleSelect(item.id)} className="rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-[#F5EBDD]">
                          {item.image_url ? (
                            <Image src={item.image_url} alt={item.name} fill
                              className="object-cover" sizes="44px" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-[#2B1B14]">{item.name}</div>
                          <div className="text-xs text-gray-400 line-clamp-1 max-w-[180px]">
                            {item.description ?? "No description"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm">
                      <span className="flex items-center gap-1">
                        <span>{item.category?.icon}</span>
                        {item.category?.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-[#E86A2A]">
                      {formatPrice(item.price)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        item.is_veg ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                        {item.is_veg ? "🟢 Veg" : "🔴 Non-veg"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleAvailability(item)}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                          item.is_available
                            ? "bg-green-50 text-green-700 hover:bg-green-100"
                            : "bg-red-50 text-red-600 hover:bg-red-100"}`}>
                        {item.is_available
                          ? <><ToggleRight className="w-4 h-4" /> Available</>
                          : <><ToggleLeft className="w-4 h-4" /> Unavailable</>}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => moveItem(item, "up")}
                          className="p-1 rounded hover:bg-gray-100 transition-colors text-gray-400 hover:text-[#2B1B14]">
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => moveItem(item, "down")}
                          className="p-1 rounded hover:bg-gray-100 transition-colors text-gray-400 hover:text-[#2B1B14]">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEdit(item)}
                          className="p-2 rounded-lg text-gray-400 hover:text-[#E86A2A] hover:bg-[#FFF7ED] transition-colors" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteItem(item.id, item.name)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-gray-400">
                      <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      No items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CARD VIEW ── */}
      {viewMode === "card" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(item => (
            <div key={item.id}
              className={`bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 group transition-all hover:shadow-md ${
                !item.is_available ? "opacity-60" : ""}`}>
              {/* Image */}
              <div className="relative h-44 overflow-hidden bg-[#F5EBDD]">
                {item.image_url ? (
                  <Image src={item.image_url} alt={item.name} fill
                    className="object-cover group-hover:scale-105 transition-transform duration-400"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
                )}
                {/* Checkbox overlay */}
                <div className="absolute top-3 left-3">
                  <input type="checkbox" checked={bulkSelected.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    className="w-4 h-4 rounded cursor-pointer" />
                </div>
                {/* Availability badge */}
                <div className="absolute top-3 right-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    item.is_available ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                    {item.is_available ? "Available" : "Unavailable"}
                  </span>
                </div>
                {/* Category */}
                <div className="absolute bottom-3 left-3">
                  <span className="bg-white/90 backdrop-blur-sm text-[#E86A2A] text-xs font-semibold px-2 py-1 rounded-full">
                    {item.category?.icon} {item.category?.name}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-1 gap-2">
                  <h3 className="font-bold text-[#2B1B14] leading-snug">{item.name}</h3>
                  <span className={`text-xs shrink-0 mt-0.5 ${item.is_veg ? "text-green-600" : "text-red-500"}`}>
                    {item.is_veg ? "🟢" : "🔴"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 line-clamp-2 mb-3 min-h-[2rem]">
                  {item.description ?? "No description added"}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-[#E86A2A]">{formatPrice(item.price)}</span>
                  <div className="flex gap-1.5">
                    <button onClick={() => toggleAvailability(item)}
                      className={`p-1.5 rounded-lg text-xs transition-colors ${
                        item.is_available ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-red-50 text-red-500 hover:bg-red-100"}`}
                      title={item.is_available ? "Mark unavailable" : "Mark available"}>
                      {item.is_available ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    </button>
                    <button onClick={() => openEdit(item)}
                      className="p-1.5 rounded-lg bg-[#FFF7ED] text-[#E86A2A] hover:bg-[#F5EBDD] transition-colors" title="Edit">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteItem(item.id, item.name)}
                      className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-400">
              <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
              No items found
            </div>
          )}
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between z-10">
              <div>
                <h2 className="font-bold text-[#2B1B14] text-xl">
                  {modal === "add" ? "Add New Menu Item" : `Edit — ${form.name}`}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {modal === "add" ? "Fill in details and upload a photo" : "Update item details"}
                </p>
              </div>
              <button onClick={() => setModal(null)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Image upload */}
              <div>
                <label className="block text-sm font-semibold text-[#2B1B14] mb-2">
                  Food Photo
                </label>
                <ImageUploader
                  value={form.image_url}
                  onChange={url => setForm(f => ({ ...f, image_url: url }))}
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-[#2B1B14] mb-1.5">
                  Item Name <span className="text-red-500">*</span>
                </label>
                <input type="text" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Caramel Latte, Paneer Wrap, Chocolate Brownie..."
                  className="w-full px-4 py-3 bg-[#FFF7ED] border border-[#E8D5C0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E86A2A]" />
              </div>

              {/* Category + Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#2B1B14] mb-1.5">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select value={form.category_id}
                    onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#FFF7ED] border border-[#E8D5C0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E86A2A]">
                    <option value="">Select category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#2B1B14] mb-1.5">
                    Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B5E44]" />
                    <input type="number" min="1" step="1" value={form.price}
                      onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                      placeholder="180"
                      className="w-full pl-9 pr-4 py-3 bg-[#FFF7ED] border border-[#E8D5C0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E86A2A]" />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-[#2B1B14] mb-1.5">
                  Description <span className="text-gray-400 font-normal">(shown to customers)</span>
                </label>
                <textarea value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. Creamy chilled coffee blended with milk and ice cream..."
                  rows={3}
                  className="w-full px-4 py-3 bg-[#FFF7ED] border border-[#E8D5C0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E86A2A] resize-none" />
                <p className="text-xs text-gray-400 mt-1">{form.description.length}/200 characters</p>
              </div>

              {/* Sort order */}
              <div>
                <label className="block text-sm font-semibold text-[#2B1B14] mb-1.5">
                  Sort Order <span className="text-gray-400 font-normal">(lower = appears first)</span>
                </label>
                <input type="number" min="0" value={form.sort_order}
                  onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))}
                  className="w-32 px-4 py-3 bg-[#FFF7ED] border border-[#E8D5C0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E86A2A]" />
              </div>

              {/* Veg + Availability toggles */}
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setForm(f => ({ ...f, is_veg: !f.is_veg }))}
                  className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold border-2 transition-all ${
                    form.is_veg
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-red-400 bg-red-50 text-red-700"}`}>
                  {form.is_veg ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  {form.is_veg ? "🟢 Vegetarian" : "🔴 Non-Vegetarian"}
                </button>
                <button type="button" onClick={() => setForm(f => ({ ...f, is_available: !f.is_available }))}
                  className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold border-2 transition-all ${
                    form.is_available
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-300 bg-gray-50 text-gray-500"}`}>
                  {form.is_available ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  {form.is_available ? "Available" : "Unavailable"}
                </button>
              </div>

              {/* Save button */}
              <button onClick={saveItem} disabled={saving}
                className="w-full bg-[#E86A2A] text-white py-4 rounded-2xl font-semibold text-base hover:bg-[#C94F16] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm">
                {saving ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
                ) : (
                  modal === "add" ? "Add to Menu" : "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
