import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSessionUser } from "@/lib/auth";
import { canAccess } from "@/lib/roles";
import ManagerSidebar from "@/components/manager/ManagerSidebar";
import ManagerHeader from "@/components/manager/ManagerHeader";

export const metadata = {
  title: "KOKO Manager Dashboard",
};

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/manager-login");
  }

  // Get the current pathname from headers to enforce route-level permissions
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  if (!canAccess(sessionUser.role, pathname)) {
    // Render a 403 page inline — no redirect, just deny
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <ManagerSidebar role={sessionUser.role} />
        <div className="flex-1 flex flex-col min-w-0">
          <ManagerHeader user={sessionUser} />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
                <span className="text-4xl">🔒</span>
              </div>
              <h1 className="text-2xl font-bold text-[#2B1B14] mb-2">Access Restricted</h1>
              <p className="text-gray-500 mb-2">
                This section is only accessible to{" "}
                <strong className="text-[#E86A2A]">Admin</strong> users.
              </p>
              <p className="text-sm text-gray-400 mb-6">
                Your current role is <strong>{sessionUser.role}</strong>. Contact your admin to request access.
              </p>
              <a
                href="/manager"
                className="inline-flex items-center gap-2 bg-[#E86A2A] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#C94F16] transition-colors"
              >
                Back to Dashboard
              </a>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <ManagerSidebar role={sessionUser.role} />
      <div className="flex-1 flex flex-col min-w-0">
        <ManagerHeader user={sessionUser} />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
