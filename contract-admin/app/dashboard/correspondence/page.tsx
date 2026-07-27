import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatDate, timeAgo } from "@/lib/utils";

const RISK_BADGE: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border border-red-200",
  high: "bg-orange-100 text-orange-800 border border-orange-200",
  medium: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  low: "bg-green-100 text-green-800 border border-green-200",
};

const CHANNEL_ICON: Record<string, string> = {
  email: "✉",
  whatsapp: "💬",
  manual: "📝",
};

const TYPE_LABELS: Record<string, string> = {
  eot_claim: "EOT Claim",
  variation_claim: "Variation Claim",
  variation_instruction: "Variation Instruction",
  payment_application: "Payment Application",
  payment_certificate: "Payment Certificate",
  defect_notice: "Defect Notice",
  notice_of_dissatisfaction: "Notice of Dissatisfaction",
  notice_of_claim: "Notice of Claim",
  site_instruction: "Site Instruction",
  rfi: "RFI",
  dispute_notice: "Dispute Notice",
  general_correspondence: "General",
  other: "Other",
};

export default async function CorrespondencePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("correspondence")
    .select("*, contracts(id, title, contract_number)")
    .order("received_at", { ascending: false })
    .limit(50);

  if (params.contract_id) query = query.eq("contract_id", params.contract_id);
  if (params.risk_level) query = query.eq("risk_level", params.risk_level);
  if (params.channel) query = query.eq("channel", params.channel);
  if (params.analysis_status) query = query.eq("analysis_status", params.analysis_status);

  const { data: correspondence } = await query;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[var(--color-foreground)]">Correspondence</h1>
        <Link
          href="/dashboard/correspondence/new"
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          + Add Manual
        </Link>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {["critical", "high", "medium", "low"].map((r) => (
          <Link
            key={r}
            href={`/dashboard/correspondence?risk_level=${r}`}
            className={`text-xs px-3 py-1 rounded-full border cursor-pointer ${params.risk_level === r ? RISK_BADGE[r] : "border-[var(--color-border)] text-[var(--color-muted-foreground)]"}`}
          >
            {r}
          </Link>
        ))}
        <Link
          href="/dashboard/correspondence?analysis_status=pending"
          className={`text-xs px-3 py-1 rounded-full border ${params.analysis_status === "pending" ? "bg-yellow-100 text-yellow-800 border-yellow-200" : "border-[var(--color-border)] text-[var(--color-muted-foreground)]"}`}
        >
          Pending analysis
        </Link>
        <Link href="/dashboard/correspondence" className="text-xs px-3 py-1 rounded-full border border-[var(--color-border)] text-[var(--color-muted-foreground)]">
          Clear filters
        </Link>
      </div>

      <div className="space-y-2">
        {(correspondence ?? []).length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[var(--color-muted-foreground)]">No correspondence found.</p>
          </div>
        ) : (
          (correspondence ?? []).map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/correspondence/${c.id}`}
              className="block rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{CHANNEL_ICON[c.channel] ?? "📄"}</span>
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      {c.direction === "outbound" ? "Sent" : "Received"}
                    </span>
                    {c.correspondence_type && (
                      <span className="text-xs bg-[var(--color-card)] border border-[var(--color-border)] px-1.5 py-0.5 rounded">
                        {TYPE_LABELS[c.correspondence_type] ?? c.correspondence_type}
                      </span>
                    )}
                    {c.department && (
                      <span className="text-xs text-[var(--color-muted)]">{c.department}</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-[var(--color-foreground)] mt-1 truncate">
                    {c.subject ?? "(no subject)"}
                  </p>
                  <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                    {c.sender_name ?? c.sender_contact} · {timeAgo(c.received_at)}
                  </p>
                  {c.contracts && (
                    <p className="text-xs text-[var(--color-muted)] truncate">{c.contracts.title}</p>
                  )}
                </div>
                <div className="flex-shrink-0 text-right space-y-1">
                  {c.risk_level && (
                    <span className={`block text-xs px-2 py-0.5 rounded-full font-medium ${RISK_BADGE[c.risk_level] ?? ""}`}>
                      {c.risk_level}
                    </span>
                  )}
                  {c.analysis_status === "pending" && (
                    <span className="block text-xs text-yellow-600">Pending analysis</span>
                  )}
                  {c.analysis_status === "processing" && (
                    <span className="block text-xs text-blue-600">Analyzing…</span>
                  )}
                  {c.requires_response && c.response_deadline && (
                    <p className="text-xs text-orange-600">
                      Due {formatDate(c.response_deadline)}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
