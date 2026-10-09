"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, QrCode } from "lucide-react";
import type { Category, MenuItem } from "@/lib/supabase/types";
import { formatPrice } from "@/lib/utils";

interface Props {
  categories: Category[];
  menuItems: (MenuItem & { category: Category })[];
}

export default function PublicMenuClient({ categories, menuItems }: Props) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search */}
      <div className="relative max-w-md mx-auto mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B4C35]" />
        <input
          type="text"
          placeholder="Search menu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-[#E8D5B7] rounded-2xl text-sm text-[#1A1108] placeholder:text-[#6B4C35] focus:outline-none focus:ring-2 focus:ring-[#BF4E19] focus:border-transparent"
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
        {allCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
              activeCategory === cat
                ? "bg-[#BF4E19] text-white shadow-md"
                : "bg-white text-[#3D2B1A] border border-[#E8D5B7] hover:border-[#BF4E19] hover:text-[#BF4E19]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-[#6B4C35]">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No items found</p>
          <p className="text-sm mt-1">Try a different category or search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group"
            >
              <div className="relative h-44 overflow-hidden">
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-400"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full bg-[#F2E6D0] flex items-center justify-center text-4xl">
                    ☕
                  </div>
                )}
                {!item.is_available && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="bg-white text-[#1A1108] text-xs font-semibold px-3 py-1.5 rounded-full">
                      Currently Unavailable
                    </span>
                  </div>
                )}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[#BF4E19] text-xs font-semibold px-2 py-1 rounded-full">
                  {item.category?.name}
                </div>
                {item.is_veg && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-white rounded border-2 border-green-600 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-green-600" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-[#1A1108] mb-1">{item.name}</h3>
                <p className="text-[#6B4C35] text-xs line-clamp-2 mb-3">
                  {item.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[#BF4E19] font-bold text-lg">
                    {formatPrice(item.price)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="mt-16 bg-[#1A1108] rounded-3xl p-8 text-center">
        <QrCode className="w-10 h-10 text-[#BF4E19] mx-auto mb-4" />
        <h3 className="font-display text-2xl font-bold text-white mb-2">
          Ready to order?
        </h3>
        <p className="text-[#6B4C35] mb-5">
          Scan the QR code on your table to order directly from your phone.
        </p>
        <Link
          href="/order"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#BF4E19] text-white rounded-xl font-semibold hover:bg-[#A33D10] transition-colors"
        >
          Order from Your Table
        </Link>
      </div>
    </div>
  );
}
