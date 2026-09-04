import { getSessionUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ReportsClient from "./ReportsClient";
import { currentMonthIST } from "@/lib/utils";

export default async function ReportsPage() {
  // Hard server-side guard — admins only
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== "admin") {
    notFound();
  }

  const supabase = await createClient();
  const db = supabase as any;
  const month = currentMonthIST();
  const monthStart = `${month}-01`;

  const [{ data: orders }, { data: orderItems }, { data: employees },
    { data: attendance }, { data: transactions }, { data: invItems }, { data: invMovements }] =
    await Promise.all([
      db.from("orders").select("*, table:tables(table_number)").gte("created_at", monthStart).order("created_at", { ascending: false }),
      db.from("order_items").select("*"),
      db.from("employees").select("*").order("name"),
      db.from("attendance").select("*, employee:employees(name)").gte("date", monthStart),
      db.from("employee_transactions").select("*, employee:employees(name)").order("created_at", { ascending: false }),
      db.from("inventory_items").select("*, category:inventory_categories(name)").order("name"),
      db.from("inventory_movements").select("*, item:inventory_items(name,unit)").gte("created_at", monthStart).order("created_at", { ascending: false }),
    ]);

  return (
    <ReportsClient
      orders={orders ?? []} orderItems={orderItems ?? []}
      employees={employees ?? []} attendance={attendance ?? []}
      transactions={transactions ?? []} invItems={invItems ?? []}
      invMovements={invMovements ?? []} defaultMonth={month}
    />
  );
}
