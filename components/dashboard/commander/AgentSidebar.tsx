import type { AgentStatus } from "@/types/agents";
import type { AgentLog } from "@/types/database";

const STATUS_DOT: Record<AgentStatus["status"], string> = {
  active: "bg-emerald-400 animate-pulse",
  processing: "bg-amber-400 animate-pulse",
  standby: "bg-steel",
  error: "bg-race-red animate-pulse",
};

const AGENT_TREE = [
  { indent: 0, key: "commander" },
  { indent: 1, key: "ops" },
  { indent: 1, key: "marketing" },
  { indent: 1, key: "crm" },
  { indent: 1, key: "dev" },
];

interface Props {
  agents: AgentStatus[];
  recentLogs: AgentLog[];
}

export default function AgentSidebar({ agents, recentLogs }: Props) {
  const byName = Object.fromEntries(agents.map((a) => [a.name, a]));

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col border-r border-steel bg-carbon overflow-hidden">
      {/* Logo */}
      <div className="flex-shrink-0 h-14 border-b border-steel flex items-center px-5">
        <span className="font-display text-2xl text-chrome tracking-wider">
          DRIVE<span className="text-ember">DIY</span>
        </span>
      </div>

      {/* Agent hierarchy */}
      <div className="flex-shrink-0 p-4 border-b border-steel">
        <p className="font-label text-xs text-chrome/20 uppercase tracking-widest mb-3">
          Agent Network
        </p>
        {AGENT_TREE.map(({ indent, key }) => {
          const agent = byName[key];
          if (!agent) return null;
          return (
            <div
              key={key}
              className="flex items-center gap-2 py-1.5"
              style={{ paddingLeft: indent * 16 }}
            >
              {indent > 0 && (
                <span className="text-chrome/20 font-label text-xs">└─</span>
              )}
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[agent.status]}`}
                style={{ backgroundColor: agent.status !== "standby" ? undefined : agent.color + "33" }}
              />
              <span
                className="font-label text-xs uppercase tracking-wider"
                style={{ color: agent.color }}
              >
                {agent.label}
              </span>
              <span className="font-label text-[10px] text-chrome/20 ml-auto uppercase">
                {agent.status}
              </span>
            </div>
          );
        })}
      </div>

      {/* Recent activity */}
      <div className="flex-1 overflow-y-auto p-4">
        <p className="font-label text-xs text-chrome/20 uppercase tracking-widest mb-3">
          Recent Calls
        </p>
        {recentLogs.length === 0 ? (
          <p className="font-body text-xs text-chrome/20">No agent calls yet.</p>
        ) : (
          <div className="space-y-2">
            {recentLogs.slice(0, 15).map((log) => (
              <div
                key={log.id}
                className="bg-steel/30 rounded-lg p-2.5"
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="font-label text-[10px] uppercase tracking-wider"
                    style={{
                      color:
                        log.agent === "commander"
                          ? "#F59E0B"
                          : log.agent === "ops"
                          ? "#E8330A"
                          : log.agent === "marketing"
                          ? "#A855F7"
                          : log.agent === "dev"
                          ? "#22C55E"
                          : "#3B82F6",
                    }}
                  >
                    {log.agent}
                  </span>
                  <span className="font-label text-[9px] text-chrome/20">
                    {log.latency_ms ? `${log.latency_ms}ms` : ""}
                  </span>
                </div>
                {log.error ? (
                  <p className="font-label text-[10px] text-race-red truncate">
                    ⚠ {log.error}
                  </p>
                ) : (
                  <p className="font-body text-[10px] text-chrome/40 line-clamp-2">
                    {log.response.slice(0, 80)}...
                  </p>
                )}
                <div className="flex justify-between mt-1">
                  <span className="font-label text-[9px] text-chrome/20">
                    ↑{log.input_tokens} ↓{log.output_tokens}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
