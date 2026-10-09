"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { Settings, Lock, Coffee, Bell } from "lucide-react";

interface Props { userEmail: string }

export default function SettingsClient({ userEmail }: Props) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match"); return; }
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated successfully");
      setNewPassword(""); setConfirmPassword("");
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1108]">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your account and café settings</p>
      </div>

      {/* Café info */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-[#FAF3E8] rounded-xl flex items-center justify-center">
            <Coffee className="w-5 h-5 text-[#BF4E19]" />
          </div>
          <h2 className="font-semibold text-[#1A1108]">Café Information</h2>
        </div>
        <div className="space-y-3 text-sm">
          {[
            { label: "Name", value: "KOKO – Café & Bakers" },
            { label: "Address", value: "12, Bakers Lane, Indiranagar, Bengaluru – 560038" },
            { label: "Phone", value: "+91 80 1234 5678" },
            { label: "Tax Rate (GST)", value: "5%" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-gray-500">{label}</span>
              <span className="font-medium text-[#1A1108]">{value}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4">To update café info, edit the code in your deployment settings.</p>
      </div>

      {/* Account */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-[#FAF3E8] rounded-xl flex items-center justify-center">
            <Lock className="w-5 h-5 text-[#BF4E19]" />
          </div>
          <div>
            <h2 className="font-semibold text-[#1A1108]">Account Security</h2>
            <p className="text-xs text-gray-400">{userEmail}</p>
          </div>
        </div>
        <form onSubmit={changePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#1A1108] mb-1.5">New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} placeholder="At least 6 characters" className="w-full px-4 py-3 bg-[#FAF3E8] border border-[#E8D5B7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19]" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#1A1108] mb-1.5">Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Repeat password" className="w-full px-4 py-3 bg-[#FAF3E8] border border-[#E8D5B7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF4E19]" />
          </div>
          <button type="submit" disabled={saving} className="bg-[#BF4E19] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#A33D10] transition-colors disabled:opacity-60">
            {saving ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
