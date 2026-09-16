import { createClient } from "@/lib/supabase/server";
import DeliveryClient from "./DeliveryClient";
import { todayIST } from "@/lib/utils";

export default async function DeliveryPage() {
  const supabase = await createClient();
  const db = supabase as any;
  const today = todayIST();

  const [{ data: deliveryOrders }, { data: menuItems }, { data: categories }] =
    await Promise.all([
      db
        .from("orders")
        .select("*, order_items(*)")
        .in("order_source", ["zomato", "swiggy", "phone", "takeaway", "other"])
        .order("created_at", { ascending: false })
        .limit(100),
      db
        .from("menu_items")
        .select("id, name, price, category_id, is_available")
        .eq("is_available", true)
        .order("name"),
      db.from("categories").select("id, name, icon").order("sort_order"),
    ]);

  return (
    <DeliveryClient
      orders={deliveryOrders ?? []}
      menuItems={menuItems ?? []}
      categories={categories ?? []}
      today={today}
    />
  );
}
