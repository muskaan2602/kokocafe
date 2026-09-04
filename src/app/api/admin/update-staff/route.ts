import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSessionUser } from "@/lib/auth";

// Admin-only API: update role or reset password
export async function POST(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, role, newPassword } = await request.json();
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const adminClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const db = adminClient as any;
  const updates: any = {};

  // Update auth password if provided
  if (newPassword) {
    const { error } = await (adminClient.auth.admin as any).updateUserById(userId, {
      password: newPassword,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Update role in profiles
  if (role && ["manager", "admin"].includes(role)) {
    const { error } = await db
      .from("profiles")
      .update({ role })
      .eq("id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
