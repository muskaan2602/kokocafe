import { createClient } from "@/lib/supabase/server";
import AttendanceClient from "./AttendanceClient";
import { format } from "date-fns";

export default async function AttendancePage() {
  const supabase = await createClient();
  const db = supabase as any;

  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(new Date(), "yyyy-MM-01");

  const [{ data: employees }, { data: todayRecords }, { data: monthRecords }] =
    await Promise.all([
      db.from("employees").select("id,name,employee_id,role").eq("status","active").order("name"),
      db.from("attendance").select("*").eq("date", today),
      db.from("attendance").select("*").gte("date", monthStart).order("date", { ascending: false }),
    ]);

  return (
    <AttendanceClient
      employees={employees ?? []}
      todayRecords={todayRecords ?? []}
      monthRecords={monthRecords ?? []}
      today={today}
    />
  );
}
