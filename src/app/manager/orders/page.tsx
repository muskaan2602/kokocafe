import { createClient } from "@/lib/supabase/server";
import LiveOrdersClient from "./LiveOrdersClient";

export default async function LiveOrdersPage() {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*), table:tables(*)")
    .not("status", "in", '("completed","rejected")')
    .order("created_at", { ascending: false });

  const { data: recentCompleted } = await supabase
    .from("orders")
    .select("*, order_items(*), table:tables(*)")
    .in("status", ["completed", "rejected"])
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <LiveOrdersClient
      initialOrders={(orders as any[]) ?? []}
      initialCompleted={(recentCompleted as any[]) ?? []}
    />
  );
}
