import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import OrderMenuClient from "./OrderMenuClient";

export default async function OrderMenuPage({
  params,
}: {
  params: Promise<{ tableToken: string }>;
}) {
  const { tableToken } = await params;
  const supabase = await createClient();

  const [{ data: table }, { data: categories }, { data: menuItems }] =
    await Promise.all([
      supabase
        .from("tables")
        .select("*")
        .eq("qr_token", tableToken)
        .single(),
      supabase.from("categories").select("*").order("sort_order"),
      supabase
        .from("menu_items")
        .select("*, category:categories(*)")
        .order("sort_order"),
    ]);

  if (!table) notFound();

  return (
    <OrderMenuClient
      table={table}
      categories={categories ?? []}
      menuItems={(menuItems as any[]) ?? []}
      tableToken={tableToken}
    />
  );
}
