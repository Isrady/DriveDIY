import type { Permission } from "@/types/agents";

const AGENT_COLORS: Record<string, string> = {
  commander: "#F59E0B",
  ops: "#E8330A",
  marketing: "#A855F7",
  crm: "#3B82F6",
};

interface Props {
  permissions: Permission[];
  onResolve: (id: string, status: "approved" | "denied") => void;
}

export default function PermissionsPanel({ permissions, onResolve }: Props) {
  if (permissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-48">
        <div className="text-3xl mb-2">✅</div>
        <p className="font-label text-xs text-chrome/20 uppercase tracking-widest">
          No pending approvals
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {permissions.map((perm) => (
        <div
          key={perm.id}
          className="bg-midnight border border-steel rounded-xl p-4 space-y-3"
        >
          {/* Agent badge */}
          <div className="flex items-center justify-between">
            <span
              className="font-label text-xs uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={{
                color: AGENT_COLORS[perm.agent] ?? "#BCC6D4",
                backgroundColor: (AGENT_COLORS[perm.agent] ?? "#BCC6D4") + "22",
                border: `1px solid ${(AGENT_COLORS[perm.agent] ?? "#BCC6D4") + "44"}`,
              }}
            >
              {perm.agent}
            </span>
            <span className="font-label text-[10px] text-chrome/20 uppercase">
              {new Date(perm.requested_at).toLocaleTimeString("en-AE", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Asia/Dubai",
              })}
            </span>
          </div>

          {/* Action */}
          <div>
            <p className="font-label text-xs text-chrome/40 uppercase tracking-widest mb-1">
              {perm.action.replace(/_/g, " ")}
            </p>
            <p className="font-body text-sm text-chrome/80 leading-relaxed">
              {perm.description}
            </p>
          </div>

          {/* Payload preview */}
          {Object.keys(perm.payload).length > 0 && (
            <div className="bg-steel/30 rounded-lg p-3">
              <p className="font-label text-[10px] text-chrome/20 uppercase tracking-wider mb-1">
                Payload
              </p>
              <pre className="font-label text-[10px] text-chrome/50 overflow-x-auto">
                {JSON.stringify(perm.payload, null, 2)}
              </pre>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => onResolve(perm.id, "approved")}
              className="flex-1 bg-ember hover:bg-race-red text-white font-label text-xs uppercase tracking-widest py-2.5 rounded-lg transition-colors"
            >
              ✓ Approve
            </button>
            <button
              onClick={() => onResolve(perm.id, "denied")}
              className="flex-1 border border-steel hover:border-chrome/30 text-chrome/50 font-label text-xs uppercase tracking-widest py-2.5 rounded-lg transition-colors"
            >
              ✗ Deny
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
