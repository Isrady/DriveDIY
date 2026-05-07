import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CommanderLayout from "@/components/dashboard/commander/CommanderLayout";

export default async function CommanderPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Fetch initial data
  const [
    { data: profile },
    { data: permissions },
    { data: checklist },
    { data: recommendations },
    { data: recentLogs },
  ] = await Promise.all([
    supabase.from("users").select("*").eq("id", user.id).single(),
    supabase
      .from("pending_permissions")
      .select("*")
      .eq("status", "pending")
      .order("requested_at", { ascending: false })
      .limit(20),
    supabase
      .from("launch_checklist")
      .select("*")
      .order("priority", { ascending: true }),
    supabase
      .from("recommendations")
      .select("*")
      .eq("is_dismissed", false)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("agent_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <CommanderLayout
      user={profile ?? { id: user.id, email: user.email ?? "", role: "customer" }}
      initialPermissions={permissions ?? []}
      initialChecklist={checklist ?? []}
      initialRecommendations={recommendations ?? []}
      recentLogs={recentLogs ?? []}
    />
  );
}
