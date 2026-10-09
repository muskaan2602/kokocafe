import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PublicMenuClient from "./PublicMenuClient";

export const revalidate = 60;

export default async function MenuPage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: menuItems }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase
      .from("menu_items")
      .select("*, category:categories(*)")
      .order("sort_order"),
  ]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FAF3E8]">
        {/* Header */}
        <div className="bg-[#1A1108] py-16 text-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="inline-block bg-[#BF4E19]/20 text-[#BF4E19] text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4 border border-[#BF4E19]/30">
              Full Menu
            </div>
            <h1 className="font-display text-5xl font-bold text-white mb-3">
              KOKO Menu
            </h1>
            <p className="text-[#6B4C35] text-lg">
              Freshly made, every single day.
            </p>
          </div>
        </div>

        <PublicMenuClient
          categories={categories ?? []}
          menuItems={(menuItems as any[]) ?? []}
        />
      </main>
      <Footer />
    </>
  );
}
