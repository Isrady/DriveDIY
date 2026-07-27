import { createClient } from "@/lib/supabase/server";
import { formatDate, daysUntil } from "@/lib/utils";

const PRIORITY_BADGE: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-gray-100 text-gray-600 border-gray-200",
};

export default async function ActionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("actions")
    .select(`
      *,
      contract:contracts(id, title),
      correspondence:correspondence(id, subject)
    `)
    .in("status", params.status === "overdue" ? ["overdue"] : ["pending", "in_progress", "overdue"])
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(100);

  if (params.department) query = query.eq("department", params.department);
  if (params.priority) query = query.eq("priority", params.priority);

  const { data: actions } = await query;

  const overdue = (actions ?? []).filter((a) => {
    if (a.status === "overdue") return true;
    if (a.due_date && new Date(a.due_date) < new Date()) return true;
    return false;
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[var(--color-foreground)]">
          Actions{" "}
          {overdue.length > 0 && (
            <span className="text-sm text-red-600 font-normal">({overdue.length} overdue)</span>
          )}
        </h1>
      </div>

      <div className="space-y-2">
        {(actions ?? []).length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[var(--color-muted-foreground)]">No open actions.</p>
          </div>
        ) : (
          (actions ?? []).map((a) => {
            const isOverdue = a.due_date && new Date(a.due_date) < new Date();
            return (
              <div
                key={a.id}
                className={`rounded-lg border bg-[var(--color-card)] p-4 ${isOverdue ? "border-red-300" : "border-[var(--color-border)]"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${PRIORITY_BADGE[a.priority] ?? ""}`}>
                        {a.priority}
                      </span>
                      {a.department && (
                        <span className="text-xs bg-[var(--color-card)] border border-[var(--color-border)] px-1.5 py-0.5 rounded">
                          {a.department}
                        </span>
                      )}
                      {a.is_hard_deadline && (
                        <span className="text-xs bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded">
                          Hard deadline
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-[var(--color-foreground)] mt-1">{a.title}</p>
                    {a.description && (
                      <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{a.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-[var(--color-muted)]">
                      {a.contract && <span>{a.contract.title}</span>}
                      {a.linked_clause && <span>{a.linked_clause}</span>}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {a.due_date && (
                      <p className={`text-sm font-medium ${isOverdue ? "text-red-600" : "text-[var(--color-foreground)]"}`}>
                        {isOverdue ? "OVERDUE · " : ""}{formatDate(a.due_date)}
                      </p>
                    )}
                    {a.due_date && !isOverdue && (
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        {daysUntil(a.due_date)} days
                      </p>
                    )}
                    <form
                      action={`/api/actions/${a.id}`}
                      method="PATCH"
                      className="mt-2"
                    >
                      <button
                        formAction={`/api/actions/${a.id}`}
                        className="text-xs text-green-600 hover:underline"
                        onClick={async (e) => {
                          e.preventDefault();
                          await fetch(`/api/actions/${a.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: "completed" }),
                          });
                          window.location.reload();
                        }}
                      >
                        Mark complete
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
