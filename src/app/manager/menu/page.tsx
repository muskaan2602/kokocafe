import { createClient } from "@/lib/supabase/server";
import MenuManagementClient from "./MenuManagementClient";

export default async function MenuManagementPage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: menuItems }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase
      .from("menu_items")
      .select("*, category:categories(*)")
      .order("sort_order"),
  ]);

  return (
    <MenuManagementClient
      categories={(categories as any[]) ?? []}
      menuItems={(menuItems as any[]) ?? []}
    />
  );
}
