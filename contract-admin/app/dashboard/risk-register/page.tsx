import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

const SEVERITY_CLASSES: Record<string, string> = {
  critical: "border-l-4 border-l-red-500 bg-red-50",
  high: "border-l-4 border-l-orange-500 bg-orange-50",
  warning: "border-l-4 border-l-yellow-500 bg-yellow-50",
  info: "border-l-4 border-l-blue-500 bg-blue-50",
};

const SEVERITY_BADGE: Record<string, string> = {
  critical: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  warning: "bg-yellow-100 text-yellow-800",
  info: "bg-blue-100 text-blue-800",
};

export default async function RiskRegisterPage() {
  const supabase = await createClient();

  const { data: flags } = await supabase
    .from("legal_flags")
    .select(`
      *,
      contract:contracts(id, title, contract_number),
      correspondence:correspondence(id, subject, received_at)
    `)
    .eq("is_resolved", false)
    .order("created_at", { ascending: false });

  const grouped = {
    critical: (flags ?? []).filter((f) => f.severity === "critical"),
    high: (flags ?? []).filter((f) => f.severity === "high"),
    warning: (flags ?? []).filter((f) => f.severity === "warning"),
    info: (flags ?? []).filter((f) => f.severity === "info"),
  };

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[var(--color-foreground)]">Legal Risk Register</h1>
        <div className="flex gap-2">
          {Object.entries(grouped).map(([sev, items]) => (
            items.length > 0 && (
              <span key={sev} className={`text-xs px-2 py-0.5 rounded font-medium ${SEVERITY_BADGE[sev] ?? ""}`}>
                {items.length} {sev}
              </span>
            )
          ))}
        </div>
      </div>

      {(flags ?? []).length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[var(--color-muted-foreground)]">No unresolved legal risks. All clear.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {(["critical", "high", "warning", "info"] as const).map((sev) => (
            grouped[sev].length > 0 && (
              <div key={sev}>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-3">
                  {sev === "warning" ? "Medium" : sev.charAt(0).toUpperCase() + sev.slice(1)} Risk
                </h2>
                <div className="space-y-3">
                  {grouped[sev].map((f) => (
                    <div key={f.id} className={`rounded-lg border border-[var(--color-border)] p-4 ${SEVERITY_CLASSES[f.severity] ?? ""}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[var(--color-foreground)]">{f.title}</p>
                          {f.contract && (
                            <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                              {f.contract.title} {f.contract.contract_number ? `· ${f.contract.contract_number}` : ""}
                            </p>
                          )}
                          {f.description && (
                            <p className="text-sm text-[var(--color-foreground)] mt-2">{f.description}</p>
                          )}
                          {f.current_risk_narrative && (
                            <p className="text-sm text-[var(--color-muted-foreground)] mt-1">{f.current_risk_narrative}</p>
                          )}
                          {f.future_risk_narrative && (
                            <p className="text-sm text-orange-700 mt-2 italic border-l-2 border-orange-300 pl-3">
                              {f.future_risk_narrative}
                            </p>
                          )}

                          {/* Citations */}
                          <div className="flex flex-wrap gap-1 mt-3">
                            {(f.fidic_clause_refs ?? []).map((ref: string) => (
                              <span key={ref} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">
                                {ref}
                              </span>
                            ))}
                            {(f.uae_law_references ?? []).map((ref: string) => (
                              <span key={ref} className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded">
                                {ref}
                              </span>
                            ))}
                          </div>

                          {f.recommended_action && (
                            <div className="mt-3 rounded bg-white border border-[var(--color-border)] px-3 py-2">
                              <p className="text-xs font-semibold text-[var(--color-foreground)]">Recommended Action</p>
                              <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{f.recommended_action}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex-shrink-0 text-right">
                          {f.action_deadline && (
                            <div className="mb-2">
                              <p className="text-xs text-[var(--color-muted-foreground)]">Deadline</p>
                              <p className="text-sm font-semibold text-red-700">{formatDate(f.action_deadline)}</p>
                            </div>
                          )}
                          {f.correspondence && (
                            <a href={`/dashboard/correspondence/${f.correspondence.id}`} className="text-xs text-[var(--color-primary)] hover:underline block">
                              View correspondence →
                            </a>
                          )}
                          <form
                            onSubmit={async (e) => {
                              e.preventDefault();
                              const note = prompt("Resolution note:");
                              await fetch(`/api/legal-flags/${f.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ is_resolved: true, resolution_note: note }),
                              });
                              window.location.reload();
                            }}
                          >
                            <button
                              type="submit"
                              className="mt-2 text-xs text-green-600 hover:underline"
                            >
                              Mark resolved
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}
