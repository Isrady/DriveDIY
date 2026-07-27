"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatDateTime, daysUntil } from "@/lib/utils";

const RISK_BADGE: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-green-100 text-green-800 border-green-200",
};

const SEVERITY_BORDER: Record<string, string> = {
  critical: "border-l-4 border-l-red-500",
  high: "border-l-4 border-l-orange-500",
  warning: "border-l-4 border-l-yellow-500",
  info: "border-l-4 border-l-blue-500",
};

// Helpers to safely cast from Record<string, unknown>
function str(v: unknown): string { return v != null ? String(v) : ""; }
function arr(v: unknown): string[] { return Array.isArray(v) ? v.map(String) : []; }
function bool(v: unknown): boolean { return Boolean(v); }

export default function CorrespondenceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  type Row = Record<string, unknown>;
  const [corr, setCorr] = useState<Row | null>(null);
  const [actions, setActions] = useState<Row[]>([]);
  const [flags, setFlags] = useState<Row[]>([]);
  const [drafts, setDrafts] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<Row | null>(null);

  async function loadData() {
    const [corrRes, actionsRes, flagsRes, draftsRes] = await Promise.all([
      fetch(`/api/correspondence/${id}`),
      fetch(`/api/actions?contract_id=dummy`).catch(() => null),
      fetch(`/api/legal-flags`).catch(() => null),
      fetch(`/api/correspondence/${id}/draft-responses`),
    ]);

    if (corrRes.ok) {
      const data = await corrRes.json();
      setCorr(data.correspondence);
    }
    if (actionsRes?.ok) {
      const data = await actionsRes.json();
      // Filter to this correspondence
      setActions((data.actions ?? []).filter((a: Row) => a.correspondence_id === id));
    }
    if (flagsRes?.ok) {
      const data = await flagsRes.json();
      setFlags((data.flags ?? []).filter((f: Row) => f.correspondence_id === id));
    }
    if (draftsRes.ok) {
      const data = await draftsRes.json();
      const ds: Row[] = data.drafts ?? [];
      setDrafts(ds);
      if (ds.length) setSelectedDraft(ds[0]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 8000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function triggerAnalysis() {
    await fetch(`/api/correspondence/${id}/analyze`, { method: "POST" });
    await loadData();
  }

  async function generateDraft(tone: string) {
    setGenerating(true);
    try {
      const res = await fetch(`/api/correspondence/${id}/draft-responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tone }),
      });
      if (res.ok) await loadData();
    } finally {
      setGenerating(false);
    }
  }

  async function approveDraft(draftId: string) {
    await fetch(`/api/draft-responses/${draftId}/approve`, { method: "POST" });
    await loadData();
  }

  if (loading) {
    return <div className="p-6 text-[var(--color-muted-foreground)]">Loading…</div>;
  }
  if (!corr) return <div className="p-6">Not found</div>;

  const analysisStatus = str(corr.analysis_status);
  const riskLevel = str(corr.risk_level);

  return (
    <div className="p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-4">
        <button onClick={() => router.back()} className="text-xs text-[var(--color-muted-foreground)] hover:underline mb-2 block">
          ← Back
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[var(--color-foreground)]">
              {str(corr.direction) === "outbound" ? "→ " : "← "}
              {str(corr.subject) || "(no subject)"}
            </h1>
            <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">
              {str(corr.channel) === "email" ? "✉" : "💬"}{" "}
              {str(corr.sender_name) || str(corr.sender_contact)} ·{" "}
              {corr.received_at ? formatDateTime(str(corr.received_at)) : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {riskLevel && (
              <span className={`text-sm px-3 py-1 rounded-full font-semibold border ${RISK_BADGE[riskLevel] ?? ""}`}>
                {riskLevel.toUpperCase()}
              </span>
            )}
            {(analysisStatus === "pending" || analysisStatus === "failed") && (
              <button
                onClick={triggerAnalysis}
                className="text-sm rounded-lg bg-[var(--color-primary)] text-white px-3 py-1 hover:opacity-90"
              >
                {analysisStatus === "failed" ? "Retry Analysis" : "Analyze"}
              </button>
            )}
            {analysisStatus === "processing" && (
              <span className="text-sm text-blue-600 animate-pulse">Analyzing…</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Original message */}
        <div>
          <h2 className="text-sm font-semibold mb-3">Original Message</h2>
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <div className="text-xs text-[var(--color-muted-foreground)] mb-3 space-y-1">
              <div><span className="font-medium">From:</span> {str(corr.sender_name)} &lt;{str(corr.sender_contact)}&gt;</div>
              {arr(corr.recipient_contacts).length > 0 && (
                <div><span className="font-medium">To:</span> {arr(corr.recipient_contacts).join(", ")}</div>
              )}
              {arr(corr.cc_contacts).length > 0 && (
                <div><span className="font-medium">CC:</span> {arr(corr.cc_contacts).join(", ")}</div>
              )}
            </div>
            <div className="text-sm text-[var(--color-foreground)] whitespace-pre-wrap leading-relaxed">
              {str(corr.body_text) || <span className="text-[var(--color-muted)]">No body text</span>}
            </div>
          </div>
        </div>

        {/* Analysis panel */}
        <div>
          <h2 className="text-sm font-semibold mb-3">Analysis</h2>

          {!!corr.ai_summary && (
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 mb-3">
              <p className="text-xs font-medium text-[var(--color-muted-foreground)] mb-1">AI Summary</p>
              <p className="text-sm text-[var(--color-foreground)]">{str(corr.ai_summary)}</p>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                {!!corr.correspondence_type && (
                  <div>
                    <span className="text-[var(--color-muted-foreground)]">Type: </span>
                    <span className="font-medium">{str(corr.correspondence_type).replace(/_/g, " ")}</span>
                  </div>
                )}
                {!!corr.department && (
                  <div>
                    <span className="text-[var(--color-muted-foreground)]">Department: </span>
                    <span className="font-medium">{str(corr.department)}</span>
                  </div>
                )}
              </div>

              {bool(corr.requires_response) && !!corr.response_deadline && (
                <div className="mt-3 rounded bg-orange-50 border border-orange-200 p-2">
                  <p className="text-xs font-semibold text-orange-800">Response Required</p>
                  <p className="text-xs text-orange-700">
                    Deadline: {formatDateTime(str(corr.response_deadline))} ({daysUntil(str(corr.response_deadline))} days)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {actions.length > 0 && (
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 mb-3">
              <p className="text-xs font-medium text-[var(--color-muted-foreground)] mb-2">Action List</p>
              <div className="space-y-2">
                {actions.map((a) => (
                  <div key={str(a.id)} className="flex items-start gap-2">
                    <span className={`text-xs flex-shrink-0 px-1.5 py-0.5 rounded font-medium ${
                      a.priority === "critical" ? "bg-red-100 text-red-700" :
                      a.priority === "high" ? "bg-orange-100 text-orange-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {str(a.priority)}
                    </span>
                    <div>
                      <p className="text-xs font-medium text-[var(--color-foreground)]">{str(a.title)}</p>
                      {!!a.due_date && (
                        <p className="text-xs text-[var(--color-muted-foreground)]">
                          Due: {formatDateTime(str(a.due_date))}{bool(a.is_hard_deadline) ? " ⚠ Hard deadline" : ""}
                        </p>
                      )}
                      {!!a.linked_clause && (
                        <p className="text-xs text-blue-600">{str(a.linked_clause)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legal flags */}
          {flags.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[var(--color-muted-foreground)] mb-2">Legal Risk Flags</p>
              <div className="space-y-2">
                {flags.map((f) => (
                  <div key={str(f.id)} className={`rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3 ${SEVERITY_BORDER[str(f.severity)] ?? ""}`}>
                    <p className="text-xs font-bold text-[var(--color-foreground)]">{str(f.title)}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)] mt-1">{str(f.current_risk_narrative)}</p>
                    {!!f.future_risk_narrative && (
                      <p className="text-xs text-orange-700 mt-1 italic">{str(f.future_risk_narrative)}</p>
                    )}
                    {arr(f.fidic_clause_refs).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {arr(f.fidic_clause_refs).map((ref) => (
                          <span key={ref} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{ref}</span>
                        ))}
                        {arr(f.uae_law_references).map((ref) => (
                          <span key={ref} className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">{ref}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Draft response editor */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Draft Response</h2>
            {!corr.contract_id && true && (
              <span className="text-xs text-orange-600">No contract linked</span>
            )}
          </div>

          {!!corr.contract_id && (
            <div className="flex gap-2 mb-3">
              {["formal", "firm", "conciliatory"].map((tone) => (
                <button
                  key={tone}
                  onClick={() => generateDraft(tone)}
                  disabled={generating}
                  className="text-xs rounded border border-[var(--color-border)] px-2 py-1 hover:bg-[var(--color-card)] disabled:opacity-50 capitalize"
                >
                  {generating ? "Generating…" : `${tone}`}
                </button>
              ))}
            </div>
          )}

          {selectedDraft ? (
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  str(selectedDraft.status) === "approved" ? "bg-green-100 text-green-700" :
                  str(selectedDraft.status) === "sent" ? "bg-blue-100 text-blue-700" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {str(selectedDraft.status)}
                </span>
                <span className="text-xs text-[var(--color-muted)]">{str(selectedDraft.tone)} tone</span>
              </div>

              <textarea
                className="w-full h-64 text-xs font-mono bg-transparent border-none outline-none resize-none text-[var(--color-foreground)] leading-relaxed"
                defaultValue={str(selectedDraft.draft_content)}
                readOnly={str(selectedDraft.status) === "sent"}
              />

              {arr(selectedDraft.cited_clauses).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {arr(selectedDraft.cited_clauses).map((c) => (
                    <span key={c} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{c}</span>
                  ))}
                  {arr(selectedDraft.cited_uae_laws).map((c) => (
                    <span key={c} className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">{c}</span>
                  ))}
                </div>
              )}

              {str(selectedDraft.status) === "draft" && (
                <button
                  onClick={() => approveDraft(str(selectedDraft.id))}
                  className="mt-3 w-full rounded-lg bg-green-600 text-white text-sm py-2 hover:opacity-90"
                >
                  Approve Draft
                </button>
              )}

              {str(selectedDraft.status) === "approved" && (
                <button
                  onClick={async () => {
                    const to = prompt("Send to email address:");
                    if (!to) return;
                    await fetch(`/api/draft-responses/${str(selectedDraft.id)}/send`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ via: "email", to }),
                    });
                    await loadData();
                  }}
                  className="mt-3 w-full rounded-lg bg-[var(--color-primary)] text-white text-sm py-2 hover:opacity-90"
                >
                  Send via Email
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[var(--color-border)] p-8 text-center">
              <p className="text-sm text-[var(--color-muted-foreground)]">No draft response yet</p>
              {!!corr.contract_id && (
                <p className="text-xs text-[var(--color-muted)] mt-1">Click a tone button above to generate one</p>
              )}
            </div>
          )}

          {drafts.length > 1 && (
            <div className="mt-3">
              <p className="text-xs text-[var(--color-muted-foreground)] mb-1">{drafts.length} drafts — select:</p>
              <div className="flex gap-1">
                {drafts.map((d, i) => (
                  <button
                    key={str(d.id)}
                    onClick={() => setSelectedDraft(d)}
                    className={`text-xs px-2 py-1 rounded border ${selectedDraft?.id === d.id ? "border-[var(--color-primary)] text-[var(--color-primary)]" : "border-[var(--color-border)]"}`}
                  >
                    {i + 1} — {str(d.tone)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
