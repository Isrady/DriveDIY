import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [
    { count: activeContracts },
    { count: pendingActions },
    { count: overdueActions },
    { count: criticalFlags },
    { count: highFlags },
    { count: pendingAnalysis },
    { data: recentCorrespondence },
    { data: upcomingMilestones },
  ] = await Promise.all([
    supabase.from("contracts").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("actions").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("actions").select("id", { count: "exact", head: true }).eq("status", "overdue"),
    supabase.from("legal_flags").select("id", { count: "exact", head: true }).eq("severity", "critical").eq("is_resolved", false),
    supabase.from("legal_flags").select("id", { count: "exact", head: true }).eq("severity", "high").eq("is_resolved", false),
    supabase.from("correspondence").select("id", { count: "exact", head: true }).eq("analysis_status", "pending"),
    supabase
      .from("correspondence")
      .select("id, subject, sender_name, sender_contact, channel, received_at, risk_level, correspondence_type, department, requires_response, response_deadline, contract:contracts(title)")
      .not("risk_level", "is", null)
      .in("risk_level", ["critical", "high"])
      .order("received_at", { ascending: false })
      .limit(10),
    supabase
      .from("contract_milestones")
      .select("*, contract:contracts(title)")
      .eq("status", "upcoming")
      .gte("due_date", new Date().toISOString().split("T")[0])
      .lte("due_date", new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
      .order("due_date")
      .limit(10),
  ]);

  return NextResponse.json({
    kpis: {
      active_contracts: activeContracts ?? 0,
      pending_actions: pendingActions ?? 0,
      overdue_actions: overdueActions ?? 0,
      critical_flags: criticalFlags ?? 0,
      high_flags: highFlags ?? 0,
      pending_analysis: pendingAnalysis ?? 0,
    },
    recent_high_risk_correspondence: recentCorrespondence ?? [],
    upcoming_milestones: upcomingMilestones ?? [],
  });
}
