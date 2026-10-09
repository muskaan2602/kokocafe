"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  Bell, ChefHat, CheckCircle2, XCircle, RefreshCw,
  ShoppingBag, AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { OrderStatus } from "@/lib/supabase/types";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

type AnyOrder = any;

// ── Source config (shared with delivery page) ──────────────────────────
const SOURCE_META: Record<string, { emoji: string; label: string; color: string }> = {
  dine_in:  { emoji: "🍽️", label: "Dine-in",  color: "bg-[#FAF3E8] text-[#BF4E19] border-[#E8D5B7]" },
  zomato:   { emoji: "🔴", label: "Zomato",   color: "bg-red-50 text-red-700 border-red-200"          },
  swiggy:   { emoji: "🟠", label: "Swiggy",   color: "bg-orange-50 text-orange-700 border-orange-200"  },
  phone:    { emoji: "📞", label: "Phone",    color: "bg-blue-50 text-blue-700 border-blue-200"        },
  takeaway: { emoji: "🛍️", label: "Takeaway", color: "bg-purple-50 text-purple-700 border-purple-200"  },
  other:    { emoji: "📦", label: "Other",    color: "bg-gray-50 text-gray-600 border-gray-200"        },
};

function SourceBadge({ source }: { source?: string }) {
  const m = SOURCE_META[source ?? "dine_in"] ?? SOURCE_META.dine_in;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${m.color}`}>
      {m.emoji} {m.label}
    </span>
  );
}

const STATUS_FLOW: Record<OrderStatus, OrderStatus | null> = {
  pending: "accepted", accepted: "preparing",
  preparing: "ready",  ready: "completed",
  completed: null,     rejected: null,
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:   { label: "NEW ORDER",  color: "text-red-700",    bg: "bg-red-50",    border: "border-red-200"    },
  accepted:  { label: "ACCEPTED",   color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200"   },
  preparing: { label: "PREPARING",  color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  ready:     { label: "READY",      color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200"  },
  completed: { label: "COMPLETED",  color: "text-gray-500",   bg: "bg-gray-50",   border: "border-gray-200"   },
  rejected:  { label: "REJECTED",   color: "text-red-500",    bg: "bg-red-50",    border: "border-red-200"    },
};

const NEXT_BUTTON: Record<string, string> = {
  pending: "ACCEPT ORDER", accepted: "START PREPARING",
  preparing: "MARK READY",  ready: "COMPLETE",
};

interface Props {
  initialOrders: AnyOrder[];
  initialCompleted: AnyOrder[];
}

export default function LiveOrdersClient({ initialOrders, initialCompleted }: Props) {
  const [activeOrders, setActiveOrders] = useState<AnyOrder[]>(initialOrders);
  const [completedOrders, setCompletedOrders] = useState<AnyOrder[]>(initialCompleted);
  const [updating, setUpdating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  const [filterSource, setFilterSource] = useState<string>("all");
  const supabase = createClient();

  const fetchOrder = useCallback(async (id: string): Promise<any> => {
    const db = supabase as any;
    const { data } = await db
      .from("orders")
      .select("*, order_items(*), table:tables(*)")
      .eq("id", id)
      .single();
    return data;
  }, [supabase]);

  useEffect(() => {
    const channel = supabase
      .channel("live_orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" },
        async (payload) => {
          const order = await fetchOrder(payload.new.id);
          if (order) {
            setActiveOrders((prev) => [order, ...prev]);
            const src = SOURCE_META[order.order_source ?? "dine_in"] ?? SOURCE_META.dine_in;
            toast.custom((t) => (
              <div className={`bg-[#1A1108] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 ${t.visible ? "animate-bounce-in" : ""}`}>
                <Bell className="w-5 h-5 text-[#BF4E19]" />
                <div>
                  <p className="font-semibold text-sm">
                    {src.emoji} New {src.label} Order
                  </p>
                  <p className="text-xs text-gray-400">
                    {order.order_source === "dine_in"
                      ? `Table ${(order.table?.table_number ?? "").replace(/\D/g, "").padStart(2, "0")}`
                      : order.customer_name ?? `#${order.order_number}`}
                  </p>
                </div>
              </div>
            ), { duration: 5000 });
          }
        }
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" },
        async (payload) => {
          const order = await fetchOrder(payload.new.id);
          if (!order) return;
          const newStatus = payload.new.status as OrderStatus;
          if (newStatus === "completed" || newStatus === "rejected") {
            setActiveOrders((prev) => prev.filter((o) => o.id !== order.id));
            setCompletedOrders((prev) => [order, ...prev]);
          } else {
            setActiveOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, fetchOrder]);

  async function updateStatus(orderId: string, newStatus: OrderStatus) {
    setUpdating(orderId);
    const db = supabase as any;
    try {
      const { error } = await db.from("orders").update({ status: newStatus }).eq("id", orderId);
      if (error) throw error;
      if (newStatus === "completed" || newStatus === "rejected") {
        const order = activeOrders.find((o) => o.id === orderId);
        if (order?.table?.id && order.order_source === "dine_in") {
          await db.from("tables").update({ status: "available" }).eq("id", order.table.id);
        }
      }
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update order");
    } finally {
      setUpdating(null);
    }
  }

  // Filter by source
  const visibleActive = activeOrders.filter(o =>
    filterSource === "all" || (o.order_source ?? "dine_in") === filterSource
  );
  const visibleCompleted = completedOrders.filter(o =>
    filterSource === "all" || (o.order_source ?? "dine_in") === filterSource
  );

  function renderOrderCard(order: AnyOrder, isCompleted = false) {
    const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
    const nextStatus = STATUS_FLOW[order.status as OrderStatus];
    const src = order.order_source ?? "dine_in";
    const isDineIn = src === "dine_in";
    const tableLabel = isDineIn
      ? `TABLE ${(order.table?.table_number ?? "").replace(/\D/g, "").padStart(2, "0")}`
      : order.customer_name ?? "Delivery";

    return (
      <div key={order.id}
        className={`${cfg.bg} border-2 ${cfg.border} rounded-3xl p-5 space-y-4 ${
          order.status === "pending" ? "animate-bounce-in ring-2 ring-red-300 ring-offset-2" : ""}`}>

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full bg-white ${cfg.color}`}>
                {cfg.label}
              </span>
              <SourceBadge source={src} />
              {order.status === "pending" && (
                <Bell className="w-4 h-4 text-red-500 animate-bounce" />
              )}
            </div>
            <h3 className="font-bold text-[#1A1108] text-lg">Order #{order.order_number}</h3>
            <p className="text-sm font-semibold text-[#3D2B1A]">{tableLabel}</p>
            {!isDineIn && order.customer_phone && (
              <p className="text-xs text-gray-500">📞 {order.customer_phone}</p>
            )}
            {!isDineIn && order.external_order_id && (
              <p className="text-xs text-gray-400">
                Platform ID: <span className="font-mono font-semibold">{order.external_order_id}</span>
              </p>
            )}
            {!isDineIn && order.delivery_address && (
              <p className="text-xs text-gray-400">📍 {order.delivery_address}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm text-gray-500">{format(new Date(order.created_at), "hh:mm a")}</div>
            <div className="text-xs text-gray-400 mt-0.5">{format(new Date(order.created_at), "dd MMM")}</div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white/60 rounded-2xl p-3 space-y-1">
          {order.order_items?.map((item: any) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-[#3D2B1A]">
                {item.quantity} × {item.item_name}
                {item.special_instructions && (
                  <span className="text-[#6B4C35] block text-xs">↳ {item.special_instructions}</span>
                )}
              </span>
              <span className="font-medium text-[#1A1108] shrink-0 ml-2">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
          {order.notes && (
            <p className="text-xs text-[#6B4C35] mt-2 pt-2 border-t border-white/60">📝 {order.notes}</p>
          )}
        </div>

        {/* Bill */}
        <div className="text-sm space-y-1">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>GST (5%)</span><span>{formatPrice(order.tax)}</span>
          </div>
          <div className="flex justify-between font-bold text-[#1A1108] text-base pt-1 border-t border-white/60">
            <span>Total</span>
            <span className="text-[#BF4E19]">{formatPrice(order.total)}</span>
          </div>
        </div>

        {/* Actions */}
        {!isCompleted && nextStatus && (
          <div className="flex gap-2">
            <button onClick={() => updateStatus(order.id, nextStatus)}
              disabled={updating === order.id}
              className="flex-1 bg-[#BF4E19] text-white py-3 rounded-2xl text-sm font-bold hover:bg-[#A33D10] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {updating === order.id ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {nextStatus === "accepted"  && <CheckCircle2 className="w-4 h-4" />}
                  {nextStatus === "preparing" && <ChefHat className="w-4 h-4" />}
                  {nextStatus === "ready"     && <Bell className="w-4 h-4" />}
                  {nextStatus === "completed" && <CheckCircle2 className="w-4 h-4" />}
                  {NEXT_BUTTON[order.status]}
                </>
              )}
            </button>
            {order.status === "pending" && (
              <button onClick={() => updateStatus(order.id, "rejected")}
                disabled={updating === order.id}
                className="px-4 py-3 bg-white text-red-500 border-2 border-red-200 rounded-2xl text-sm font-bold hover:bg-red-50 transition-colors disabled:opacity-60 flex items-center gap-1">
                <XCircle className="w-4 h-4" /> REJECT
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1108]">Live Orders</h1>
          <p className="text-gray-500 text-sm mt-0.5">Real-time order management — all sources</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-green-600 font-medium">Live</span>
        </div>
      </div>

      {/* Source filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: "all", label: "All Orders", emoji: "📋" },
          ...Object.entries(SOURCE_META).map(([v, m]) => ({ value: v, label: m.label, emoji: m.emoji })),
        ].map(s => (
          <button key={s.value} onClick={() => setFilterSource(s.value)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors border ${
              filterSource === s.value
                ? "bg-[#1A1108] text-white border-[#1A1108]"
                : "bg-white text-gray-600 border-gray-200 hover:border-[#BF4E19] hover:text-[#BF4E19]"}`}>
            {s.emoji} {s.label}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white rounded-2xl p-1 w-fit shadow-sm border border-gray-100">
        <button onClick={() => setActiveTab("active")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "active" ? "bg-[#BF4E19] text-white shadow-sm" : "text-gray-500 hover:text-[#1A1108]"}`}>
          <ShoppingBag className="w-4 h-4" />
          Active Orders
          {visibleActive.length > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
              activeTab === "active" ? "bg-white/20 text-white" : "bg-[#BF4E19] text-white"}`}>
              {visibleActive.length}
            </span>
          )}
        </button>
        <button onClick={() => setActiveTab("completed")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "completed" ? "bg-[#BF4E19] text-white shadow-sm" : "text-gray-500 hover:text-[#1A1108]"}`}>
          <CheckCircle2 className="w-4 h-4" />
          Completed
          {visibleCompleted.length > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
              activeTab === "completed" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"}`}>
              {visibleCompleted.length}
            </span>
          )}
        </button>
      </div>

      {/* Active orders */}
      {activeTab === "active" && (
        visibleActive.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm">
            <ShoppingBag className="w-14 h-14 mx-auto mb-4 text-gray-200" />
            <h3 className="text-lg font-semibold text-gray-400">No active orders</h3>
            <p className="text-gray-400 text-sm mt-1">New orders appear here automatically</p>
            <div className="flex items-center justify-center gap-2 mt-4 text-green-500 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Listening for new orders...
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {visibleActive.filter(o => o.status === "pending").map(o => renderOrderCard(o))}
            {visibleActive.filter(o => o.status !== "pending").map(o => renderOrderCard(o))}
          </div>
        )
      )}

      {/* Completed orders */}
      {activeTab === "completed" && (
        visibleCompleted.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm">
            <AlertCircle className="w-14 h-14 mx-auto mb-4 text-gray-200" />
            <h3 className="text-lg font-semibold text-gray-400">No completed orders yet</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {visibleCompleted.map(o => renderOrderCard(o, true))}
          </div>
        )
      )}
    </div>
  );
}
