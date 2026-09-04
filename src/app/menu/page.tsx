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
      <main className="min-h-screen bg-[#FFF7ED]">
        {/* Header */}
        <div className="bg-[#2B1B14] py-16 text-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="inline-block bg-[#E86A2A]/20 text-[#E86A2A] text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4 border border-[#E86A2A]/30">
              Full Menu
            </div>
            <h1 className="font-display text-5xl font-bold text-white mb-3">
              KOKO Menu
            </h1>
            <p className="text-[#8B5E44] text-lg">
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
