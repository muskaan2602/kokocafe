import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSessionUser } from "@/lib/auth";

// Admin-only API: deactivate a staff account (disable login, keep records)
export async function POST(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await request.json();
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // Prevent admin from removing themselves
  if (userId === sessionUser.id) {
    return NextResponse.json({ error: "You cannot remove your own account" }, { status: 400 });
  }

  const adminClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  // Ban the user (disables login but keeps all records)
  const { error } = await (adminClient.auth.admin as any).updateUserById(userId, {
    ban_duration: "876600h", // 100 years = effectively permanent
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
