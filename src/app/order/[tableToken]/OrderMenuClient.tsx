"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, ShoppingCart, MapPin, ChevronRight, X, Plus, Minus, Coffee } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import type { CafeTable, Category, MenuItem } from "@/lib/supabase/types";
import { formatPrice } from "@/lib/utils";

interface Props {
  table: CafeTable;
  categories: Category[];
  menuItems: (MenuItem & { category: Category })[];
  tableToken: string;
}

interface ItemDetailModal {
  item: MenuItem & { category: Category };
  qty: number;
  instructions: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  Coffee: "☕",
  "Hot Beverages": "🍵",
  "Cold Beverages": "🥤",
  Breakfast: "🍳",
  Snacks: "🍟",
  Sandwiches: "🥪",
  Pizza: "🍕",
  Pasta: "🍝",
  Bakery: "🥐",
  Desserts: "🍮",
  Cakes: "🎂",
};

export default function OrderMenuClient({
  table,
  categories,
  menuItems,
  tableToken,
}: Props) {
  const { items, totalItems, subtotal, addItem } = useCart();
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ItemDetailModal | null>(null);

  const tableLabel = `Table ${table.table_number.replace(/\D/g, "").padStart(2, "0")}`;

  const filtered = menuItems.filter((item) => {
    const matchCat =
      activeCategory === "All" || item.category?.name === activeCategory;
    const matchSearch =
      search === "" ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description ?? "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const allCategories = ["All", ...categories.map((c) => c.name)];

  function openModal(item: MenuItem & { category: Category }) {
    setModal({ item, qty: 1, instructions: "" });
  }

  function handleAddToCart() {
    if (!modal) return;
    addItem({
      menuItemId: modal.item.id,
      name: modal.item.name,
      price: modal.item.price,
      quantity: modal.qty,
      imageUrl: modal.item.image_url,
      specialInstructions: modal.instructions,
      isVeg: modal.item.is_veg,
    });
    setModal(null);
  }

  const cartItem = items.find((i) => i.menuItemId === modal?.item.id);

  return (
    <div className="min-h-screen bg-[#FFF7ED]">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#F5EBDD] shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#E86A2A] rounded-xl flex items-center justify-center shrink-0">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-bold text-[#2B1B14] text-base leading-none">
                KOKO – Café & Bakers
              </div>
              <div className="text-xs text-[#8B5E44] mt-0.5">
                Freshly brewed. Freshly baked.
              </div>
            </div>
            <div className="flex items-center gap-1 bg-[#FFF7ED] border border-[#E8D5C0] rounded-xl px-3 py-1.5 shrink-0">
              <MapPin className="w-3 h-3 text-[#E86A2A]" />
              <span className="text-xs font-semibold text-[#2B1B14]">
                {tableLabel}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pb-32">
        {/* Table banner */}
        <div className="bg-[#E86A2A] rounded-2xl px-5 py-3 mt-4 flex items-center gap-3">
          <MapPin className="w-5 h-5 text-white shrink-0" />
          <p className="text-white text-sm font-medium">
            You&apos;re ordering from{" "}
            <span className="font-bold">{tableLabel}</span>
          </p>
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B5E44]" />
          <input
            type="text"
            placeholder="Search food & drinks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#E8D5C0] rounded-2xl text-sm text-[#2B1B14] placeholder:text-[#8B5E44] focus:outline-none focus:ring-2 focus:ring-[#E86A2A] focus:border-transparent"
          />
        </div>

        {/* Category scroll */}
        <div className="flex gap-2 overflow-x-auto py-4 scrollbar-hide">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                activeCategory === cat
                  ? "bg-[#E86A2A] text-white shadow-md"
                  : "bg-white text-[#5C3D2E] border border-[#E8D5C0] hover:border-[#E86A2A] hover:text-[#E86A2A]"
              }`}
            >
              <span>{CATEGORY_ICONS[cat] ?? "🍽️"}</span>
              <span>{cat}</span>
            </button>
          ))}
        </div>

        {/* Items */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-[#8B5E44]">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No items found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#F5EBDD] flex gap-0 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
                onClick={() => item.is_available && openModal(item)}
              >
                {/* Info */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    {/* Veg / non-veg indicator */}
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                          item.is_veg
                            ? "border-green-600"
                            : "border-red-600"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            item.is_veg ? "bg-green-600" : "bg-red-600"
                          }`}
                        />
                      </div>
                      <span className="text-xs text-[#8B5E44]">
                        {item.category?.name}
                      </span>
                    </div>
                    <h3 className="font-semibold text-[#2B1B14] text-base leading-snug">
                      {item.name}
                    </h3>
                    <p className="text-[#8B5E44] text-xs mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[#E86A2A] font-bold text-lg">
                      {formatPrice(item.price)}
                    </span>
                    {item.is_available ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal(item);
                        }}
                        className="flex items-center gap-1 bg-[#E86A2A] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#C94F16] transition-colors shadow-sm active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                        ADD
                      </button>
                    ) : (
                      <span className="text-xs text-[#8B5E44] bg-[#F5EBDD] px-3 py-1.5 rounded-xl">
                        Unavailable
                      </span>
                    )}
                  </div>
                </div>

                {/* Image */}
                <div className="relative w-32 h-auto shrink-0 overflow-hidden rounded-r-3xl">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className={`object-cover ${!item.is_available ? "opacity-50 grayscale" : ""}`}
                      sizes="128px"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#F5EBDD] flex items-center justify-center text-3xl">
                      ☕
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky cart bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-[#FFF7ED] via-[#FFF7ED]/80 to-transparent pt-6">
          <div className="max-w-2xl mx-auto">
            <Link
              href={`/order/${tableToken}/cart`}
              className="flex items-center justify-between w-full bg-[#E86A2A] text-white px-6 py-4 rounded-2xl shadow-xl hover:bg-[#C94F16] transition-colors active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingCart className="w-6 h-6" />
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-white text-[#E86A2A] rounded-full text-xs font-bold flex items-center justify-center">
                    {totalItems}
                  </div>
                </div>
                <span className="font-semibold">View Cart · {totalItems} item{totalItems !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">{formatPrice(subtotal)}</span>
                <ChevronRight className="w-5 h-5" />
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Item detail modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setModal(null)}
          />
          <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
            {/* Image */}
            <div className="relative h-56 overflow-hidden rounded-t-3xl">
              {modal.item.image_url ? (
                <Image
                  src={modal.item.image_url}
                  alt={modal.item.name}
                  fill
                  className="object-cover"
                  sizes="512px"
                />
              ) : (
                <div className="w-full h-full bg-[#F5EBDD] flex items-center justify-center text-6xl">
                  ☕
                </div>
              )}
              <button
                onClick={() => setModal(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
              >
                <X className="w-4 h-4 text-[#2B1B14]" />
              </button>
              {modal.item.is_veg && (
                <div className="absolute top-4 left-4 w-6 h-6 bg-white rounded border-2 border-green-600 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-600" />
                </div>
              )}
            </div>

            <div className="p-5">
              <div className="flex items-start justify-between mb-2">
                <h2 className="font-display text-xl font-bold text-[#2B1B14] flex-1 pr-3">
                  {modal.item.name}
                </h2>
                <span className="text-[#E86A2A] font-bold text-xl shrink-0">
                  {formatPrice(modal.item.price)}
                </span>
              </div>
              <p className="text-[#8B5E44] text-sm leading-relaxed mb-5">
                {modal.item.description}
              </p>

              {/* Qty selector */}
              <div className="mb-5">
                <label className="text-sm font-semibold text-[#2B1B14] mb-2 block">
                  Quantity
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() =>
                      setModal((m) =>
                        m ? { ...m, qty: Math.max(1, m.qty - 1) } : m
                      )
                    }
                    className="w-10 h-10 rounded-xl bg-[#F5EBDD] flex items-center justify-center hover:bg-[#E8D5C0] transition-colors"
                  >
                    <Minus className="w-4 h-4 text-[#2B1B14]" />
                  </button>
                  <span className="text-xl font-bold text-[#2B1B14] w-8 text-center">
                    {modal.qty}
                  </span>
                  <button
                    onClick={() =>
                      setModal((m) => (m ? { ...m, qty: m.qty + 1 } : m))
                    }
                    className="w-10 h-10 rounded-xl bg-[#F5EBDD] flex items-center justify-center hover:bg-[#E8D5C0] transition-colors"
                  >
                    <Plus className="w-4 h-4 text-[#2B1B14]" />
                  </button>
                  <span className="text-sm text-[#8B5E44] ml-2">
                    = {formatPrice(modal.item.price * modal.qty)}
                  </span>
                </div>
              </div>

              {/* Special instructions */}
              <div className="mb-6">
                <label className="text-sm font-semibold text-[#2B1B14] mb-2 block">
                  Special Instructions{" "}
                  <span className="font-normal text-[#8B5E44]">(optional)</span>
                </label>
                <textarea
                  value={modal.instructions}
                  onChange={(e) =>
                    setModal((m) =>
                      m ? { ...m, instructions: e.target.value } : m
                    )
                  }
                  placeholder="E.g. Less sugar, extra spicy, no onions..."
                  rows={3}
                  className="w-full px-4 py-3 bg-[#FFF7ED] border border-[#E8D5C0] rounded-2xl text-sm text-[#2B1B14] placeholder:text-[#8B5E44] focus:outline-none focus:ring-2 focus:ring-[#E86A2A] resize-none"
                />
              </div>

              <button
                onClick={handleAddToCart}
                className="w-full bg-[#E86A2A] text-white py-4 rounded-2xl font-semibold text-base hover:bg-[#C94F16] transition-colors shadow-sm active:scale-[0.98]"
              >
                {cartItem
                  ? `Update Cart — ${formatPrice(modal.item.price * modal.qty)}`
                  : `ADD TO CART — ${formatPrice(modal.item.price * modal.qty)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
