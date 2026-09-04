import { createClient } from "@/lib/supabase/server";
import TablesClient from "./TablesClient";

export default async function TablesPage() {
  const supabase = await createClient();

  const { data: tables } = await supabase
    .from("tables")
    .select("*")
    .order("table_number");

  // Fetch latest order per table
  const { data: activeOrders } = await supabase
    .from("orders")
    .select("table_id, status, order_number, total, created_at")
    .not("status", "in", '("completed","rejected")')
    .order("created_at", { ascending: false });

  return (
    <TablesClient
      tables={(tables as any[]) ?? []}
      activeOrders={(activeOrders as any[]) ?? []}
    />
  );
}
