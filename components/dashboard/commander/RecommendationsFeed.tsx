import type { Recommendation } from "@/types/agents";

const PRIORITY_STYLES: Record<string, { badge: string; dot: string }> = {
  critical: { badge: "bg-race-red/20 text-race-red border-race-red/30", dot: "bg-race-red" },
  high: { badge: "bg-ember/20 text-ember border-ember/30", dot: "bg-ember" },
  medium: { badge: "bg-amber-500/20 text-amber-400 border-amber-500/30", dot: "bg-amber-400" },
  low: { badge: "bg-steel text-chrome/40 border-steel", dot: "bg-steel" },
};

interface Props {
  recommendations: Recommendation[];
  onDismiss: (id: string) => void;
}

export default function RecommendationsFeed({ recommendations, onDismiss }: Props) {
  if (recommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-48">
        <div className="text-3xl mb-2">🧠</div>
        <p className="font-label text-xs text-chrome/20 uppercase tracking-widest">
          No recommendations yet
        </p>
        <p className="font-body text-xs text-chrome/20 mt-2">
          Chat with Commander to get strategic advice.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {recommendations.map((rec) => {
        const styles = PRIORITY_STYLES[rec.priority] ?? PRIORITY_STYLES.medium;

        return (
          <div
            key={rec.id}
            className="bg-midnight border border-steel rounded-xl p-4 space-y-3"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <span
                className={`font-label text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${styles.badge}`}
              >
                {rec.priority}
              </span>
              <button
                onClick={() => onDismiss(rec.id)}
                className="text-chrome/20 hover:text-chrome/50 text-xs transition-colors flex-shrink-0"
                title="Dismiss"
              >
                ✕
              </button>
            </div>

            {/* Title */}
            <h4 className="font-display text-lg text-chrome leading-tight">{rec.title}</h4>

            {/* Body */}
            <p className="font-body text-sm text-chrome/60 leading-relaxed">{rec.body}</p>

            {/* Agent source */}
            <div className="flex items-center gap-2">
              <div
                className={`w-1.5 h-1.5 rounded-full ${styles.dot}`}
              />
              <span className="font-label text-[10px] text-chrome/20 uppercase tracking-wider">
                via {rec.agent}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
