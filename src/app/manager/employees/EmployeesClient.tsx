"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus, Search, Pencil, UserX, UserCheck, X, Phone, Mail,
  Calendar, DollarSign, Users, ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { format } from "date-fns";
import type { Employee, EmployeeRole, EmployeeStatus } from "@/lib/supabase/types";
import { formatPrice } from "@/lib/utils";

const ROLES: EmployeeRole[] = ["Barista","Chef","Baker","Waiter","Cashier","Manager","Cleaner","Security","Delivery","Other"];

const ROLE_COLORS: Record<string, string> = {
  Barista: "bg-orange-100 text-orange-700", Chef: "bg-red-100 text-red-700",
  Baker: "bg-yellow-100 text-yellow-700", Waiter: "bg-blue-100 text-blue-700",
  Cashier: "bg-green-100 text-green-700", Manager: "bg-purple-100 text-purple-700",
  Cleaner: "bg-gray-100 text-gray-700", Security: "bg-slate-100 text-slate-700",
  Delivery: "bg-cyan-100 text-cyan-700", Other: "bg-gray-100 text-gray-600",
};

const EMPTY_FORM = {
  id: "", employee_id: "", name: "", phone: "", email: "",
  role: "Waiter" as EmployeeRole, joining_date: new Date().toISOString().slice(0,10),
  leaving_date: "", monthly_salary: "", address: "", notes: "",
};

function generateEmpId(employees: Employee[]) {
  const max = employees.reduce((m, e) => {
    const n = parseInt(e.employee_id.replace(/\D/g,"")) || 0;
    return n > m ? n : m;
  }, 0);
  return `EMP${String(max + 1).padStart(3, "0")}`;
}

