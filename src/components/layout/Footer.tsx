import Link from "next/link";
import { Coffee, MapPin, Phone, Clock, Share2, Lock } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#2B1B14] text-[#F5EBDD]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-[#E86A2A] rounded-xl flex items-center justify-center">
                <Coffee className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-display font-bold text-white text-lg">KOKO</span>
                <span className="block text-[10px] text-[#8B5E44] font-medium tracking-widest uppercase -mt-0.5">
                  Café & Bakers
                </span>
              </div>
            </div>
            <p className="text-sm text-[#8B5E44] leading-relaxed mb-4">
              Freshly brewed. Freshly baked. Made for you. Experience the warmth
              of KOKO every day.
            </p>
            <div className="flex gap-3">
              <a href="#" aria-label="Instagram"
                className="w-9 h-9 bg-[#5C3D2E] rounded-lg flex items-center justify-center hover:bg-[#E86A2A] transition-colors">
                <Share2 className="w-4 h-4" />
              </a>
              <a href="#" aria-label="Facebook"
                className="w-9 h-9 bg-[#5C3D2E] rounded-lg flex items-center justify-center hover:bg-[#E86A2A] transition-colors">
                <Share2 className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-widest">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/",       label: "Home"     },
                { href: "/menu",   label: "Menu"     },
                { href: "/about",  label: "About Us" },
                { href: "/contact",label: "Contact"  },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href}
                    className="text-sm text-[#8B5E44] hover:text-[#E86A2A] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Opening Hours */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-widest">
              Opening Hours
            </h3>
            <ul className="space-y-2 text-sm text-[#8B5E44]">
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#E86A2A] mt-0.5 shrink-0" />
                <div>
                  <div className="text-white">Mon – Fri</div>
                  <div>8:00 AM – 10:00 PM</div>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#E86A2A] mt-0.5 shrink-0" />
                <div>
                  <div className="text-white">Saturday</div>
                  <div>8:00 AM – 11:00 PM</div>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#E86A2A] mt-0.5 shrink-0" />
                <div>
                  <div className="text-white">Sunday</div>
                  <div>9:00 AM – 10:00 PM</div>
                </div>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-widest">
              Find Us
            </h3>
            <ul className="space-y-3 text-sm text-[#8B5E44]">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#E86A2A] mt-0.5 shrink-0" />
                <span>
                  12, Bakers Lane, Indiranagar,<br />
                  Bengaluru – 560038
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#E86A2A] shrink-0" />
                <a href="tel:+918012345678" className="hover:text-[#E86A2A] transition-colors">
                  +91 80 1234 5678
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#5C3D2E] mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#8B5E44]">
            © {new Date().getFullYear()} KOKO Café & Bakers. All rights reserved.
          </p>

          {/* Staff login — subtle, not obvious to customers */}
          <Link
            href="/manager-login"
            className="flex items-center gap-1.5 text-[#5C3D2E] hover:text-[#8B5E44] transition-colors group"
            title="Staff login"
          >
            <Lock className="w-3 h-3 group-hover:text-[#E86A2A] transition-colors" />
            <span className="text-[11px] tracking-wide">Staff Login</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
