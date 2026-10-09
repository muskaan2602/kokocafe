import { createClient } from "@/lib/supabase/server";
import { formatPrice, formatDateTimeIN } from "@/lib/utils";
import {
  TrendingUp, ShoppingBag, IndianRupee, Clock,
  BarChart3, Users, Bike,
} from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";

export const revalidate = 60;

// Source display config
const SOURCE_META: Record<string, { emoji: string; label: string; color: string; bar: string }> = {
  dine_in:  { emoji: "🍽️", label: "Dine-in",  color: "bg-[#FAF3E8] text-[#BF4E19]",         bar: "bg-[#BF4E19]"  },
  zomato:   { emoji: "🔴", label: "Zomato",   color: "bg-red-50 text-red-700",               bar: "bg-red-500"    },
  swiggy:   { emoji: "🟠", label: "Swiggy",   color: "bg-orange-50 text-orange-700",         bar: "bg-orange-500" },
  phone:    { emoji: "📞", label: "Phone",    color: "bg-blue-50 text-blue-700",             bar: "bg-blue-500"   },
  takeaway: { emoji: "🛍️", label: "Takeaway", color: "bg-purple-50 text-purple-700",         bar: "bg-purple-500" },
  other:    { emoji: "📦", label: "Other",    color: "bg-gray-50 text-gray-600",             bar: "bg-gray-400"   },
};

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const sevenDaysAgo = startOfDay(subDays(new Date(), 6)).toISOString();

  const [allOrders, topItems, recentOrders] = await Promise.all([
    supabase
      .from("orders")
      .select("status, total, created_at, order_source")
      .gte("created_at", sevenDaysAgo)
      .order("created_at")
      .then(r => r.data as any[] | null),
    supabase
      .from("order_items")
      .select("item_name, quantity, price")
      .limit(200)
      .then(r => r.data as any[] | null),
    supabase
      .from("orders")
      .select("*, table:tables(*)")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(r => r.data as any[] | null),
  ]);

  // ── KPI ──────────────────────────────────────────────────────────────
  const completed     = allOrders?.filter(o => o.status === "completed") ?? [];
  const totalRevenue  = completed.reduce((s, o) => s + (o.total ?? 0), 0);
  const totalOrders   = allOrders?.length ?? 0;
  const avgOrderValue = completed.length > 0 ? totalRevenue / completed.length : 0;

  // ── Daily revenue (last 7 days) ───────────────────────────────────────
  const dailyMap: Record<string, { orders: number; revenue: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = format(subDays(new Date(), i), "dd MMM");
    dailyMap[d] = { orders: 0, revenue: 0 };
  }
  allOrders?.forEach(o => {
    const d = format(new Date(o.created_at), "dd MMM");
    if (dailyMap[d]) {
      dailyMap[d].orders += 1;
      if (o.status === "completed") dailyMap[d].revenue += o.total ?? 0;
    }
  });
  const dailyData   = Object.entries(dailyMap).map(([date, v]) => ({ date, ...v }));
  const maxRevenue  = Math.max(...dailyData.map(d => d.revenue), 1);

  // ── Revenue by source ─────────────────────────────────────────────────
  const sourceRevMap: Record<string, { orders: number; revenue: number }> = {};
  allOrders?.forEach(o => {
    const src = o.order_source ?? "dine_in";
    if (!sourceRevMap[src]) sourceRevMap[src] = { orders: 0, revenue: 0 };
    sourceRevMap[src].orders += 1;
    if (o.status === "completed") sourceRevMap[src].revenue += o.total ?? 0;
  });
  const sourceData = Object.entries(sourceRevMap)
    .map(([src, v]) => ({ src, ...v, meta: SOURCE_META[src] ?? SOURCE_META.other }))
    .sort((a, b) => b.revenue - a.revenue);
  const maxSourceRev = Math.max(...sourceData.map(d => d.revenue), 1);

  // ── Top items ─────────────────────────────────────────────────────────
  const itemCount: Record<string, { name: string; qty: number; revenue: number }> = {};
  topItems?.forEach(item => {
    if (!itemCount[item.item_name]) itemCount[item.item_name] = { name: item.item_name, qty: 0, revenue: 0 };
    itemCount[item.item_name].qty     += item.quantity;
    itemCount[item.item_name].revenue += item.price * item.quantity;
  });
  const sortedItems = Object.values(itemCount).sort((a, b) => b.qty - a.qty).slice(0, 10);

  // ── Order status counts ───────────────────────────────────────────────
  const statusCounts: Record<string, number> = {};
  allOrders?.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1; });

  const statusLabels: Record<string, string> = {
    pending: "Pending", accepted: "Accepted", preparing: "Preparing",
    ready: "Ready",     completed: "Completed", rejected: "Rejected",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1108]">Analytics</h1>
        <p className="text-gray-500 text-sm mt-0.5">Last 7 days performance — all channels</p>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: ShoppingBag, label: "Total Orders",    value: totalOrders,              sub: "last 7 days",           color: "text-blue-600 bg-blue-50"      },
          { icon: IndianRupee, label: "Revenue",         value: formatPrice(totalRevenue), sub: "from completed orders",  color: "text-green-600 bg-green-50"    },
          { icon: TrendingUp,  label: "Avg Order Value", value: formatPrice(avgOrderValue),sub: "per completed order",    color: "text-[#BF4E19] bg-orange-50"   },
          { icon: Clock,       label: "Completed",       value: completed.length,          sub: "fulfilled orders",       color: "text-emerald-600 bg-emerald-50" },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-[#1A1108]">{stat.value}</div>
              <div className="text-sm font-medium text-[#1A1108] mt-0.5">{stat.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{stat.sub}</div>
            </div>
          );
        })}
      </div>

      {/* ── Revenue by source — NEW ── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-bold text-[#1A1108] mb-1 flex items-center gap-2">
          <Bike className="w-5 h-5 text-[#BF4E19]" />
          Revenue by Channel
        </h2>
        <p className="text-xs text-gray-400 mb-5">Dine-in vs Zomato vs Swiggy vs Phone — last 7 days</p>

        {sourceData.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No order data yet</p>
        ) : (
          <div className="space-y-4">
            {sourceData.map(({ src, orders: cnt, revenue, meta }) => {
              const pct = Math.round((revenue / maxSourceRev) * 100) || 2;
              const orderPct = totalOrders > 0 ? Math.round((cnt / totalOrders) * 100) : 0;
              return (
                <div key={src}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${meta.color}`}>
                        {meta.emoji} {meta.label}
                      </span>
                      <span className="text-xs text-gray-400">{cnt} orders ({orderPct}%)</span>
                    </div>
                    <span className="font-bold text-[#1A1108] text-sm">{formatPrice(revenue)}</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${meta.bar} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ── Daily revenue bar chart ── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-[#1A1108] mb-5 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#BF4E19]" />
            Daily Revenue (₹)
          </h2>
          <div className="flex items-end gap-2 h-40">
            {dailyData.map(d => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-400 font-medium">
                  {d.revenue > 0 ? formatPrice(d.revenue) : ""}
                </span>
                <div
                  className="w-full bg-[#BF4E19] rounded-t-lg transition-all hover:bg-[#A33D10]"
                  style={{ height: `${Math.max(4, (d.revenue / maxRevenue) * 100)}%`, opacity: d.revenue > 0 ? 1 : 0.2 }}
                />
                <span className="text-xs text-gray-400">{d.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Order status breakdown ── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-[#1A1108] mb-5 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#BF4E19]" />
            Order Status Breakdown
          </h2>
          <div className="space-y-3">
            {Object.entries(statusCounts).map(([status, count]) => {
              const pct = Math.round((count / totalOrders) * 100) || 0;
              const colors: Record<string, string> = {
                completed: "bg-green-500", preparing: "bg-orange-400",
                accepted: "bg-blue-500",   pending: "bg-yellow-400",
                rejected: "bg-red-400",    ready: "bg-green-400",
              };
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-[#1A1108]">{statusLabels[status] ?? status}</span>
                    <span className="text-gray-500">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${colors[status] ?? "bg-gray-400"} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {Object.keys(statusCounts).length === 0 && (
              <p className="text-gray-400 text-sm text-center py-6">No order data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Top selling items ── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-bold text-[#1A1108] mb-5">Top Selling Items</h2>
        {sortedItems.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No order data yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="pb-3 font-semibold text-gray-500">#</th>
                  <th className="pb-3 font-semibold text-gray-500">Item</th>
                  <th className="pb-3 font-semibold text-gray-500 text-right">Qty Sold</th>
                  <th className="pb-3 font-semibold text-gray-500 text-right">Revenue (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedItems.map((item, i) => (
                  <tr key={item.name} className="hover:bg-gray-50">
                    <td className="py-3 text-gray-400 w-8">{i + 1}</td>
                    <td className="py-3 font-medium text-[#1A1108]">{item.name}</td>
                    <td className="py-3 text-right text-gray-600">{item.qty}</td>
                    <td className="py-3 text-right font-semibold text-[#BF4E19]">{formatPrice(item.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Recent orders ── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-bold text-[#1A1108] mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-100">
                <th className="pb-3 font-semibold text-gray-500">Order No.</th>
                <th className="pb-3 font-semibold text-gray-500">Source</th>
                <th className="pb-3 font-semibold text-gray-500">Table / Customer</th>
                <th className="pb-3 font-semibold text-gray-500">Status</th>
                <th className="pb-3 font-semibold text-gray-500 text-right">Amount (₹)</th>
                <th className="pb-3 font-semibold text-gray-500">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(recentOrders ?? []).map((order: any) => {
                const src = order.order_source ?? "dine_in";
                const meta = SOURCE_META[src] ?? SOURCE_META.dine_in;
                const who = src === "dine_in"
                  ? `Table ${(order.table?.table_number ?? "").replace(/\D/g, "").padStart(2, "0")}`
                  : (order.customer_name ?? meta.label);
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="py-3 font-semibold text-[#1A1108]">#{order.order_number}</td>
                    <td className="py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>
                        {meta.emoji} {meta.label}
                      </span>
                    </td>
                    <td className="py-3 text-gray-600">{who}</td>
                    <td className="py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        order.status === "completed" ? "bg-green-50 text-green-700" :
                        order.status === "rejected"  ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-700"}`}>
                        {statusLabels[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="py-3 text-right font-semibold text-[#BF4E19]">{formatPrice(order.total)}</td>
                    <td className="py-3 text-gray-400 text-xs">{formatDateTimeIN(order.created_at)}</td>
                  </tr>
                );
              })}
              {(!recentOrders || recentOrders.length === 0) && (
                <tr><td colSpan={6} className="py-8 text-center text-gray-400">No orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
