"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Phone, Mail, MapPin, Calendar, DollarSign,
  CheckCircle2, XCircle, Clock, AlertCircle, Coffee,
  TrendingDown, Plus, X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import type { Employee, Attendance, EmployeeTransaction, TransactionType, PaymentMethod } from "@/lib/supabase/types";
import { formatPrice } from "@/lib/utils";

const STATUS_ICONS: Record<string, any> = {
  present: CheckCircle2, absent: XCircle, half_day: Clock,
  leave: AlertCircle, late: Coffee,
};
const STATUS_COLORS: Record<string, string> = {
  present: "text-green-600 bg-green-50 border-green-200",
  absent: "text-red-600 bg-red-50 border-red-200",
  half_day: "text-yellow-600 bg-yellow-50 border-yellow-200",
  leave: "text-blue-600 bg-blue-50 border-blue-200",
  late: "text-orange-600 bg-orange-50 border-orange-200",
};
const TXN_COLORS: Record<TransactionType, string> = {
  advance: "bg-orange-100 text-orange-700",
  salary: "bg-green-100 text-green-700",
  bonus: "bg-purple-100 text-purple-700",
  deduction: "bg-red-100 text-red-700",
  other: "bg-gray-100 text-gray-600",
};
const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "upi",           label: "UPI (GPay / PhonePe / Paytm)" },
  { value: "cash",          label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer / NEFT" },
  { value: "cheque",        label: "Cheque" },
  { value: "other",         label: "Other" },
];

interface Props {
  employee: Employee;
  transactions: EmployeeTransaction[];
  attendance: Attendance[];
  isAdmin: boolean;
}

