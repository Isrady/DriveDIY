import type { LaunchChecklistItem } from "@/types/agents";

const CATEGORY_ICONS: Record<string, string> = {
  legal: "⚖️",
  facility: "🏗️",
  equipment: "🔧",
  staffing: "👥",
  tech: "💻",
  marketing: "📣",
};

interface Props {
  items: LaunchChecklistItem[];
  onToggle: (id: string, currentState: boolean) => void;
  completed: number;
}

export default function LaunchChecklist({ items, onToggle, completed }: Props) {
  const total = items.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Group by category
  const grouped = items.reduce<Record<string, LaunchChecklistItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const criticalIncomplete = items.filter((i) => i.priority === 1 && !i.is_completed);

  return (
    <div className="p-4">
      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex justify-between mb-2">
          <span className="font-label text-xs text-chrome/40 uppercase tracking-widest">
            Launch Progress
          </span>
          <span className="font-display text-xl text-ember">{pct}%</span>
        </div>
        <div className="h-2 bg-steel rounded-full overflow-hidden">
          <div
            className="h-full bg-ember rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="font-label text-xs text-chrome/20 mt-1.5">
          {completed} of {total} items complete
        </p>
      </div>

      {/* Critical items warning */}
      {criticalIncomplete.length > 0 && (
        <div className="bg-race-red/10 border border-race-red/30 rounded-xl p-3 mb-4">
          <p className="font-label text-xs text-race-red uppercase tracking-widest mb-1">
            {criticalIncomplete.length} Critical Items Outstanding
          </p>
          <p className="font-body text-xs text-chrome/50">
            {criticalIncomplete[0].title}
            {criticalIncomplete.length > 1 ? ` +${criticalIncomplete.length - 1} more` : ""}
          </p>
        </div>
      )}

      {/* Categories */}
      <div className="space-y-5">
        {Object.entries(grouped).map(([category, categoryItems]) => {
          const catDone = categoryItems.filter((i) => i.is_completed).length;
          return (
            <div key={category}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span>{CATEGORY_ICONS[category] ?? "📋"}</span>
                  <span className="font-label text-xs text-chrome/40 uppercase tracking-widest">
                    {category}
                  </span>
                </div>
                <span className="font-label text-xs text-chrome/20">
                  {catDone}/{categoryItems.length}
                </span>
              </div>

              <div className="space-y-1.5">
                {categoryItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onToggle(item.id, item.is_completed)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all hover:bg-steel/20 ${
                      item.is_completed ? "opacity-50" : ""
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                        item.is_completed
                          ? "bg-ember border-ember"
                          : item.priority === 1
                          ? "border-race-red"
                          : "border-steel"
                      }`}
                    >
                      {item.is_completed && (
                        <span className="text-white text-[8px]">✓</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-body text-xs leading-relaxed ${
                          item.is_completed ? "line-through text-chrome/30" : "text-chrome/70"
                        }`}
                      >
                        {item.title}
                      </p>
                      {item.priority === 1 && !item.is_completed && (
                        <span className="font-label text-[9px] text-race-red uppercase tracking-wider">
                          Critical
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
