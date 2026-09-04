"use client";

import { useState } from "react";
import {
  Plus, ShieldCheck, Shield, Pencil, UserX, X,
  Eye, EyeOff, KeyRound, Users, Lock, CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

interface Profile {
  id: string;
  email: string;
  role: "admin" | "manager";
  created_at: string;
}

interface Props {
  profiles: Profile[];
  currentUserId: string;
}

// What each role can access — shown in the UI
const ACCESS_MAP = {
  admin: {
    label: "Admin",
    color: "bg-[#E86A2A]/10 text-[#E86A2A] border-[#E86A2A]/20",
    dot: "bg-[#E86A2A]",
    icon: ShieldCheck,
    access: [
      "✅ Dashboard & Analytics",
      "✅ Live Orders & Tables",
      "✅ Menu & Categories",
      "✅ Inventory",
      "✅ Employees & Attendance",
      "✅ Payouts & Salary (Admin only)",
      "✅ Reports & Exports (Admin only)",
      "✅ Staff Account Management",
      "✅ Settings",
    ],
  },
  manager: {
    label: "Manager",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    dot: "bg-gray-400",
    icon: Shield,
    access: [
      "✅ Dashboard",
      "✅ Live Orders & Tables",
      "✅ Menu & Categories",
      "✅ Inventory",
      "✅ Employees & Attendance",
      "🔒 Payouts (Admin only)",
      "🔒 Reports (Admin only)",
      "🔒 Staff Accounts (Admin only)",
    ],
  },
};

export default function StaffClient({ profiles: init, currentUserId }: Props) {
  const [profiles, setProfiles] = useState<Profile[]>(init);
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);

  // Create form state
  const [createForm, setCreateForm] = useState({
    email: "", password: "", confirmPassword: "", role: "manager" as "admin" | "manager",
  });
  const [showPw, setShowPw] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    role: "manager" as "admin" | "manager", newPassword: "", confirmNewPassword: "",
  });
  const [showNewPw, setShowNewPw] = useState(false);

  async function createStaff() {
    if (!createForm.email) { toast.error("Email is required"); return; }
    if (createForm.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (createForm.password !== createForm.confirmPassword) { toast.error("Passwords do not match"); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/create-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: createForm.email,
          password: createForm.password,
          role: createForm.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setProfiles(p => [...p, {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role,
        created_at: new Date().toISOString(),
      }]);
      toast.success(`${createForm.role === "admin" ? "Admin" : "Manager"} account created`);
      setCreateModal(false);
      setCreateForm({ email: "", password: "", confirmPassword: "", role: "manager" });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function updateStaff() {
    if (!editModal) return;
    if (editForm.newPassword && editForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters"); return;
    }
    if (editForm.newPassword && editForm.newPassword !== editForm.confirmNewPassword) {
      toast.error("Passwords do not match"); return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/update-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editModal.id,
          role: editForm.role,
          newPassword: editForm.newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setProfiles(p => p.map(pr =>
        pr.id === editModal.id ? { ...pr, role: editForm.role } : pr
      ));
      toast.success("Account updated");
      setEditModal(null);
      setEditForm({ role: "manager", newPassword: "", confirmNewPassword: "" });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function deactivateStaff(profile: Profile) {
    if (!confirm(`Deactivate ${profile.email}? They will no longer be able to log in.`)) return;
    try {
      const res = await fetch("/api/admin/delete-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfiles(p => p.filter(pr => pr.id !== profile.id));
      toast.success("Account deactivated");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  function openEdit(profile: Profile) {
    setEditForm({ role: profile.role, newPassword: "", confirmNewPassword: "" });
    setEditModal(profile);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2B1B14]">Staff Accounts</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {profiles.length} account{profiles.length !== 1 ? "s" : ""} · Admin-only section
          </p>
        </div>
        <button
          onClick={() => setCreateModal(true)}
          className="flex items-center gap-2 bg-[#E86A2A] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#C94F16] transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Account
        </button>
      </div>

      {/* Role explanation cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {(["admin", "manager"] as const).map(role => {
          const cfg = ACCESS_MAP[role];
          const Icon = cfg.icon;
          return (
            <div key={role} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${cfg.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#2B1B14]">{cfg.label}</h3>
                  <p className="text-xs text-gray-400">Dashboard access level</p>
                </div>
              </div>
              <ul className="space-y-1.5">
                {cfg.access.map(a => (
                  <li key={a} className={`text-xs ${a.startsWith("🔒") ? "text-gray-400" : "text-gray-600"}`}>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Accounts table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#FFF7ED] text-left">
                <th className="px-5 py-3.5 font-semibold text-[#2B1B14]">Email</th>
                <th className="px-4 py-3.5 font-semibold text-[#2B1B14]">Role</th>
                <th className="px-4 py-3.5 font-semibold text-[#2B1B14]">Payouts Access</th>
                <th className="px-4 py-3.5 font-semibold text-[#2B1B14]">Created</th>
                <th className="px-4 py-3.5 font-semibold text-[#2B1B14]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {profiles.map(profile => {
                const cfg = ACCESS_MAP[profile.role];
                const Icon = cfg.icon;
                const isSelf = profile.id === currentUserId;
                return (
                  <tr key={profile.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#E86A2A] rounded-full flex items-center justify-center text-white font-bold text-xs">
                          {profile.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-[#2B1B14]">{profile.email}</p>
                          {isSelf && (
                            <p className="text-xs text-[#E86A2A] font-medium">You</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.color}`}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {profile.role === "admin" ? (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Full Access
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Lock className="w-3.5 h-3.5" /> No Access
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-gray-400 text-xs">
                      {format(new Date(profile.created_at), "dd MMM yyyy")}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(profile)}
                          className="p-2 rounded-lg text-gray-400 hover:text-[#E86A2A] hover:bg-[#FFF7ED] transition-colors"
                          title="Edit role / reset password"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {!isSelf && (
                          <button
                            onClick={() => deactivateStaff(profile)}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Deactivate account"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {profiles.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    No accounts yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create Account Modal ── */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCreateModal(false)} />
          <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-[#2B1B14] text-xl">Create Staff Account</h2>
              <button onClick={() => setCreateModal(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Role selector */}
              <div>
                <label className="block text-sm font-semibold text-[#2B1B14] mb-2">Role</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["manager", "admin"] as const).map(r => {
                    const cfg = ACCESS_MAP[r];
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={r}
                        onClick={() => setCreateForm(f => ({ ...f, role: r }))}
                        className={`flex items-center gap-2 p-3 rounded-2xl border-2 text-left transition-all ${
                          createForm.role === r
                            ? "border-[#E86A2A] bg-[#FFF7ED]"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${createForm.role === r ? "text-[#E86A2A]" : "text-gray-400"}`} />
                        <div>
                          <p className={`text-sm font-semibold ${createForm.role === r ? "text-[#E86A2A]" : "text-[#2B1B14]"}`}>
                            {cfg.label}
                          </p>
                          <p className="text-xs text-gray-400">
                            {r === "admin" ? "Full access" : "No financial access"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Access preview for selected role */}
              <div className="bg-[#FFF7ED] rounded-2xl p-4 text-xs space-y-1">
                <p className="font-semibold text-[#2B1B14] mb-2">
                  {ACCESS_MAP[createForm.role].label} can access:
                </p>
                {ACCESS_MAP[createForm.role].access.slice(0, 5).map(a => (
                  <p key={a} className={a.startsWith("🔒") ? "text-gray-400" : "text-[#5C3D2E]"}>{a}</p>
                ))}
                {createForm.role === "manager" && (
                  <p className="text-gray-400">🔒 Payouts, Reports, Staff Accounts (Admin only)</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#2B1B14] mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="staff@kokocafe.in"
                  className="w-full px-4 py-3 bg-[#FFF7ED] border border-[#E8D5C0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E86A2A]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#2B1B14] mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={createForm.password}
                    onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min 6 characters"
                    className="w-full px-4 py-3 pr-12 bg-[#FFF7ED] border border-[#E8D5C0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E86A2A]"
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B5E44]">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#2B1B14] mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={createForm.confirmPassword}
                  onChange={e => setCreateForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  placeholder="Re-enter password"
                  className="w-full px-4 py-3 bg-[#FFF7ED] border border-[#E8D5C0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E86A2A]"
                />
              </div>

              <button
                onClick={createStaff}
                disabled={saving}
                className="w-full bg-[#E86A2A] text-white py-3.5 rounded-2xl font-semibold hover:bg-[#C94F16] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating...</>
                ) : (
                  <>Create {ACCESS_MAP[createForm.role].label} Account</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditModal(null)} />
          <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-[#2B1B14] text-xl">Edit Account</h2>
                <p className="text-sm text-gray-400 mt-0.5">{editModal.email}</p>
              </div>
              <button onClick={() => setEditModal(null)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Role */}
              <div>
                <label className="block text-sm font-semibold text-[#2B1B14] mb-2">Change Role</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["manager", "admin"] as const).map(r => {
                    const cfg = ACCESS_MAP[r];
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={r}
                        onClick={() => setEditForm(f => ({ ...f, role: r }))}
                        className={`flex items-center gap-2 p-3 rounded-2xl border-2 text-left transition-all ${
                          editForm.role === r
                            ? "border-[#E86A2A] bg-[#FFF7ED]"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${editForm.role === r ? "text-[#E86A2A]" : "text-gray-400"}`} />
                        <p className={`text-sm font-semibold ${editForm.role === r ? "text-[#E86A2A]" : "text-[#2B1B14]"}`}>
                          {cfg.label}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reset password */}
              <div>
                <label className="block text-sm font-semibold text-[#2B1B14] mb-1.5">
                  <KeyRound className="w-4 h-4 inline mr-1" />
                  Reset Password{" "}
                  <span className="font-normal text-gray-400">(leave blank to keep current)</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPw ? "text" : "password"}
                    value={editForm.newPassword}
                    onChange={e => setEditForm(f => ({ ...f, newPassword: e.target.value }))}
                    placeholder="New password"
                    className="w-full px-4 py-3 pr-12 bg-[#FFF7ED] border border-[#E8D5C0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E86A2A]"
                  />
                  <button type="button" onClick={() => setShowNewPw(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B5E44]">
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {editForm.newPassword && (
                <div>
                  <label className="block text-sm font-semibold text-[#2B1B14] mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    value={editForm.confirmNewPassword}
                    onChange={e => setEditForm(f => ({ ...f, confirmNewPassword: e.target.value }))}
                    placeholder="Re-enter new password"
                    className="w-full px-4 py-3 bg-[#FFF7ED] border border-[#E8D5C0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E86A2A]"
                  />
                </div>
              )}

              <button
                onClick={updateStaff}
                disabled={saving}
                className="w-full bg-[#E86A2A] text-white py-3.5 rounded-2xl font-semibold hover:bg-[#C94F16] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                ) : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