export default function EmployeesClient({ employees: init }: { employees: Employee[] }) {
  const [employees, setEmployees] = useState<Employee[]>(init);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all"|"active"|"inactive">("active");
  const [filterRole, setFilterRole] = useState("All");
  const [modal, setModal] = useState<"add"|"edit"|null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const db = (createClient() as any);

  const filtered = employees.filter(e => {
    const matchSearch = search === "" ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.employee_id.toLowerCase().includes(search.toLowerCase()) ||
      (e.phone ?? "").includes(search);
    const matchStatus = filterStatus === "all" || e.status === filterStatus;
    const matchRole = filterRole === "All" || e.role === filterRole;
    return matchSearch && matchStatus && matchRole;
  });

  const activeCount = employees.filter(e => e.status === "active").length;

  function openAdd() {
    setForm({ ...EMPTY_FORM, employee_id: generateEmpId(employees) });
    setModal("add");
  }
  function openEdit(emp: Employee) {
    setForm({
      id: emp.id, employee_id: emp.employee_id, name: emp.name,
      phone: emp.phone ?? "", email: emp.email ?? "", role: emp.role,
      joining_date: emp.joining_date, leaving_date: emp.leaving_date ?? "",
      monthly_salary: String(emp.monthly_salary), address: emp.address ?? "",
      notes: emp.notes ?? "",
    });
    setModal("edit");
  }

  async function save() {
    if (!form.name || !form.employee_id) { toast.error("Name and Employee ID required"); return; }
    setSaving(true);
    try {
      const payload = {
        employee_id: form.employee_id, name: form.name,
        phone: form.phone || null, email: form.email || null,
        role: form.role, joining_date: form.joining_date,
        leaving_date: form.leaving_date || null,
        monthly_salary: parseFloat(form.monthly_salary) || 0,
        address: form.address || null, notes: form.notes || null,
      };
      if (modal === "edit" && form.id) {
        const { data, error } = await db.from("employees").update(payload).eq("id", form.id).select().single();
        if (error) throw error;
        setEmployees(p => p.map(e => e.id === form.id ? data : e));
        toast.success("Employee updated");
      } else {
        const { data, error } = await db.from("employees").insert([{ ...payload, status: "active" }]).select().single();
        if (error) throw error;
        setEmployees(p => [...p, data]);
        toast.success("Employee added");
      }
      setModal(null);
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  }

  async function toggleStatus(emp: Employee) {
    const newStatus: EmployeeStatus = emp.status === "active" ? "inactive" : "active";
    const payload: any = { status: newStatus };
    if (newStatus === "inactive" && !emp.leaving_date) payload.leaving_date = new Date().toISOString().slice(0,10);
    if (newStatus === "active") payload.leaving_date = null;
    const { error } = await db.from("employees").update(payload).eq("id", emp.id);
    if (error) { toast.error(error.message); return; }
    setEmployees(p => p.map(e => e.id === emp.id ? { ...e, ...payload } : e));
    toast.success(newStatus === "active" ? "Employee reactivated" : "Employee deactivated");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1108]">Employees</h1>
          <p className="text-gray-500 text-sm mt-0.5">{activeCount} active · {employees.length} total</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-[#BF4E19] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#A33D10] transition-colors">
          <Plus className="w-4 h-4" /> Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, ID or phone..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19]" />
        </div>
        <div className="flex gap-2">
          {(["active","inactive","all"] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors capitalize ${
                filterStatus === s ? "bg-[#BF4E19] text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-[#BF4E19]"}`}>
              {s}
            </button>
          ))}
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19]">
          <option value="All">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#FAF3E8] text-left">
                <th className="px-5 py-3.5 font-semibold text-[#1A1108]">Employee</th>
                <th className="px-4 py-3.5 font-semibold text-[#1A1108]">Role</th>
                <th className="px-4 py-3.5 font-semibold text-[#1A1108]">Phone</th>
                <th className="px-4 py-3.5 font-semibold text-[#1A1108]">Salary</th>
                <th className="px-4 py-3.5 font-semibold text-[#1A1108]">Joined</th>
                <th className="px-4 py-3.5 font-semibold text-[#1A1108]">Status</th>
                <th className="px-4 py-3.5 font-semibold text-[#1A1108]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(emp => (
                <tr key={emp.id} className={`hover:bg-gray-50 ${emp.status === "inactive" ? "opacity-60" : ""}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#BF4E19] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-[#1A1108]">{emp.name}</div>
                        <div className="text-xs text-gray-400">{emp.employee_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${ROLE_COLORS[emp.role] ?? "bg-gray-100 text-gray-600"}`}>
                      {emp.role}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-600">{emp.phone ?? "—"}</td>
                  <td className="px-4 py-3.5 font-semibold text-[#BF4E19]">{formatPrice(emp.monthly_salary)}</td>
                  <td className="px-4 py-3.5 text-gray-500 text-xs">
                    {format(new Date(emp.joining_date), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      emp.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <Link href={`/manager/employees/${emp.id}`}
                        className="p-2 rounded-lg text-gray-400 hover:text-[#BF4E19] hover:bg-[#FAF3E8] transition-colors" title="View profile">
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                      <button onClick={() => openEdit(emp)}
                        className="p-2 rounded-lg text-gray-400 hover:text-[#BF4E19] hover:bg-[#FAF3E8] transition-colors" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => toggleStatus(emp)}
                        className={`p-2 rounded-lg transition-colors ${emp.status === "active"
                          ? "text-gray-400 hover:text-red-500 hover:bg-red-50"
                          : "text-gray-400 hover:text-green-600 hover:bg-green-50"}`}
                        title={emp.status === "active" ? "Deactivate" : "Reactivate"}>
                        {emp.status === "active" ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  No employees found
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-[#1A1108] text-xl">{modal === "add" ? "Add Employee" : "Edit Employee"}</h2>
              <button onClick={() => setModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1A1108] mb-1.5">Employee ID *</label>
                  <input value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })}
                    className="w-full px-4 py-3 bg-[#FAF3E8] border border-[#E8D5B7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1A1108] mb-1.5">Full Name *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-4 py-3 bg-[#FAF3E8] border border-[#E8D5B7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1A1108] mb-1.5">Role</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as EmployeeRole })}
                    className="w-full px-4 py-3 bg-[#FAF3E8] border border-[#E8D5B7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19]">
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1A1108] mb-1.5">Monthly Salary (₹)</label>
                  <input type="number" min="0" value={form.monthly_salary}
                    onChange={e => setForm({ ...form, monthly_salary: e.target.value })}
                    className="w-full px-4 py-3 bg-[#FAF3E8] border border-[#E8D5B7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1A1108] mb-1.5">Phone</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-[#FAF3E8] border border-[#E8D5B7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1A1108] mb-1.5">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 bg-[#FAF3E8] border border-[#E8D5B7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1A1108] mb-1.5">Joining Date</label>
                  <input type="date" value={form.joining_date} onChange={e => setForm({ ...form, joining_date: e.target.value })}
                    className="w-full px-4 py-3 bg-[#FAF3E8] border border-[#E8D5B7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1A1108] mb-1.5">Leaving Date</label>
                  <input type="date" value={form.leaving_date} onChange={e => setForm({ ...form, leaving_date: e.target.value })}
                    className="w-full px-4 py-3 bg-[#FAF3E8] border border-[#E8D5B7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A1108] mb-1.5">Address</label>
                <textarea rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                  className="w-full px-4 py-3 bg-[#FAF3E8] border border-[#E8D5B7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19] resize-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A1108] mb-1.5">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-4 py-3 bg-[#FAF3E8] border border-[#E8D5B7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19] resize-none" />
              </div>
              <button onClick={save} disabled={saving}
                className="w-full bg-[#BF4E19] text-white py-3.5 rounded-2xl font-semibold hover:bg-[#A33D10] transition-colors disabled:opacity-60">
                {saving ? "Saving..." : modal === "add" ? "Add Employee" : "Update Employee"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
