"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ShoppingCart, Trash2, Plus, Minus, MapPin, ChevronRight
} from "lucide-react";
import { useCart } from "@/lib/cart-context";
import type { CafeTable } from "@/lib/supabase/types";
import { formatPrice, calculateTax } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

const TAX_RATE = 0.05;

interface Props {
  table: CafeTable;
  tableToken: string;
}

export default function CartClient({ table, tableToken }: Props) {
  const router = useRouter();
  const { items, totalItems, subtotal, removeItem, updateQty, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");

  const tax = calculateTax(subtotal, TAX_RATE);
  const total = subtotal + tax;
  const tableLabel = `Table ${table.table_number.replace(/\D/g, "").padStart(2, "0")}`;

  async function handlePlaceOrder() {
    if (items.length === 0) return;
    setLoading(true);

    try {
      const supabase = createClient();
      const db = supabase as any;

      // Create order
      const { data: orderData, error: orderError } = await db
        .from("orders")
        .insert([{
          table_id: table.id,
          status: "pending",
          subtotal: Math.round(subtotal * 100) / 100,
          tax: Math.round(tax * 100) / 100,
          total: Math.round(total * 100) / 100,
          notes: orderNotes || null,
        }])
        .select("id, order_number")
        .single();

      if (orderError || !orderData) throw new Error((orderError as any)?.message ?? "Order failed");

      const order = orderData as { id: string; order_number: string };

      // Insert order items
      const { error: itemsError } = await db.from("order_items").insert(
        items.map((item) => ({
          order_id: order.id,
          menu_item_id: item.menuItemId,
          item_name: item.name,
          quantity: item.quantity,
          price: item.price,
          special_instructions: item.specialInstructions || null,
        }))
      );

      if (itemsError) throw new Error((itemsError as any).message);

      // Update table status
      await db.from("tables").update({ status: "occupied" }).eq("id", table.id);

      clearCart();
      router.push(`/order/${tableToken}/confirmation/${order.id}`);
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (totalItems === 0) {
    return (
      <div className="min-h-screen bg-[#FFF7ED] flex items-center justify-center px-4">
        <div className="text-center max-w-xs">
          <div className="w-20 h-20 bg-[#F5EBDD] rounded-3xl flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-10 h-10 text-[#E86A2A]" />
          </div>
          <h2 className="font-display text-2xl font-bold text-[#2B1B14] mb-2">
            Your cart is empty
          </h2>
          <p className="text-[#8B5E44] text-sm mb-6">
            Go back and add some delicious items!
          </p>
          <Link
            href={`/order/${tableToken}`}
            className="inline-flex items-center gap-2 bg-[#E86A2A] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#C94F16] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF7ED]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#F5EBDD] shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href={`/order/${tableToken}`}
            className="p-2 rounded-xl hover:bg-[#F5EBDD] transition-colors text-[#2B1B14]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="font-display font-bold text-[#2B1B14] text-lg">
              Your Cart
            </h1>
            <div className="text-xs text-[#8B5E44] flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#E86A2A]" />
              {tableLabel}
            </div>
          </div>
          <span className="text-sm text-[#8B5E44]">
            {totalItems} item{totalItems !== 1 ? "s" : ""}
          </span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 pb-40">
        {/* Items */}
        <div className="space-y-3 mb-6">
          {items.map((item) => (
            <div
              key={item.menuItemId}
              className="bg-white rounded-3xl p-4 shadow-sm border border-[#F5EBDD]"
            >
              <div className="flex gap-3">
                {item.imageUrl && (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div
                        className={`w-3.5 h-3.5 shrink-0 border-2 rounded flex items-center justify-center ${
                          item.isVeg ? "border-green-600" : "border-red-600"
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.isVeg ? "bg-green-600" : "bg-red-600"
                          }`}
                        />
                      </div>
                      <h3 className="font-semibold text-[#2B1B14] text-sm truncate">
                        {item.name}
                      </h3>
                    </div>
                    <button
                      onClick={() => removeItem(item.menuItemId)}
                      className="text-red-400 hover:text-red-600 transition-colors p-1 shrink-0"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item.menuItemId, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg bg-[#F5EBDD] flex items-center justify-center hover:bg-[#E8D5C0] transition-colors"
                      >
                        <Minus className="w-3 h-3 text-[#2B1B14]" />
                      </button>
                      <span className="font-semibold text-[#2B1B14] text-sm w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(item.menuItemId, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-[#F5EBDD] flex items-center justify-center hover:bg-[#E8D5C0] transition-colors"
                      >
                        <Plus className="w-3 h-3 text-[#2B1B14]" />
                      </button>
                    </div>
                    <span className="font-bold text-[#E86A2A]">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>

                  {item.specialInstructions && (
                    <p className="text-xs text-[#8B5E44] mt-1.5 bg-[#FFF7ED] px-2 py-1 rounded-lg">
                      📝 {item.specialInstructions}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order notes */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-[#F5EBDD] mb-6">
          <label className="text-sm font-semibold text-[#2B1B14] mb-2 block">
            Order Notes{" "}
            <span className="font-normal text-[#8B5E44]">(optional)</span>
          </label>
          <textarea
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            placeholder="Any special requests for the whole order..."
            rows={3}
            className="w-full px-3 py-2.5 bg-[#FFF7ED] border border-[#E8D5C0] rounded-xl text-sm text-[#2B1B14] placeholder:text-[#8B5E44] focus:outline-none focus:ring-2 focus:ring-[#E86A2A] resize-none"
          />
        </div>

        {/* Bill summary */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#F5EBDD] mb-6">
          <h3 className="font-semibold text-[#2B1B14] mb-4">Bill Details</h3>
          <div className="space-y-2 text-sm">
            {items.map((item) => (
              <div key={item.menuItemId} className="flex justify-between text-[#5C3D2E]">
                <span>{item.name} × {item.quantity}</span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t border-[#F5EBDD] pt-2 mt-2 flex justify-between text-[#5C3D2E]">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-[#5C3D2E]">
              <span>GST (5%)</span>
              <span>{formatPrice(tax)}</span>
            </div>
            <div className="border-t border-[#F5EBDD] pt-3 mt-1 flex justify-between font-bold text-[#2B1B14] text-base">
              <span>Total</span>
              <span className="text-[#E86A2A]">{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#F5EBDD] p-4 shadow-2xl">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#8B5E44] flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#E86A2A]" /> {tableLabel}
            </span>
            <span className="font-bold text-[#2B1B14]">
              Total: {formatPrice(total)}
            </span>
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={loading}
            className="w-full bg-[#E86A2A] text-white py-4 rounded-2xl font-semibold text-base hover:bg-[#C94F16] transition-colors shadow-sm active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Placing Order...
              </>
            ) : (
              <>
                PLACE ORDER <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
