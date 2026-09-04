import { CartProvider } from "@/lib/cart-context";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function OrderLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tableToken: string }>;
}) {
  const { tableToken } = await params;

  // Validate table exists
  const supabase = await createClient();
  const { data: table } = await supabase
    .from("tables")
    .select("id")
    .eq("qr_token", tableToken)
    .single();

  if (!table) {
    notFound();
  }

  return (
    <CartProvider tableToken={tableToken}>
      {children}
    </CartProvider>
  );
}
