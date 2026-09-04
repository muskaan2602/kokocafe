import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import EmployeeProfileClient from "./EmployeeProfileClient";

export default async function EmployeeProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const db = supabase as any;

  const sessionUser = await getSessionUser();
  const isAdmin = sessionUser?.role === "admin";

  const [{ data: employee }, { data: transactions }, { data: attendance }] =
    await Promise.all([
      db.from("employees").select("*").eq("id", id).single(),
      // Only fetch financial transactions if admin
      isAdmin
        ? db.from("employee_transactions").select("*").eq("employee_id", id).order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
      db.from("attendance").select("*").eq("employee_id", id).order("date", { ascending: false }).limit(90),
    ]);

  if (!employee) notFound();

  return (
    <EmployeeProfileClient
      employee={employee}
      transactions={isAdmin ? (transactions ?? []) : []}
      attendance={attendance ?? []}
      isAdmin={isAdmin}
    />
  );
}
