"use client";

import { useState } from "react";
import { Plus, Trash2, Pencil, GripVertical, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import type { Category } from "@/lib/supabase/types";

interface Props { categories: Category[] }

export default function CategoriesClient({ categories: initial }: Props) {
  const [categories, setCategories] = useState<Category[]>(initial);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState({ id: "", name: "", icon: "", sort_order: "0" });
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  function openAdd() {
    setForm({ id: "", name: "", icon: "", sort_order: String(categories.length + 1) });
    setModal("add");
  }

  function openEdit(cat: Category) {
    setForm({ id: cat.id, name: cat.name, icon: cat.icon ?? "", sort_order: String(cat.sort_order) });
    setModal("edit");
  }

  async function save() {
    if (!form.name) { toast.error("Name required"); return; }
    setSaving(true);
    try {
      const payload = { name: form.name, icon: form.icon || null, sort_order: parseInt(form.sort_order) };
      const db = supabase as any;
      if (modal === "edit" && form.id) {
        const { data, error } = await db.from("categories").update(payload).eq("id", form.id).select().single();
        if (error) throw error;
        setCategories(prev => prev.map(c => c.id === form.id ? data as Category : c));
        toast.success("Category updated");
      } else {
        const { data, error } = await db.from("categories").insert([payload]).select().single();
        if (error) throw error;
        setCategories(prev => [...prev, data as Category]);
        toast.success("Category added");
      }
      setModal(null);
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  }

  async function del(id: string) {
    if (!confirm("Delete this category? All items in it will also be removed.")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setCategories(prev => prev.filter(c => c.id !== id));
    toast.success("Deleted");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2B1B14]">Categories</h1>
          <p className="text-gray-500 text-sm mt-0.5">{categories.length} categories</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-[#E86A2A] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#C94F16] transition-colors">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#FFF7ED] text-left">
              <th className="px-5 py-3.5 font-semibold text-[#2B1B14]">Category</th>
              <th className="px-4 py-3.5 font-semibold text-[#2B1B14]">Icon</th>
              <th className="px-4 py-3.5 font-semibold text-[#2B1B14]">Sort Order</th>
              <th className="px-4 py-3.5 font-semibold text-[#2B1B14]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-50">
                <td className="px-5 py-3.5 font-medium text-[#2B1B14]">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-gray-300" />
                    {cat.name}
                  </div>
                </td>
                <td className="px-4 py-3.5 text-xl">{cat.icon}</td>
                <td className="px-4 py-3.5 text-gray-500">{cat.sort_order}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(cat)} className="p-2 rounded-lg text-gray-400 hover:text-[#E86A2A] hover:bg-[#FFF7ED] transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => del(cat.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[#2B1B14]">{modal === "add" ? "Add Category" : "Edit Category"}</h2>
              <button onClick={() => setModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#2B1B14] mb-1.5">Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Coffee" className="w-full px-4 py-3 bg-[#FFF7ED] border border-[#E8D5C0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E86A2A]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-[#2B1B14] mb-1.5">Icon (emoji)</label>
                  <input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="☕" className="w-full px-4 py-3 bg-[#FFF7ED] border border-[#E8D5C0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E86A2A]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#2B1B14] mb-1.5">Sort Order</label>
                  <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} className="w-full px-4 py-3 bg-[#FFF7ED] border border-[#E8D5C0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E86A2A]" />
                </div>
              </div>
              <button onClick={save} disabled={saving} className="w-full bg-[#E86A2A] text-white py-3 rounded-2xl font-semibold hover:bg-[#C94F16] transition-colors disabled:opacity-60">
                {saving ? "Saving..." : (modal === "add" ? "Add Category" : "Update")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
