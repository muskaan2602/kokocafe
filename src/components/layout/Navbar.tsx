"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#F5EBDD] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group"
            aria-label="KOKO Café home"
          >
            <div className="w-9 h-9 bg-[#E86A2A] rounded-xl flex items-center justify-center shadow-sm group-hover:bg-[#C94F16] transition-colors">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <div className="leading-none">
              <span className="font-display font-bold text-[#2B1B14] text-lg tracking-tight">
                KOKO
              </span>
              <span className="block text-[10px] text-[#8B5E44] font-medium tracking-widest uppercase -mt-0.5">
                Café & Bakers
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-[#FFF7ED] text-[#E86A2A]"
                    : "text-[#5C3D2E] hover:text-[#E86A2A] hover:bg-[#FFF7ED]"
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/order"
              className="ml-2 px-4 py-2 bg-[#E86A2A] text-white rounded-xl text-sm font-semibold hover:bg-[#C94F16] transition-colors shadow-sm"
            >
              Order Now
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-[#5C3D2E] hover:bg-[#F5EBDD] transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#F5EBDD] bg-white animate-fade-in">
          <nav className="px-4 py-4 space-y-1" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "block px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-[#FFF7ED] text-[#E86A2A]"
                    : "text-[#5C3D2E] hover:text-[#E86A2A] hover:bg-[#FFF7ED]"
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/order"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 bg-[#E86A2A] text-white rounded-xl text-sm font-semibold text-center hover:bg-[#C94F16] transition-colors mt-2"
            >
              Order Now
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
