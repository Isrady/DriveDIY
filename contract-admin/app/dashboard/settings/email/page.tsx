"use client";

import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/utils";

export default function EmailSettingsPage() {
  const [accounts, setAccounts] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/email/accounts")
      .then((r) => r.json())
      .then((d) => setAccounts(d.accounts ?? []))
      .finally(() => setLoading(false));
  }, []);

  function connectGmail() {
    window.location.href = "/api/email/oauth/start";
  }

  async function disconnect(id: string) {
    if (!confirm("Disconnect this email account?")) return;
    await fetch(`/api/email/accounts/${id}`, { method: "DELETE" });
    setAccounts((prev) => prev.filter((a) => (a.id as string) !== id));
  }

  async function syncNow(id: string) {
    await fetch("/api/email/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account_id: id }),
    });
    alert("Sync started. New emails will appear in the correspondence inbox.");
  }

  if (loading) return <div className="p-6 text-[var(--color-muted-foreground)]">Loading…</div>;

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-bold text-[var(--color-foreground)] mb-2">Email Integration</h1>
      <p className="text-sm text-[var(--color-muted-foreground)] mb-6">
        Connect a Gmail account to automatically monitor incoming and outgoing correspondence.
        New emails will be analyzed by the AI agent and appear in the correspondence inbox.
      </p>

      <button
        onClick={connectGmail}
        className="mb-6 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
      >
        + Connect Gmail Account
      </button>

      {accounts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--color-border)] p-8 text-center">
          <p className="text-sm text-[var(--color-muted-foreground)]">No email accounts connected.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((a) => (
            <div key={a.id as string} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-[var(--color-foreground)]">{String(a.email_address)}</p>
                  {!!a.display_name && (
                    <p className="text-sm text-[var(--color-muted-foreground)]">{String(a.display_name)}</p>
                  )}
                  <p className="text-xs text-[var(--color-muted)] mt-1">
                    Provider: {String(a.provider).toUpperCase()} ·{" "}
                    {a.is_active ? "Active" : "Inactive"} ·{" "}
                    {a.last_synced_at ? `Last sync: ${formatDateTime(String(a.last_synced_at))}` : "Never synced"}
                  </p>
                  {!!a.sync_error && (
                    <p className="text-xs text-red-600 mt-1">{String(a.sync_error)}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => syncNow(a.id as string)}
                    className="text-xs text-[var(--color-primary)] hover:underline"
                  >
                    Sync now
                  </button>
                  <button
                    onClick={() => disconnect(a.id as string)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        <h2 className="text-sm font-semibold mb-2">WhatsApp Status</h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          WhatsApp inbound messages are automatically received via Twilio webhook at{" "}
          <code className="text-xs bg-[var(--color-border)] px-1 rounded">/api/webhooks/twilio</code>.
          Configure this URL in your Twilio Console WhatsApp Sandbox settings.
        </p>
      </div>
    </div>
  );
}
