import { createClient } from "@/lib/supabase/server";
import { formatPrice, todayIST, currentMonthIST } from "@/lib/utils";
import {
  ShoppingBag, IndianRupee, Clock, ChefHat, CheckCircle2,
  Users, CalendarCheck, Package, AlertTriangle, Wallet,
  ArrowRight, Table2, TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export const revalidate = 30;

export default async function ManagerDashboard() {
  const supabase = await createClient();
  const db = supabase as any;

  const today = new Date();
  const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const todayDate  = todayIST();
  const currentMonth = currentMonthIST();

  const [
    todayOrders, pendingOrders, recentOrders, tables,
    employees, todayAttendance, lowStockItems, pendingPayouts,
    recentTransactions,
  ] = await Promise.all([
    db.from("orders").select("status, total").gte("created_at", todayStart).then((r: any) => r.data as any[] | null),
    db.from("orders").select("*, order_items(*), table:tables(*)").in("status", ["pending","accepted","preparing"]).order("created_at", { ascending: false }).limit(5).then((r: any) => r.data as any[] | null),
    db.from("orders").select("*, table:tables(*)").order("created_at", { ascending: false }).limit(8).then((r: any) => r.data as any[] | null),
    db.from("tables").select("*").order("table_number").then((r: any) => r.data as any[] | null),
    db.from("employees").select("id,name,role,monthly_salary,status").then((r: any) => r.data as any[] | null),
    db.from("attendance").select("employee_id,status").eq("date", todayDate).then((r: any) => r.data as any[] | null),
    db.from("inventory_items").select("id,name,current_stock,min_stock,unit").eq("is_active", true).lt("current_stock", db.from("inventory_items").select("min_stock")).then((r: any) => r.data as any[] | null).catch(() => null),
    db.from("employees").select("id,name,monthly_salary").eq("status","active").then((r: any) => r.data as any[] | null),
    db.from("employee_transactions").select("*, employee:employees(name)").order("created_at", { ascending: false }).limit(5).then((r: any) => r.data as any[] | null),
  ]);

  // Get low stock separately (simpler query)
  const { data: lowStock } = await db.from("inventory_items")
    .select("id,name,current_stock,min_stock,unit")
    .eq("is_active", true)
    .gt("min_stock", 0);

  const actualLowStock = (lowStock ?? []).filter((i: any) => i.current_stock < i.min_stock);
  const outOfStock = actualLowStock.filter((i: any) => i.current_stock <= 0);

  const completedOrders = (todayOrders ?? []).filter((o: any) => o.status === "completed");
  const totalRevenue = completedOrders.reduce((s: number, o: any) => s + (o.total ?? 0), 0);
  const totalOrdersToday = (todayOrders ?? []).length;
  const pendingCount = (todayOrders ?? []).filter((o: any) => o.status === "pending").length;
  const preparingCount = (todayOrders ?? []).filter((o: any) => o.status === "preparing").length;
  const completedCount = completedOrders.length;

  const activeEmployees = (employees ?? []).filter((e: any) => e.status === "active");
  const presentToday = (todayAttendance ?? []).filter((a: any) => a.status === "present" || a.status === "late").length;

  // Pending salary calculation for this month
  const { data: monthTxns } = await db.from("employee_transactions")
    .select("employee_id, type, amount")
    .eq("reference_month", currentMonth);

  const salaryPaidThisMonth = (monthTxns ?? [])
    .filter((t: any) => t.type === "salary" || t.type === "advance")
    .reduce((s: number, t: any) => s + t.amount, 0);
  const totalPayroll = activeEmployees.reduce((s: number, e: any) => s + e.monthly_salary, 0);
  const pendingSalary = Math.max(0, totalPayroll - salaryPaidThisMonth);

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700", accepted: "bg-blue-100 text-blue-700",
    preparing: "bg-orange-100 text-orange-700", ready: "bg-green-100 text-green-700",
    completed: "bg-gray-100 text-gray-600", rejected: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1108]">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
      </div>

      {/* ── Alert: Low Stock ── */}
      {actualLowStock.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
            <p className="text-sm text-yellow-800">
              <strong>{outOfStock.length} out of stock</strong> and <strong>{actualLowStock.length - outOfStock.length} low stock</strong> items need attention.
            </p>
          </div>
          <Link href="/manager/inventory" className="text-xs text-yellow-700 font-semibold hover:underline shrink-0">View →</Link>
        </div>
      )}

      {/* ── Today's Order Stats ── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Today's Orders</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label:"Total Orders",  value: totalOrdersToday,          icon: ShoppingBag,  color:"bg-blue-50 text-blue-600"     },
            { label:"Revenue (₹)",   value: formatPrice(totalRevenue),  icon: IndianRupee,  color:"bg-green-50 text-green-600"   },
            { label:"Pending",       value: pendingCount,               icon: Clock,        color:"bg-yellow-50 text-yellow-600" },
            { label:"Preparing",     value: preparingCount,             icon: ChefHat,      color:"bg-orange-50 text-[#BF4E19]"  },
            { label:"Completed",     value: completedCount,             icon: CheckCircle2, color:"bg-emerald-50 text-emerald-600"},
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-[#1A1108]">{value}</div>
              <div className="text-sm font-medium text-[#1A1108] mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── HR & Inventory Stats ── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Staff & Inventory</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            { label:"Active Staff",          value: activeEmployees.length,      icon: Users,        color:"bg-purple-50 text-purple-600", href:"/manager/employees"  },
            { label:"Present Today",         value: presentToday,                icon: CalendarCheck,color:"bg-green-50 text-green-600",   href:"/manager/attendance" },
            { label:"Low Stock Items",       value: actualLowStock.length,       icon: Package,      color:"bg-yellow-50 text-yellow-600", href:"/manager/inventory"  },
            { label:"Pending Salary",        value: formatPrice(pendingSalary),  icon: Wallet,       color:"bg-red-50 text-red-600",       href:"/manager/payouts"    },
          ].map(({ label, value, icon: Icon, color, href }) => (
            <Link key={label} href={href} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
              <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-[#1A1108]">{value}</div>
              <div className="text-sm font-medium text-[#1A1108] mt-0.5 flex items-center justify-between">
                {label}
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#BF4E19] transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Main content grid ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#1A1108]">Active Orders</h2>
            <Link href="/manager/orders" className="text-sm text-[#BF4E19] font-medium flex items-center gap-1 hover:gap-2 transition-all">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {(pendingOrders ?? []).length > 0 ? (
            <div className="space-y-3">
              {(pendingOrders ?? []).map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-[#FAF3E8] rounded-xl border border-[#F2E6D0]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1A1108]">#{order.order_number}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColors[order.status]}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Table {(order.table?.table_number ?? "").replace(/\D/g,"").padStart(2,"0")} · {order.order_items?.length ?? 0} items
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#BF4E19]">{formatPrice(order.total)}</div>
                    <div className="text-xs text-gray-400">{format(new Date(order.created_at), "hh:mm a")}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400">
              <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No active orders right now</p>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Table status */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[#1A1108]">Tables</h2>
              <Link href="/manager/tables" className="text-sm text-[#BF4E19] font-medium flex items-center gap-1 hover:gap-2 transition-all">
                Manage <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(tables ?? []).slice(0,8).map((table: any) => (
                <div key={table.id} className={`p-3 rounded-xl text-xs font-semibold text-center border ${
                  table.status === "available" ? "bg-green-50 text-green-700 border-green-100" :
                  table.status === "occupied"  ? "bg-orange-50 text-orange-700 border-orange-100" :
                  "bg-blue-50 text-blue-700 border-blue-100"}`}>
                  <Table2 className="w-4 h-4 mx-auto mb-1" />
                  T{(table.table_number ?? "").replace(/\D/g,"").padStart(2,"0")}
                  <div className="capitalize opacity-70 mt-0.5">{table.status}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Low stock alert */}
          {actualLowStock.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-[#1A1108]">Low Stock</h2>
                <Link href="/manager/inventory" className="text-sm text-[#BF4E19] font-medium">View all →</Link>
              </div>
              <div className="space-y-2">
                {actualLowStock.slice(0, 5).map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-[#1A1108] font-medium truncate flex-1">{item.name}</span>
                    <span className={`ml-2 text-xs font-semibold shrink-0 ${item.current_stock <= 0 ? "text-red-600" : "text-yellow-600"}`}>
                      {item.current_stock} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      {(recentTransactions ?? []).length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#1A1108]">Recent Employee Transactions</h2>
            <Link href="/manager/payouts" className="text-sm text-[#BF4E19] font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {(recentTransactions ?? []).map((t: any) => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-sm">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                    t.type === "salary" ? "bg-green-100 text-green-700" :
                    t.type === "advance" ? "bg-orange-100 text-orange-700" :
                    t.type === "bonus" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>
                    {t.type.slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-[#1A1108]">{t.employee?.name ?? "—"}</p>
                    <p className="text-xs text-gray-400 capitalize">{t.type} · {t.payment_method?.replace("_"," ")}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#1A1108]">{formatPrice(t.amount)}</p>
                  <p className="text-xs text-gray-400">{format(new Date(t.created_at), "MMM d")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
