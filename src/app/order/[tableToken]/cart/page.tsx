import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import CartClient from "./CartClient";

export default async function CartPage({
  params,
}: {
  params: Promise<{ tableToken: string }>;
}) {
  const { tableToken } = await params;
  const supabase = await createClient();

  const { data: table } = await supabase
    .from("tables")
    .select("*")
    .eq("qr_token", tableToken)
    .single();

  if (!table) notFound();

  return <CartClient table={table} tableToken={tableToken} />;
}
