import { createClient } from "@/lib/supabase/server";
import InventoryClient from "./InventoryClient";

export default async function InventoryPage() {
  const supabase = await createClient();
  const db = supabase as any;

  const [{ data: items }, { data: categories }, { data: recentMovements }] =
    await Promise.all([
      db
        .from("inventory_items")
        .select("*, category:inventory_categories(*)")
        .order("name"),
      db.from("inventory_categories").select("*").order("name"),
      db
        .from("inventory_movements")
        .select("*, item:inventory_items(name,unit)")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  return (
    <InventoryClient
      items={items ?? []}
      categories={categories ?? []}
      recentMovements={recentMovements ?? []}
    />
  );
}
