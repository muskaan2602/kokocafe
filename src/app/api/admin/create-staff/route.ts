import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth";

// Admin-only API: create a new staff/manager auth account
export async function POST(request: NextRequest) {
  // 1. Verify caller is admin
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email, password, role } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }
  if (!["manager", "admin"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // 2. Use service role client to create user (bypasses email confirmation)
  const adminClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  );

  const { data: newUser, error: createError } = await (adminClient.auth.admin as any).createUser({
    email,
    password,
    email_confirm: true, // auto-confirm, no email verification needed
  });

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 400 });
  }

  // 3. Set the role in profiles table (trigger already creates the row as 'manager')
  if (role === "admin") {
    const db = adminClient as any;
    await db
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", newUser.user.id);
  }

  return NextResponse.json({
    success: true,
    user: { id: newUser.user.id, email: newUser.user.email, role },
  });
}