export default function EmployeeProfileClient({ employee: emp, transactions: initTxns, attendance: initAtt, isAdmin }: Props) {
  const [tab, setTab] = useState<"overview"|"attendance"|"salary"|"history">("overview");
  const [transactions, setTransactions] = useState<EmployeeTransaction[]>(initTxns);
  const [attendance, setAttendance] = useState<Attendance[]>(initAtt);
  const [txnModal, setTxnModal] = useState(false);
  const [txnForm, setTxnForm] = useState({
    type: "advance" as TransactionType, amount: "", description: "",
    payment_method: "upi" as PaymentMethod, reference_month: format(new Date(), "yyyy-MM"),
  });
  const [saving, setSaving] = useState(false);
  const db = createClient() as any;

  // Salary calculations
  const totalAdvances = transactions.filter(t => t.type === "advance").reduce((s, t) => s + t.amount, 0);
  const totalPaid = transactions.filter(t => t.type === "salary").reduce((s, t) => s + t.amount, 0);
  const totalBonus = transactions.filter(t => t.type === "bonus").reduce((s, t) => s + t.amount, 0);
  const totalDeductions = transactions.filter(t => t.type === "deduction").reduce((s, t) => s + t.amount, 0);

  // Attendance summary (last 30 records)
  const attStats = attendance.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const attTotal = attendance.length;
  const attPct = attTotal > 0
    ? Math.round(((attStats.present || 0) + (attStats.late || 0) * 0.9 + (attStats.half_day || 0) * 0.5) / attTotal * 100)
    : 0;

  async function saveTxn() {
    const amt = parseFloat(txnForm.amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    setSaving(true);
    try {
      const { data, error } = await db.from("employee_transactions").insert([{
        employee_id: emp.id, type: txnForm.type, amount: amt,
        description: txnForm.description || null, payment_method: txnForm.payment_method,
        reference_month: txnForm.reference_month || null,
      }]).select().single();
      if (error) throw error;
      setTransactions(p => [data, ...p]);
      toast.success("Transaction recorded");
      setTxnModal(false);
      setTxnForm({ type: "advance", amount: "", description: "", payment_method: "cash", reference_month: format(new Date(), "yyyy-MM") });
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  }

  const tabs = ["overview","attendance","salary","history"] as const;

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex items-center gap-4">
        <Link href="/manager/employees"
          className="p-2 rounded-xl hover:bg-[#F2E6D0] transition-colors text-[#1A1108]">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[#1A1108]">{emp.name}</h1>
          <p className="text-gray-500 text-sm">{emp.employee_id} · {emp.role}</p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
          emp.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
          {emp.status}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl p-1 w-fit shadow-sm border border-gray-100 flex-wrap">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${
              tab === t ? "bg-[#BF4E19] text-white shadow-sm" : "text-gray-500 hover:text-[#1A1108]"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === "overview" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-bold text-[#1A1108]">Personal Details</h3>
            {[
              { icon: Phone, label: "Phone", value: emp.phone ?? "Not provided" },
              { icon: Mail, label: "Email", value: emp.email ?? "Not provided" },
              { icon: MapPin, label: "Address", value: emp.address ?? "Not provided" },
              { icon: Calendar, label: "Joined", value: format(new Date(emp.joining_date), "MMMM d, yyyy") },
              ...(emp.leaving_date ? [{ icon: Calendar, label: "Left", value: format(new Date(emp.leaving_date), "MMMM d, yyyy") }] : []),
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#FAF3E8] rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-[#BF4E19]" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm font-medium text-[#1A1108]">{value}</p>
                </div>
              </div>
            ))}
            {emp.notes && (
              <div className="mt-2 p-3 bg-[#FAF3E8] rounded-xl text-sm text-[#3D2B1A]">
                📝 {emp.notes}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Salary summary */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-[#1A1108] mb-4">Salary Summary</h3>
              <div className="space-y-3">
                {[
                  { label: "Monthly Salary", value: formatPrice(emp.monthly_salary), color: "text-[#1A1108]" },
                  { label: "Total Advances", value: formatPrice(totalAdvances), color: "text-orange-600" },
                  { label: "Total Paid (Salary)", value: formatPrice(totalPaid), color: "text-green-600" },
                  { label: "Total Bonus", value: formatPrice(totalBonus), color: "text-purple-600" },
                  { label: "Total Deductions", value: formatPrice(totalDeductions), color: "text-red-600" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-500">{label}</span>
                    <span className={`font-semibold ${color}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Attendance summary */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-[#1A1108] mb-4">Attendance (recent)</h3>
              <div className="text-3xl font-bold text-[#BF4E19] mb-1">{attPct}%</div>
              <p className="text-xs text-gray-400 mb-3">Attendance rate</p>
              <div className="grid grid-cols-3 gap-2">
                {[["present","Present",attStats.present||0],["absent","Absent",attStats.absent||0],
                  ["half_day","Half Day",attStats.half_day||0],["leave","Leave",attStats.leave||0],
                  ["late","Late",attStats.late||0]].map(([s,l,n]) => (
                  <div key={s as string} className={`p-2 rounded-xl border text-center ${STATUS_COLORS[s as string]}`}>
                    <div className="font-bold">{n}</div>
                    <div className="text-xs">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Attendance tab ── */}
      {tab === "attendance" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#FAF3E8] text-left">
                  <th className="px-5 py-3.5 font-semibold text-[#1A1108]">Date</th>
                  <th className="px-4 py-3.5 font-semibold text-[#1A1108]">Status</th>
                  <th className="px-4 py-3.5 font-semibold text-[#1A1108]">Check In</th>
                  <th className="px-4 py-3.5 font-semibold text-[#1A1108]">Check Out</th>
                  <th className="px-4 py-3.5 font-semibold text-[#1A1108]">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {attendance.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-[#1A1108]">
                      {format(new Date(a.date), "EEE, MMM d, yyyy")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full border capitalize ${STATUS_COLORS[a.status]}`}>
                        {a.status.replace("_"," ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{a.check_in ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{a.check_out ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{a.remarks ?? "—"}</td>
                  </tr>
                ))}
                {attendance.length === 0 && (
                  <tr><td colSpan={5} className="py-10 text-center text-gray-400">No attendance records</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Salary tab ── */}
      {tab === "salary" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-[#1A1108]">Salary & Advances</h3>
            <button onClick={() => setTxnModal(true)}
              className="flex items-center gap-2 bg-[#BF4E19] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#A33D10] transition-colors">
              <Plus className="w-4 h-4" /> Record Payment
            </button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Monthly Salary", value: formatPrice(emp.monthly_salary), color: "bg-[#FAF3E8] text-[#BF4E19]" },
              { label: "Total Advances", value: formatPrice(totalAdvances), color: "bg-orange-50 text-orange-600" },
              { label: "Salary Paid", value: formatPrice(totalPaid), color: "bg-green-50 text-green-600" },
              { label: "Net Due", value: formatPrice(Math.max(0, emp.monthly_salary - totalAdvances - totalPaid + totalDeductions - totalBonus)), color: "bg-blue-50 text-blue-600" },
            ].map(({ label, value, color }) => (
              <div key={label} className={`rounded-2xl p-4 ${color.split(" ")[0]}`}>
                <div className={`text-xl font-bold ${color.split(" ")[1]}`}>{value}</div>
                <div className="text-xs text-gray-500 mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* Recent transactions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAF3E8] text-left">
                    <th className="px-5 py-3.5 font-semibold text-[#1A1108]">Date</th>
                    <th className="px-4 py-3.5 font-semibold text-[#1A1108]">Type</th>
                    <th className="px-4 py-3.5 font-semibold text-[#1A1108]">Amount</th>
                    <th className="px-4 py-3.5 font-semibold text-[#1A1108]">Method</th>
                    <th className="px-4 py-3.5 font-semibold text-[#1A1108]">Month</th>
                    <th className="px-4 py-3.5 font-semibold text-[#1A1108]">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-600">{format(new Date(t.created_at), "MMM d, yyyy")}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${TXN_COLORS[t.type]}`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#1A1108]">{formatPrice(t.amount)}</td>
                      <td className="px-4 py-3 text-gray-500 capitalize text-xs">{t.payment_method.replace("_"," ")}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{t.reference_month ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{t.description ?? "—"}</td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr><td colSpan={6} className="py-10 text-center text-gray-400">No transactions yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── History tab ── */}
      {tab === "history" && (
        <div className="space-y-3">
          {transactions.map(t => (
            <div key={t.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${TXN_COLORS[t.type]}`}>
                  {t.type.slice(0,2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-[#1A1108] capitalize">{t.type}</p>
                  <p className="text-xs text-gray-400">{t.description ?? "—"} · {t.payment_method.replace("_"," ")}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-[#1A1108]">{formatPrice(t.amount)}</p>
                <p className="text-xs text-gray-400">{format(new Date(t.created_at), "MMM d, yyyy")}</p>
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="bg-white rounded-2xl p-10 text-center text-gray-400 shadow-sm border border-gray-100">
              No transaction history
            </div>
          )}
        </div>
      )}

      {/* Transaction Modal */}
      {txnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setTxnModal(false)} />
          <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-[#1A1108] text-lg">Record Payment</h2>
              <button onClick={() => setTxnModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              {/* Type selector */}
              <div className="grid grid-cols-3 gap-2">
                {(["advance","salary","bonus","deduction","other"] as TransactionType[]).map(t => (
                  <button key={t} onClick={() => setTxnForm(f => ({ ...f, type: t }))}
                    className={`py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${
                      txnForm.type === t ? "bg-[#BF4E19] text-white" : "bg-[#FAF3E8] text-[#3D2B1A] hover:bg-[#F2E6D0]"}`}>
                    {t}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A1108] mb-1.5">Amount (₹) *</label>
                <input type="number" min="1" value={txnForm.amount} onChange={e => setTxnForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#FAF3E8] border border-[#E8D5B7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1A1108] mb-1.5">Payment Method</label>
                  <select value={txnForm.payment_method} onChange={e => setTxnForm(f => ({ ...f, payment_method: e.target.value as PaymentMethod }))}
                    className="w-full px-4 py-3 bg-[#FAF3E8] border border-[#E8D5B7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19]">
                    {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1A1108] mb-1.5">Reference Month</label>
                  <input type="month" value={txnForm.reference_month} onChange={e => setTxnForm(f => ({ ...f, reference_month: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#FAF3E8] border border-[#E8D5B7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A1108] mb-1.5">Description</label>
                <input value={txnForm.description} onChange={e => setTxnForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. September salary, advance for medical..."
                  className="w-full px-4 py-3 bg-[#FAF3E8] border border-[#E8D5B7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19]" />
              </div>
              <button onClick={saveTxn} disabled={saving}
                className="w-full bg-[#BF4E19] text-white py-3.5 rounded-2xl font-semibold hover:bg-[#A33D10] disabled:opacity-60 transition-colors">
                {saving ? "Saving..." : "Record Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
