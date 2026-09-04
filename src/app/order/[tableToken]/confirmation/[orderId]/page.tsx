import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ConfirmationClient from "./ConfirmationClient";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ tableToken: string; orderId: string }>;
}) {
  const { tableToken, orderId } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*), table:tables(*)")
    .eq("id", orderId)
    .single();

  if (!order) notFound();

  return (
    <ConfirmationClient
      order={order as any}
      tableToken={tableToken}
    />
  );
}
