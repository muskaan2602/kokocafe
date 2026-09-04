import { getSessionUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StaffClient from "./StaffClient";

export default async function StaffPage() {
  // Admin only
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== "admin") notFound();

  const supabase = await createClient();
  const db = supabase as any;

  const { data: profiles } = await db
    .from("profiles")
    .select("id, email, role, created_at")
    .order("created_at", { ascending: true });

  return (
    <StaffClient
      profiles={profiles ?? []}
      currentUserId={sessionUser.id}
    />
  );
}
