import Link from "next/link";
import { QrCode, Smartphone, ArrowRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";

export default function OrderPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FAF3E8] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 bg-[#BF4E19] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <QrCode className="w-12 h-12 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-[#1A1108] mb-3">
            Scan to Order
          </h1>
          <p className="text-[#3D2B1A] mb-6 leading-relaxed">
            Use the QR code on your café table to open the menu and place your
            order. Each table has its own unique QR code.
          </p>

          <div className="bg-white rounded-3xl p-6 border border-[#E8D5B7] mb-6">
            <div className="flex items-center gap-4 text-left">
              <div className="w-10 h-10 bg-[#FAF3E8] rounded-xl flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-[#BF4E19]" />
              </div>
              <div>
                <p className="font-semibold text-[#1A1108] text-sm">
                  How to order
                </p>
                <p className="text-[#6B4C35] text-xs mt-0.5">
                  Open your camera app and point it at the QR code on your table.
                  The menu will open automatically.
                </p>
              </div>
            </div>
          </div>

          {/* Demo links */}
          <div className="bg-[#F2E6D0] rounded-3xl p-5 border border-[#E8D5B7]">
            <p className="text-[#6B4C35] text-sm mb-3 font-medium">
              Demo — try a table:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {["T01", "T02", "T03", "T04"].map((t) => (
                <Link
                  key={t}
                  href={`/order/${t}`}
                  className="flex items-center justify-between bg-white px-4 py-3 rounded-xl text-sm font-semibold text-[#1A1108] hover:bg-[#BF4E19] hover:text-white transition-colors border border-[#E8D5B7] hover:border-[#BF4E19]"
                >
                  <span>Table {t.slice(1)}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
