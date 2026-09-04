"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Wallet, Plus, X, ChevronRight, DollarSign,
  TrendingDown, CheckCircle2, AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { format } from "date-fns";
import type { Employee, EmployeeTransaction, TransactionType, PaymentMethod } from "@/lib/supabase/types";
import { formatPrice } from "@/lib/utils";

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
  { value: "bank_transfer", label: "Bank Transfer / NEFT / IMPS" },
  { value: "cheque",        label: "Cheque" },
  { value: "other",         label: "Other" },
];

interface Props {
  employees: Employee[];
  transactions: EmployeeTransaction[];
  currentMonth: string;
}

export default function PayoutsClient({ employees, transactions: initTxns, currentMonth }: Props) {
  const [transactions, setTransactions] = useState<EmployeeTransaction[]>(initTxns);
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [modal, setModal] = useState<{ emp: Employee; type: TransactionType } | null>(null);
  const [form, setForm] = useState({ amount: "", description: "", payment_method: "upi" as PaymentMethod, reference_month: currentMonth });
  const [saving, setSaving] = useState(false);
  const db = createClient() as any;

  // Per-employee summary
  const empSummaries = useMemo(() => {
    return employees.map(emp => {
      const empTxns = transactions.filter(t => t.employee_id === emp.id);
      const monthTxns = empTxns.filter(t => t.reference_month === filterMonth);
      const totalAdvances = empTxns.filter(t => t.type === "advance").reduce((s,t) => s + t.amount, 0);
      const totalPaid = empTxns.filter(t => t.type === "salary").reduce((s,t) => s + t.amount, 0);
      const totalBonus = empTxns.filter(t => t.type === "bonus").reduce((s,t) => s + t.amount, 0);
      const totalDeductions = empTxns.filter(t => t.type === "deduction").reduce((s,t) => s + t.amount, 0);
      const monthAdvances = monthTxns.filter(t => t.type === "advance").reduce((s,t) => s + t.amount, 0);
      const monthPaid = monthTxns.filter(t => t.type === "salary").reduce((s,t) => s + t.amount, 0);
      const netDue = Math.max(0, emp.monthly_salary - monthAdvances - monthPaid);
      return { emp, totalAdvances, totalPaid, totalBonus, totalDeductions, monthAdvances, monthPaid, netDue, monthTxns };
    });
  }, [employees, transactions, filterMonth]);

  const totalPayroll = employees.reduce((s, e) => s + e.monthly_salary, 0);
  const totalPaidOut = empSummaries.reduce((s, e) => s + e.monthPaid + e.monthAdvances, 0);
  const totalDue = empSummaries.reduce((s, e) => s + e.netDue, 0);

  async function save() {
    if (!modal) return;
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    setSaving(true);
    try {
      const { data, error } = await db.from("employee_transactions").insert([{
        employee_id: modal.emp.id, type: modal.type, amount: amt,
        description: form.description || null, payment_method: form.payment_method,
        reference_month: form.reference_month || null,
      }]).select().single();
      if (error) throw error;
      setTransactions(p => [data, ...p]);
      toast.success("Payment recorded");
      setModal(null);
      setForm({ amount: "", description: "", payment_method: "cash", reference_month: currentMonth });
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#2B1B14]">Employee Payouts</h1>
          <p className="text-gray-500 text-sm mt-0.5">Salary, advances and payment tracking</p>
        </div>
        <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E86A2A]" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label:"Total Payroll",  value: formatPrice(totalPayroll),  color:"bg-[#FFF7ED] text-[#E86A2A]",  icon: DollarSign   },
          { label:"Paid This Month",value: formatPrice(totalPaidOut),  color:"bg-green-50 text-green-600",   icon: CheckCircle2 },
          { label:"Still Due",      value: formatPrice(totalDue),      color:"bg-red-50   text-red-600",     icon: AlertCircle  },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className={`rounded-2xl p-5 shadow-sm border border-gray-100 ${color.split(" ")[0]} bg-white`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className={`text-2xl font-bold ${color.split(" ")[1]}`}>{value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Employee cards */}
      <div className="space-y-4">
        {empSummaries.map(({ emp, totalAdvances, monthAdvances, monthPaid, netDue, monthTxns }) => (
          <div key={emp.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5">
              {/* Employee header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#E86A2A] rounded-full flex items-center justify-center text-white font-bold">
                    {emp.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-[#2B1B14]">{emp.name}</p>
                    <p className="text-xs text-gray-400">{emp.employee_id} · {emp.role}</p>
                  </div>
                </div>
                <Link href={`/manager/employees/${emp.id}`}
                  className="text-xs text-[#E86A2A] hover:underline flex items-center gap-1">
                  Profile <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Salary breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { label:"Monthly Salary",  value: formatPrice(emp.monthly_salary),  c:"bg-gray-50 text-[#2B1B14]" },
                  { label:"Advance (month)", value: formatPrice(monthAdvances),        c:"bg-orange-50 text-orange-700" },
                  { label:"Paid (month)",    value: formatPrice(monthPaid),            c:"bg-green-50 text-green-700" },
                  { label:"Net Due",         value: formatPrice(netDue),               c: netDue > 0 ? "bg-red-50 text-red-700" : "bg-green-50 text-green-600" },
                ].map(({ label, value, c }) => (
                  <div key={label} className={`rounded-xl p-3 ${c}`}>
                    <div className="font-bold text-lg">{value}</div>
                    <div className="text-xs opacity-70 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>

              {/* Recent transactions for this month */}
              {monthTxns.length > 0 && (
                <div className="space-y-2 mb-4">
                  {monthTxns.slice(0, 3).map(t => (
                    <div key={t.id} className="flex items-center justify-between text-sm py-1.5 border-t border-gray-50">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${TXN_COLORS[t.type]}`}>
                          {t.type}
                        </span>
                        <span className="text-gray-500 text-xs">{t.description ?? format(new Date(t.created_at),"dd MMM")}</span>
                      </div>
                      <span className="font-semibold text-[#2B1B14]">{formatPrice(t.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => { setModal({ emp, type: "salary" }); setForm(f => ({ ...f, amount: String(netDue), reference_month: filterMonth })); }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-700 rounded-xl text-xs font-semibold hover:bg-green-100 transition-colors">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Pay Salary
                </button>
                <button onClick={() => { setModal({ emp, type: "advance" }); setForm(f => ({ ...f, amount: "", reference_month: filterMonth })); }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-orange-50 text-orange-700 rounded-xl text-xs font-semibold hover:bg-orange-100 transition-colors">
                  <TrendingDown className="w-3.5 h-3.5" /> Advance
                </button>
                <button onClick={() => { setModal({ emp, type: "bonus" }); setForm(f => ({ ...f, amount: "", reference_month: filterMonth })); }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-xs font-semibold hover:bg-purple-100 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Bonus
                </button>
                <button onClick={() => { setModal({ emp, type: "deduction" }); setForm(f => ({ ...f, amount: "", reference_month: filterMonth })); }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-700 rounded-xl text-xs font-semibold hover:bg-red-100 transition-colors">
                  <X className="w-3.5 h-3.5" /> Deduction
                </button>
              </div>
            </div>
          </div>
        ))}

        {employees.length === 0 && (
          <div className="bg-white rounded-2xl p-16 text-center text-gray-400 shadow-sm border border-gray-100">
            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No active employees found</p>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-[#2B1B14] text-lg capitalize">
                {modal.type} — {modal.emp.name}
              </h2>
              <button onClick={() => setModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              {/* Type toggle */}
              <div className="flex gap-2 flex-wrap">
                {(["salary","advance","bonus","deduction","other"] as TransactionType[]).map(t => (
                  <button key={t} onClick={() => setModal(m => m ? { ...m, type: t } : null)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                      modal.type === t ? "bg-[#E86A2A] text-white" : "bg-[#FFF7ED] text-[#5C3D2E] hover:bg-[#F5EBDD]"}`}>
                    {t}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#2B1B14] mb-1.5">Amount (₹) *</label>
                <input type="number" min="1" value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#FFF7ED] border border-[#E8D5C0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E86A2A]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#2B1B14] mb-1.5">Method</label>
                  <select value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value as PaymentMethod }))}
                    className="w-full px-4 py-3 bg-[#FFF7ED] border border-[#E8D5C0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E86A2A]">
                    {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#2B1B14] mb-1.5">Month</label>
                  <input type="month" value={form.reference_month}
                    onChange={e => setForm(f => ({ ...f, reference_month: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#FFF7ED] border border-[#E8D5C0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E86A2A]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#2B1B14] mb-1.5">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional note..."
                  className="w-full px-4 py-3 bg-[#FFF7ED] border border-[#E8D5C0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E86A2A]" />
              </div>
              <div className="bg-[#FFF7ED] rounded-xl p-3 text-sm text-[#5C3D2E]">
                <strong>{modal.emp.name}</strong> · Monthly Salary: {formatPrice(modal.emp.monthly_salary)}
              </div>
              <button onClick={save} disabled={saving}
                className="w-full bg-[#E86A2A] text-white py-3.5 rounded-2xl font-semibold hover:bg-[#C94F16] transition-colors disabled:opacity-60">
                {saving ? "Saving..." : "Record Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
