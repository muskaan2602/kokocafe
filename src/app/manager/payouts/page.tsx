import { getSessionUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PayoutsClient from "./PayoutsClient";
import { currentMonthIST } from "@/lib/utils";

export default async function PayoutsPage() {
  // Hard server-side guard — admins only
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== "admin") {
    notFound(); // renders the app's not-found page, no data leakage
  }

  const supabase = await createClient();
  const db = supabase as any;
  const month = currentMonthIST();

  const [{ data: employees }, { data: transactions }] = await Promise.all([
    db.from("employees").select("*").eq("status", "active").order("name"),
    db.from("employee_transactions").select("*").order("created_at", { ascending: false }),
  ]);

  return (
    <PayoutsClient
      employees={employees ?? []}
      transactions={transactions ?? []}
      currentMonth={month}
    />
  );
}
