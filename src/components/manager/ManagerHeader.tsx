"use client";

import { useRouter } from "next/navigation";
import { LogOut, Coffee, Bell, ShieldCheck, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import type { SessionUser } from "@/lib/auth";

interface Props {
  user: SessionUser;
}

export default function ManagerHeader({ user }: Props) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    router.push("/manager-login");
    router.refresh();
  }

  const isAdmin = user.role === "admin";

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between">
      {/* Mobile logo */}
      <div className="flex items-center gap-2 lg:hidden">
        <div className="w-8 h-8 bg-[#E86A2A] rounded-xl flex items-center justify-center">
          <Coffee className="w-4 h-4 text-white" />
        </div>
        <span className="font-display font-bold text-[#2B1B14]">KOKO</span>
      </div>

      {/* Desktop welcome */}
      <div className="hidden lg:flex items-center gap-3">
        <div>
          <p className="text-xs text-gray-400">Welcome back</p>
          <p className="font-semibold text-[#2B1B14] text-sm leading-none mt-0.5">
            {user.email}
          </p>
        </div>
        {/* Role badge */}
        <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
          isAdmin
            ? "bg-[#E86A2A]/10 text-[#E86A2A] border border-[#E86A2A]/20"
            : "bg-gray-100 text-gray-600 border border-gray-200"
        }`}>
          {isAdmin
            ? <ShieldCheck className="w-3 h-3" />
            : <Shield className="w-3 h-3" />}
          {isAdmin ? "Admin" : "Manager"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Mobile role badge */}
        <span className={`flex lg:hidden items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
          isAdmin ? "bg-[#E86A2A]/10 text-[#E86A2A]" : "bg-gray-100 text-gray-500"}`}>
          {isAdmin ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
          {isAdmin ? "Admin" : "Manager"}
        </span>

        <button
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 relative"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFF7ED] text-[#E86A2A] text-sm font-semibold hover:bg-[#F5EBDD] transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:block">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
