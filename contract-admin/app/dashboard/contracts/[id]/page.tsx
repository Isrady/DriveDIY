import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate, formatCurrency, daysUntil } from "@/lib/utils";

const MILESTONE_STATUS_CLASSES: Record<string, string> = {
  upcoming: "bg-blue-50 text-blue-700 border-blue-200",
  at_risk: "bg-orange-50 text-orange-700 border-orange-200",
  overdue: "bg-red-50 text-red-700 border-red-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  dismissed: "bg-gray-50 text-gray-400 border-gray-200",
};

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: contract }, { data: clauses }, { data: recentCorr }] =
    await Promise.all([
      supabase
        .from("contracts")
        .select(`*, parties:contract_parties(*), departments:contract_departments(*), milestones:contract_milestones(*)`)
        .eq("id", id)
        .single(),
      supabase
        .from("contract_clauses")
        .select("*")
        .eq("contract_id", id)
        .in("clause_type", ["time_bar", "notice_period", "payment_certificate", "payment_terms", "eot_procedure", "dispute_resolution"])
        .order("clause_type"),
      supabase
        .from("correspondence")
        .select("id, subject, sender_name, received_at, risk_level, correspondence_type, direction, analysis_status")
        .eq("contract_id", id)
        .order("received_at", { ascending: false })
        .limit(5),
    ]);

  if (!contract) notFound();

  const employer = contract.parties?.find((p: { role: string }) => p.role === "employer");
  const contractor = contract.parties?.find((p: { role: string }) => p.role === "contractor");
  const engineer = contract.parties?.find((p: { role: string }) => p.role === "engineer" || p.role === "project_manager");

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <Link href="/dashboard/contracts" className="text-xs text-[var(--color-muted-foreground)] hover:underline">
              ← Contracts
            </Link>
            <h1 className="text-xl font-bold text-[var(--color-foreground)] mt-1">{contract.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              {contract.contract_number && (
                <span className="text-sm text-[var(--color-muted-foreground)]">{contract.contract_number}</span>
              )}
              <span className="text-xs bg-[var(--color-card)] border border-[var(--color-border)] px-2 py-0.5 rounded">
                {contract.contract_type}
              </span>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                {contract.status}
              </span>
            </div>
          </div>
          <div className="text-right">
            {contract.contract_value && (
              <p className="text-xl font-bold text-[var(--color-foreground)]">
                {formatCurrency(contract.contract_value, contract.currency)}
              </p>
            )}
            {contract.parse_status !== "completed" && (
              <p className="text-xs text-yellow-600 mt-1">Parse: {contract.parse_status}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Key dates & parties */}
        <div className="space-y-4">
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <h2 className="text-sm font-semibold mb-3">Key Dates</h2>
            <dl className="space-y-2 text-sm">
              {[
                ["Commencement", contract.commencement_date],
                ["Original Completion", contract.original_completion_date],
                ["Current Completion", contract.current_completion_date],
                ["DLP End", contract.defects_liability_end],
              ].map(([label, date]) => (
                date && (
                  <div key={String(label)} className="flex justify-between">
                    <dt className="text-[var(--color-muted-foreground)]">{label}</dt>
                    <dd className="font-medium">{formatDate(String(date))}</dd>
                  </div>
                )
              ))}
              <div className="flex justify-between">
                <dt className="text-[var(--color-muted-foreground)]">DLP Duration</dt>
                <dd className="font-medium">{contract.defects_liability_months} months</dd>
              </div>
              {contract.retention_percentage && (
                <div className="flex justify-between">
                  <dt className="text-[var(--color-muted-foreground)]">Retention</dt>
                  <dd className="font-medium">{contract.retention_percentage}%</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <h2 className="text-sm font-semibold mb-3">Parties</h2>
            <div className="space-y-2 text-sm">
              {[[employer, "Employer"], [contractor, "Contractor"], [engineer, "Engineer"]].map(([party, label]) =>
                party ? (
                  <div key={String(label)}>
                    <p className="text-[var(--color-muted-foreground)] text-xs">{label}</p>
                    <p className="font-medium">{(party as { name: string }).name}</p>
                    {(party as { contact_person?: string }).contact_person && (
                      <p className="text-xs text-[var(--color-muted)]">{(party as { contact_person?: string }).contact_person}</p>
                    )}
                  </div>
                ) : null
              )}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <h2 className="text-sm font-semibold mb-3">Dispute Resolution</h2>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--color-muted-foreground)]">Governing Law</dt>
                <dd>{contract.governing_law ?? "UAE"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-muted-foreground)]">Arbitration</dt>
                <dd>{contract.arbitration_body ?? "Per contract"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-muted-foreground)]">Seat</dt>
                <dd>{contract.arbitration_seat ?? "Dubai"}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Time-critical clauses */}
        <div>
          <h2 className="text-sm font-semibold mb-3">Time-Critical Clauses</h2>
          <div className="space-y-2">
            {(clauses ?? []).length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">No clauses extracted yet.</p>
            ) : (
              (clauses ?? []).map((c) => (
                <div key={c.id} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-[var(--color-foreground)]">
                      {c.clause_number ? `${c.clause_number} — ` : ""}{c.clause_title ?? c.clause_type}
                    </p>
                    {c.time_bar_days && (
                      <span className="flex-shrink-0 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">
                        {c.time_bar_days}d bar
                      </span>
                    )}
                  </div>
                  {c.summary && <p className="text-xs text-[var(--color-muted-foreground)] mt-1">{c.summary}</p>}
                  <div className="flex gap-3 mt-2 text-xs text-[var(--color-muted)]">
                    {c.notice_days && <span>Notice: {c.notice_days}d</span>}
                    {c.response_days && <span>Response: {c.response_days}d</span>}
                    {c.payment_days && <span>Payment: {c.payment_days}d</span>}
                    {c.fidic_reference && <span>{c.fidic_reference}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Milestones + recent correspondence */}
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold mb-3">Milestones</h2>
            <div className="space-y-2">
              {(contract.milestones ?? []).slice(0, 6).map((m: {
                id: string;
                title: string;
                due_date: string;
                status: string;
              }) => (
                <div
                  key={m.id}
                  className={`rounded-lg border px-3 py-2 text-sm ${MILESTONE_STATUS_CLASSES[m.status] ?? ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{m.title}</span>
                    <span className="flex-shrink-0 ml-2 text-xs">{formatDate(m.due_date)}</span>
                  </div>
                  {m.status !== "completed" && (
                    <p className="text-xs mt-0.5">{daysUntil(m.due_date)} days</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Recent Correspondence</h2>
              <Link href={`/dashboard/correspondence?contract_id=${id}`} className="text-xs text-[var(--color-primary)] hover:underline">
                View all
              </Link>
            </div>
            <div className="space-y-2">
              {(recentCorr ?? []).length === 0 ? (
                <p className="text-sm text-[var(--color-muted-foreground)]">No correspondence yet.</p>
              ) : (
                (recentCorr ?? []).map((c) => (
                  <Link
                    key={c.id}
                    href={`/dashboard/correspondence/${c.id}`}
                    className="block rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 hover:shadow-sm transition-shadow"
                  >
                    <p className="text-sm font-medium text-[var(--color-foreground)] truncate">
                      {c.direction === "outbound" ? "→ " : "← "}{c.subject ?? "(no subject)"}
                    </p>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-[var(--color-muted-foreground)]">{c.sender_name} · {formatDate(c.received_at)}</p>
                      {c.risk_level && (
                        <span className={`text-xs px-1.5 rounded ${c.risk_level === "critical" ? "bg-red-100 text-red-700" : c.risk_level === "high" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"}`}>
                          {c.risk_level}
                        </span>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
