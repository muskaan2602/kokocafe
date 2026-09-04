/**
 * Server-only auth helpers.
 * Do NOT import this file from Client Components.
 */

import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/types";

// Re-export for convenience so server components only need one import
export { ADMIN_ONLY_ROUTES, canAccess } from "@/lib/roles";

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
}

/**
 * Get the current authenticated user with their role from the profiles table.
 * Returns null if not authenticated.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const db = supabase as any;
  const { data: profile } = await db
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? "",
    role: (profile?.role ?? "manager") as UserRole,
  };
}
