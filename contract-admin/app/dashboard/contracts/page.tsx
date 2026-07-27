import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatDate, formatCurrency } from "@/lib/utils";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  disputed: "bg-red-100 text-red-800",
  terminated: "bg-gray-100 text-gray-600",
  suspended: "bg-yellow-100 text-yellow-800",
  completed: "bg-blue-100 text-blue-800",
};

const PARSE_BADGE: Record<string, string> = {
  pending: "text-gray-400",
  processing: "text-yellow-500",
  completed: "text-green-600",
  failed: "text-red-500",
};

export default async function ContractsPage() {
  const supabase = await createClient();
  const { data: contracts } = await supabase
    .from("contracts")
    .select(`*, parties:contract_parties(id, role, name, is_our_org)`)
    .order("created_at", { ascending: false });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[var(--color-foreground)]">Contracts</h1>
        <Link
          href="/dashboard/contracts/new"
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          + New Contract
        </Link>
      </div>

      <div className="space-y-3">
        {(contracts ?? []).length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[var(--color-muted-foreground)]">No contracts yet.</p>
            <Link href="/dashboard/contracts/new" className="mt-2 text-sm text-[var(--color-primary)] hover:underline">
              Upload your first contract
            </Link>
          </div>
        ) : (
          (contracts ?? []).map((c) => {
            const contractor = c.parties?.find((p: { role: string }) => p.role === "contractor");
            return (
              <Link
                key={c.id}
                href={`/dashboard/contracts/${c.id}`}
                className="block rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[var(--color-foreground)] truncate">{c.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[c.status] ?? ""}`}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">
                      {c.contract_number && <span className="mr-2">{c.contract_number}</span>}
                      {c.project_name && <span>{c.project_name}</span>}
                    </p>
                    {contractor && (
                      <p className="text-sm text-[var(--color-muted)] mt-0.5">Contractor: {contractor.name}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium text-[var(--color-foreground)]">
                      {c.contract_value ? formatCurrency(c.contract_value, c.currency) : "—"}
                    </p>
                    <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                      {c.contract_type}
                    </p>
                    {c.current_completion_date && (
                      <p className="text-xs text-[var(--color-muted)] mt-0.5">
                        Completion: {formatDate(c.current_completion_date)}
                      </p>
                    )}
                    <span className={`text-xs ${PARSE_BADGE[c.parse_status] ?? ""}`}>
                      {c.parse_status === "completed" ? "Parsed ✓" : c.parse_status}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
