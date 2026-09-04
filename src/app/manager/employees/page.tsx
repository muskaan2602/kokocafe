import { createClient } from "@/lib/supabase/server";
import EmployeesClient from "./EmployeesClient";

export default async function EmployeesPage() {
  const supabase = await createClient();
  const db = supabase as any;

  const { data: employees } = await db
    .from("employees")
    .select("*")
    .order("name");

  return <EmployeesClient employees={employees ?? []} />;
}
