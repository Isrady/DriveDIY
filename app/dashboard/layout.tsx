import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SideNav from "@/components/dashboard/SideNav";
import TopBar from "@/components/dashboard/TopBar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: profile }, { count: pendingCount }] = await Promise.all([
    supabase
      .from("users")
      .select("full_name, email, role, subscription_tier")
      .eq("id", user.id)
      .single(),
    supabase
      .from("pending_permissions")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  return (
    <div className="flex h-screen bg-midnight overflow-hidden font-body">
      <SideNav role={profile?.role ?? "customer"} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden min-h-0">
        <TopBar
          user={{
            full_name: profile?.full_name ?? null,
            email: profile?.email ?? user.email ?? "",
            role: profile?.role ?? "customer",
            subscription_tier: profile?.subscription_tier ?? "drop_in",
          }}
          pendingCount={pendingCount ?? 0}
        />
        <main className="flex-1 overflow-y-auto bg-midnight min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}
