/**
 * Role constants — safe to import in both Server and Client components.
 * No server-only imports here.
 */

import type { UserRole } from "@/lib/supabase/types";

/** Routes that only admins can access */
export const ADMIN_ONLY_ROUTES = [
  "/manager/payouts",
  "/manager/reports",
  "/manager/staff",
] as const;

/** Check whether a role can access a given pathname */
export function canAccess(role: UserRole, pathname: string): boolean {
  if (role === "admin") return true;
  return !ADMIN_ONLY_ROUTES.some((r) => pathname.startsWith(r));
}
