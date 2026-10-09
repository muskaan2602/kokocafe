"use client";

import { useState, useMemo } from "react";
import { Download, FileText, ShoppingBag, Package, Users, Wallet } from "lucide-react";
import { format, parseISO } from "date-fns";
import { formatPrice } from "@/lib/utils";

// ── CSV util ────────────────────────────────────────────────────────────────
function downloadCSV(filename: string, rows: string[][], headers: string[]) {
  const escape = (v: any) => `"${String(v ?? "").replace(/"/g,'""')}"`;
  const csv = [headers, ...rows].map(r => r.map(escape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

interface Props {
  orders: any[]; orderItems: any[]; employees: any[];
  attendance: any[]; transactions: any[]; invItems: any[];
  invMovements: any[]; defaultMonth: string;
}

export default function ReportsClient({ orders, orderItems, employees, attendance, transactions, invItems, invMovements, defaultMonth }: Props) {
  const [activeTab, setActiveTab] = useState<"sales"|"inventory"|"attendance"|"payouts">("sales");
  const [filterMonth, setFilterMonth] = useState(defaultMonth);

  const monthStart = `${filterMonth}-01`;
  const monthEnd   = `${filterMonth}-${new Date(parseInt(filterMonth.slice(0,4)), parseInt(filterMonth.slice(5,7)), 0).getDate()}`;

  // ── Sales ────────────────────────────────────────────────────────────────
  const filteredOrders = useMemo(() => orders.filter(o => o.created_at >= monthStart && o.created_at <= monthEnd + "T23:59:59"), [orders, monthStart, monthEnd]);
  const completedOrders = filteredOrders.filter(o => o.status === "completed");
  const salesRevenue = completedOrders.reduce((s, o) => s + o.total, 0);
  const salesTax = completedOrders.reduce((s, o) => s + o.tax, 0);

  // ── Inventory ────────────────────────────────────────────────────────────
  const lowItems = invItems.filter(i => i.is_active && i.current_stock > 0 && i.current_stock < i.min_stock);
  const outItems = invItems.filter(i => i.is_active && i.current_stock <= 0);

  // ── Attendance ───────────────────────────────────────────────────────────
  const filteredAtt = useMemo(() => attendance.filter(a => a.date >= monthStart && a.date <= monthEnd), [attendance, monthStart, monthEnd]);
  const attStats = { present: 0, absent: 0, half_day: 0, leave: 0, late: 0 };
  filteredAtt.forEach(a => { (attStats as any)[a.status]++ });

  // ── Payouts ───────────────────────────────────────────────────────────────
  const filteredTxns = useMemo(() => transactions.filter(t => t.reference_month === filterMonth || (!t.reference_month && t.created_at >= monthStart)), [transactions, filterMonth, monthStart]);
  const totalSalaryPaid = filteredTxns.filter(t => t.type === "salary").reduce((s,t) => s + t.amount, 0);
  const totalAdvances = filteredTxns.filter(t => t.type === "advance").reduce((s,t) => s + t.amount, 0);
  const totalBonus = filteredTxns.filter(t => t.type === "bonus").reduce((s,t) => s + t.amount, 0);

  // ── CSV exports ──────────────────────────────────────────────────────────
  function exportSales() {
    downloadCSV(`koko_sales_${filterMonth}.csv`,
      filteredOrders.map(o => [
        o.order_number, o.table?.table_number ?? "", o.status,
        o.subtotal, o.tax, o.total, format(parseISO(o.created_at), "yyyy-MM-dd HH:mm"),
      ]),
      ["Order Number","Table","Status","Subtotal","Tax","Total","Date/Time"]);
  }
  function exportInventory() {
    downloadCSV(`koko_inventory_${filterMonth}.csv`,
      invItems.filter(i => i.is_active).map(i => [
        i.name, i.category?.name ?? "", i.unit, i.current_stock, i.min_stock,
        i.current_stock <= 0 ? "Out of Stock" : i.current_stock < i.min_stock ? "Low Stock" : "In Stock",
        i.purchase_price ?? "", i.supplier ?? "",
      ]),
      ["Item","Category","Unit","Current Stock","Min Stock","Status","Purchase Price","Supplier"]);
  }
  function exportAttendance() {
    downloadCSV(`koko_attendance_${filterMonth}.csv`,
      filteredAtt.map(a => [
        a.employee?.name ?? a.employee_id, a.date, a.status, a.check_in ?? "", a.check_out ?? "", a.remarks ?? "",
      ]),
      ["Employee","Date","Status","Check In","Check Out","Remarks"]);
  }
  function exportPayouts() {
    downloadCSV(`koko_payouts_${filterMonth}.csv`,
      filteredTxns.map(t => [
        t.employee?.name ?? t.employee_id, t.type, t.amount,
        t.payment_method, t.reference_month ?? "", t.description ?? "",
        format(parseISO(t.created_at), "yyyy-MM-dd"),
      ]),
      ["Employee","Type","Amount","Method","Month","Description","Date"]);
  }

  const tabs = [
    { key: "sales",      label: "Sales",      icon: ShoppingBag, color: "text-blue-600 bg-blue-50" },
    { key: "inventory",  label: "Inventory",  icon: Package,     color: "text-orange-600 bg-orange-50" },
    { key: "attendance", label: "Attendance", icon: Users,       color: "text-green-600 bg-green-50" },
    { key: "payouts",    label: "Payouts",    icon: Wallet,      color: "text-purple-600 bg-purple-50" },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1108]">Reports</h1>
          <p className="text-gray-500 text-sm mt-0.5">Export and analyse café performance</p>
        </div>
        <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19]" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white rounded-2xl p-1 w-fit shadow-sm border border-gray-100 flex-wrap">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === key ? "bg-[#BF4E19] text-white shadow-sm" : "text-gray-500 hover:text-[#1A1108]"}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* ── Sales Report ── */}
      {activeTab === "sales" && (
        <div className="space-y-5">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-[#1A1108]">Sales Report — {format(new Date(filterMonth + "-01"), "MMMM yyyy")}</h2>
            <button onClick={exportSales}
              className="flex items-center gap-2 bg-[#BF4E19] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#A33D10] transition-colors">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ["Total Orders",    filteredOrders.length,             "bg-blue-50 text-blue-700"],
              ["Completed",       completedOrders.length,            "bg-green-50 text-green-700"],
              ["Revenue",         formatPrice(salesRevenue),         "bg-[#FAF3E8] text-[#BF4E19]"],
              ["Tax Collected",   formatPrice(salesTax),             "bg-purple-50 text-purple-700"],
            ].map(([l,v,c]) => (
              <div key={l as string} className={`rounded-2xl p-4 ${(c as string).split(" ")[0]}`}>
                <div className={`text-xl font-bold ${(c as string).split(" ")[1]}`}>{v}</div>
                <div className="text-xs text-gray-500 mt-0.5">{l}</div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-[#FAF3E8] text-left">
                  {["Order","Table","Status","Subtotal","Tax","Total","Date"].map(h => (
                    <th key={h} className="px-4 py-3.5 font-semibold text-[#1A1108]">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredOrders.slice(0,50).map(o => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-[#1A1108]">#{o.order_number}</td>
                      <td className="px-4 py-3 text-gray-600">{o.table?.table_number ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          o.status === "completed" ? "bg-green-100 text-green-700" :
                          o.status === "rejected"  ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-700"}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{formatPrice(o.subtotal)}</td>
                      <td className="px-4 py-3">{formatPrice(o.tax)}</td>
                      <td className="px-4 py-3 font-semibold text-[#BF4E19]">{formatPrice(o.total)}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{format(parseISO(o.created_at), "MMM d, hh:mm a")}</td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr><td colSpan={7} className="py-10 text-center text-gray-400">No orders this month</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Inventory Report ── */}
      {activeTab === "inventory" && (
        <div className="space-y-5">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-[#1A1108]">Inventory Report</h2>
            <button onClick={exportInventory}
              className="flex items-center gap-2 bg-[#BF4E19] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#A33D10] transition-colors">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              ["Total Items", invItems.filter(i=>i.is_active).length, "bg-blue-50 text-blue-700"],
              ["Low Stock",   lowItems.length,   "bg-yellow-50 text-yellow-700"],
              ["Out of Stock",outItems.length,   "bg-red-50 text-red-700"],
            ].map(([l,v,c]) => (
              <div key={l as string} className={`rounded-2xl p-4 ${(c as string).split(" ")[0]}`}>
                <div className={`text-2xl font-bold ${(c as string).split(" ")[1]}`}>{v}</div>
                <div className="text-xs text-gray-500 mt-0.5">{l}</div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-[#FAF3E8] text-left">
                  {["Item","Category","Stock","Unit","Min","Status","Price","Supplier"].map(h => (
                    <th key={h} className="px-4 py-3.5 font-semibold text-[#1A1108]">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {invItems.filter(i=>i.is_active).map(i => (
                    <tr key={i.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-[#1A1108]">{i.name}</td>
                      <td className="px-4 py-3 text-gray-500">{i.category?.name ?? "—"}</td>
                      <td className="px-4 py-3 font-semibold">{i.current_stock}</td>
                      <td className="px-4 py-3 text-gray-400">{i.unit}</td>
                      <td className="px-4 py-3 text-gray-400">{i.min_stock}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          i.current_stock <= 0 ? "bg-red-100 text-red-700" :
                          i.current_stock < i.min_stock ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                          {i.current_stock <= 0 ? "Out" : i.current_stock < i.min_stock ? "Low" : "OK"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{i.purchase_price ? formatPrice(i.purchase_price) : "—"}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{i.supplier ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Attendance Report ── */}
      {activeTab === "attendance" && (
        <div className="space-y-5">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-[#1A1108]">Attendance Report — {format(new Date(filterMonth + "-01"), "MMMM yyyy")}</h2>
            <button onClick={exportAttendance}
              className="flex items-center gap-2 bg-[#BF4E19] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#A33D10] transition-colors">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {[["Present",attStats.present,"bg-green-50 text-green-700"],
              ["Absent",attStats.absent,"bg-red-50 text-red-700"],
              ["Half Day",attStats.half_day,"bg-yellow-50 text-yellow-700"],
              ["Leave",attStats.leave,"bg-blue-50 text-blue-700"],
              ["Late",attStats.late,"bg-orange-50 text-orange-700"],
            ].map(([l,v,c]) => (
              <div key={l as string} className={`rounded-2xl p-4 text-center ${(c as string).split(" ")[0]}`}>
                <div className={`text-2xl font-bold ${(c as string).split(" ")[1]}`}>{v}</div>
                <div className="text-xs text-gray-500 mt-0.5">{l}</div>
              </div>
            ))}
          </div>
          {/* Per-employee summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-[#FAF3E8] text-left">
                  {["Employee","Present","Absent","Half Day","Leave","Late","Attendance %"].map(h => (
                    <th key={h} className="px-4 py-3.5 font-semibold text-[#1A1108]">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {employees.map(emp => {
                    const empAtt = filteredAtt.filter((a: any) => a.employee_id === emp.id);
                    const p = empAtt.filter((a: any) => a.status === "present").length;
                    const ab = empAtt.filter((a: any) => a.status === "absent").length;
                    const h = empAtt.filter((a: any) => a.status === "half_day").length;
                    const l = empAtt.filter((a: any) => a.status === "leave").length;
                    const la = empAtt.filter((a: any) => a.status === "late").length;
                    const total = empAtt.length;
                    const pct = total > 0 ? Math.round((p + la*0.9 + h*0.5) / total * 100) : 0;
                    return (
                      <tr key={emp.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-[#1A1108]">{emp.name}</td>
                        <td className="px-4 py-3 text-green-600 font-semibold">{p}</td>
                        <td className="px-4 py-3 text-red-600 font-semibold">{ab}</td>
                        <td className="px-4 py-3 text-yellow-600 font-semibold">{h}</td>
                        <td className="px-4 py-3 text-blue-600 font-semibold">{l}</td>
                        <td className="px-4 py-3 text-orange-600 font-semibold">{la}</td>
                        <td className="px-4 py-3"><span className={`font-bold ${pct >= 90 ? "text-green-600" : pct >= 70 ? "text-yellow-600" : "text-red-600"}`}>{pct}%</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Payouts Report ── */}
      {activeTab === "payouts" && (
        <div className="space-y-5">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-[#1A1108]">Payouts Report — {format(new Date(filterMonth + "-01"), "MMMM yyyy")}</h2>
            <button onClick={exportPayouts}
              className="flex items-center gap-2 bg-[#BF4E19] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#A33D10] transition-colors">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              ["Salary Paid",    formatPrice(totalSalaryPaid), "bg-green-50 text-green-700"],
              ["Advances Given", formatPrice(totalAdvances),   "bg-orange-50 text-orange-700"],
              ["Bonus Paid",     formatPrice(totalBonus),      "bg-purple-50 text-purple-700"],
            ].map(([l,v,c]) => (
              <div key={l as string} className={`rounded-2xl p-4 ${(c as string).split(" ")[0]}`}>
                <div className={`text-xl font-bold ${(c as string).split(" ")[1]}`}>{v}</div>
                <div className="text-xs text-gray-500 mt-0.5">{l}</div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-[#FAF3E8] text-left">
                  {["Employee","Type","Amount","Method","Description","Date"].map(h => (
                    <th key={h} className="px-4 py-3.5 font-semibold text-[#1A1108]">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredTxns.map((t: any) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-[#1A1108]">{t.employee?.name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                          t.type === "salary" ? "bg-green-100 text-green-700" :
                          t.type === "advance" ? "bg-orange-100 text-orange-700" :
                          t.type === "bonus" ? "bg-purple-100 text-purple-700" :
                          "bg-gray-100 text-gray-600"}`}>{t.type}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#BF4E19]">{formatPrice(t.amount)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs capitalize">{t.payment_method?.replace("_"," ")}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{t.description ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{format(parseISO(t.created_at), "MMM d, yyyy")}</td>
                    </tr>
                  ))}
                  {filteredTxns.length === 0 && (
                    <tr><td colSpan={6} className="py-10 text-center text-gray-400">No transactions this month</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
