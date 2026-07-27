import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatDate, daysUntil } from "@/lib/utils";

async function getDashboardData() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/reports/dashboard`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

const RISK_COLORS = {
  critical: "bg-red-100 text-red-800 border border-red-200",
  high: "bg-orange-100 text-orange-800 border border-orange-200",
  medium: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  low: "bg-green-100 text-green-800 border border-green-200",
};

const MILESTONE_STATUS = {
  upcoming: "text-blue-600",
  at_risk: "text-orange-600 font-semibold",
  overdue: "text-red-600 font-bold",
  completed: "text-green-600",
  dismissed: "text-gray-400",
};

export default async function DashboardHome() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let data: Awaited<ReturnType<typeof getDashboardData>> = null;
  try {
    // Fetch via Supabase directly (avoiding auth complexity with self-fetch)
    const [
      { count: activeContracts },
      { count: pendingActions },
      { count: overdueActions },
      { count: criticalFlags },
      { count: pendingAnalysis },
      { data: recentCorr },
      { data: milestones },
    ] = await Promise.all([
      supabase.from("contracts").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("actions").select("id", { count: "exact", head: true }).in("status", ["pending", "in_progress"]),
      supabase.from("actions").select("id", { count: "exact", head: true }).eq("status", "overdue"),
      supabase.from("legal_flags").select("id", { count: "exact", head: true }).in("severity", ["critical", "high"]).eq("is_resolved", false),
      supabase.from("correspondence").select("id", { count: "exact", head: true }).eq("analysis_status", "pending"),
      supabase
        .from("correspondence")
        .select("id, subject, sender_name, channel, received_at, risk_level, correspondence_type, response_deadline, contracts(title)")
        .not("risk_level", "is", null)
        .in("risk_level", ["critical", "high"])
        .order("received_at", { ascending: false })
        .limit(8),
      supabase
        .from("contract_milestones")
        .select("id, title, due_date, status, milestone_type, contracts(title)")
        .not("status", "eq", "completed")
        .not("status", "eq", "dismissed")
        .gte("due_date", new Date().toISOString().split("T")[0])
        .order("due_date")
        .limit(8),
    ]);
    data = { kpis: { activeContracts, pendingActions, overdueActions, criticalFlags, pendingAnalysis }, recentCorr, milestones };
  } catch {
    data = null;
  }

  const kpis = [
    { label: "Active Contracts", value: data?.kpis?.activeContracts ?? 0, href: "/dashboard/contracts", urgent: false },
    { label: "Open Actions", value: data?.kpis?.pendingActions ?? 0, href: "/dashboard/actions", urgent: false },
    { label: "Overdue Actions", value: data?.kpis?.overdueActions ?? 0, href: "/dashboard/actions?status=overdue", urgent: (data?.kpis?.overdueActions ?? 0) > 0 },
    { label: "Unresolved Risks", value: data?.kpis?.criticalFlags ?? 0, href: "/dashboard/risk-register", urgent: (data?.kpis?.criticalFlags ?? 0) > 0 },
    { label: "Pending Analysis", value: data?.kpis?.pendingAnalysis ?? 0, href: "/dashboard/correspondence?analysis_status=pending", urgent: false },
  ];

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[var(--color-foreground)]">Dashboard</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">Contract Administration — UAE Real Estate Developer (Client Side)</p>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className={`rounded-lg border p-4 hover:shadow-sm transition-shadow ${
              kpi.urgent && kpi.value > 0
                ? "border-red-300 bg-red-50"
                : "border-[var(--color-border)] bg-[var(--color-card)]"
            }`}
          >
            <p className={`text-2xl font-bold ${kpi.urgent && kpi.value > 0 ? "text-red-700" : "text-[var(--color-foreground)]"}`}>
              {kpi.value}
            </p>
            <p className="text-xs text-[var(--color-muted-foreground)] mt-1">{kpi.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* High-risk correspondence */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--color-foreground)]">High-Risk Correspondence</h2>
            <Link href="/dashboard/correspondence" className="text-xs text-[var(--color-primary)] hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {(data?.recentCorr ?? []).length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)] py-8 text-center">No high-risk correspondence</p>
            ) : (
              (data?.recentCorr ?? []).map((c: {
                id: string;
                risk_level: string;
                subject: string | null;
                sender_name: string | null;
                channel: string;
                received_at: string;
                correspondence_type: string | null;
                response_deadline: string | null;
                contracts: { title: string } | null;
              }) => (
                <Link
                  key={c.id}
                  href={`/dashboard/correspondence/${c.id}`}
                  className="block rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--color-foreground)] truncate">
                        {c.subject ?? "(no subject)"}
                      </p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        {c.sender_name ?? c.channel} · {formatDate(c.received_at)}
                      </p>
                      {c.contracts && (
                        <p className="text-xs text-[var(--color-muted)] truncate">{c.contracts.title}</p>
                      )}
                    </div>
                    <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${RISK_COLORS[c.risk_level as keyof typeof RISK_COLORS] ?? ""}`}>
                      {c.risk_level}
                    </span>
                  </div>
                  {c.response_deadline && (
                    <p className="mt-1 text-xs text-orange-600">
                      Response due: {formatDate(c.response_deadline)} ({daysUntil(c.response_deadline)} days)
                    </p>
                  )}
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Upcoming milestones */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--color-foreground)]">Upcoming Milestones (30 days)</h2>
          </div>
          <div className="space-y-2">
            {(data?.milestones ?? []).length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)] py-8 text-center">No upcoming milestones</p>
            ) : (
              (data?.milestones ?? []).map((m: {
                id: string;
                title: string;
                due_date: string;
                status: string;
                contracts: { title: string } | null;
              }) => (
                <div key={m.id} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--color-foreground)] truncate">{m.title}</p>
                      {m.contracts && (
                        <p className="text-xs text-[var(--color-muted)] truncate">{m.contracts.title}</p>
                      )}
                    </div>
                    <span className={`text-xs flex-shrink-0 ${MILESTONE_STATUS[m.status as keyof typeof MILESTONE_STATUS] ?? ""}`}>
                      {formatDate(m.due_date)}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                    {daysUntil(m.due_date)} days remaining
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
