"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ClipboardList, Table2, UtensilsCrossed,
  BarChart3, Settings, Coffee, QrCode, Tag,
  Package, Users, CalendarCheck, Wallet, FileText, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/supabase/types";
import { ADMIN_ONLY_ROUTES } from "@/lib/roles";

const navSections = [
  {
    label: "Operations",
    items: [
      { href: "/manager",            label: "Dashboard",      icon: LayoutDashboard, adminOnly: false },
      { href: "/manager/orders",     label: "Live Orders",    icon: ClipboardList,   adminOnly: false },
      { href: "/manager/tables",     label: "Tables",         icon: Table2,          adminOnly: false },
      { href: "/manager/menu",       label: "Menu",           icon: UtensilsCrossed, adminOnly: false },
      { href: "/manager/categories", label: "Categories",     icon: Tag,             adminOnly: false },
    ],
  },
  {
    label: "Staff & HR",
    items: [
      { href: "/manager/employees",  label: "Employees",      icon: Users,           adminOnly: false },
      { href: "/manager/attendance", label: "Attendance",     icon: CalendarCheck,   adminOnly: false },
      { href: "/manager/payouts",    label: "Payouts",        icon: Wallet,          adminOnly: true  },
    ],
  },
  {
    label: "Stock & Reports",
    items: [
      { href: "/manager/inventory",  label: "Inventory",      icon: Package,         adminOnly: false },
      { href: "/manager/analytics",  label: "Analytics",      icon: BarChart3,       adminOnly: false },
      { href: "/manager/reports",    label: "Reports",        icon: FileText,        adminOnly: true  },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/manager/staff",      label: "Staff Accounts", icon: Users,           adminOnly: true  },
      { href: "/manager/settings",   label: "Settings",       icon: Settings,        adminOnly: false },
    ],
  },
];

interface Props {
  role: UserRole;
}

export default function ManagerSidebar({ role }: Props) {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === "/manager" ? pathname === "/manager" : pathname.startsWith(href);
  }

  return (
    <aside className="w-64 bg-[#2B1B14] flex flex-col shrink-0 hidden lg:flex overflow-y-auto">
      {/* Logo */}
      <div className="p-5 border-b border-[#5C3D2E] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#E86A2A] rounded-xl flex items-center justify-center">
            <Coffee className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-white text-base">KOKO</div>
            <div className="text-[10px] text-[#8B5E44] font-medium tracking-widest uppercase">
              {role === "admin" ? "Admin Portal" : "Manager Portal"}
            </div>
          </div>
        </div>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 p-4 space-y-5">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="text-[10px] text-[#5C3D2E] font-semibold uppercase tracking-widest px-4 mb-1">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon, adminOnly }) => {
                const restricted = role !== "admin" && (adminOnly || ADMIN_ONLY_ROUTES.some(r => href.startsWith(r)));
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      active
                        ? "bg-[#E86A2A] text-white"
                        : restricted
                        ? "text-[#5C3D2E] cursor-not-allowed opacity-50"
                        : "text-[#8B5E44] hover:bg-[#5C3D2E] hover:text-white"
                    )}
                    title={restricted ? "Admin access only" : undefined}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1">{label}</span>
                    {restricted && (
                      <Lock className="w-3 h-3 shrink-0 opacity-60" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Role badge + QR link */}
      <div className="p-4 border-t border-[#5C3D2E] shrink-0 space-y-2">
        {/* Role indicator */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold ${
          role === "admin"
            ? "bg-[#E86A2A]/20 text-[#E86A2A] border border-[#E86A2A]/30"
            : "bg-[#5C3D2E]/50 text-[#8B5E44] border border-[#5C3D2E]"
        }`}>
          <div className={`w-2 h-2 rounded-full ${role === "admin" ? "bg-[#E86A2A]" : "bg-[#8B5E44]"}`} />
          <span className="capitalize">{role} Access</span>
          {role === "admin" && <span className="ml-auto text-[10px] opacity-70">Full Access</span>}
        </div>

        <Link
          href="/manager/tables"
          className="flex items-center gap-2 px-4 py-3 bg-[#5C3D2E] rounded-xl text-sm font-medium text-[#F5EBDD] hover:bg-[#E86A2A] transition-colors"
        >
          <QrCode className="w-4 h-4" />
          Manage QR Codes
        </Link>
      </div>
    </aside>
  );
}
