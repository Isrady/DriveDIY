import { formatDateTime } from "@/lib/utils";
import type { User, Booking } from "@/types/database";

interface Props {
  user: Partial<User> & { id: string; email: string };
  nextBooking?: (Booking & { bays?: { name: string } | null }) | null;
}

export default function HomeScreen({ user, nextBooking }: Props) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const name = user.full_name?.split(" ")[0] ?? "Racer";

  return (
    <div className="p-5 space-y-4">
      {/* Header */}
      <div className="pt-2">
        <p className="font-label text-xs text-chrome/40 uppercase tracking-widest">
          {greeting}
        </p>
        <h1 className="font-display text-4xl text-chrome mt-1">
          {name.toUpperCase()}
        </h1>
      </div>

      {/* Next booking */}
      {nextBooking ? (
        <div className="bg-ember/10 border border-ember/30 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="font-label text-xs text-ember uppercase tracking-widest">
              Next Session
            </span>
            <span className="font-label text-xs text-chrome/40 uppercase">
              {nextBooking.status}
            </span>
          </div>
          <div className="font-display text-2xl text-chrome mb-1">
            {(nextBooking.bays as { name: string } | null)?.name ?? "Bay"}
          </div>
          <div className="font-body text-sm text-chrome/60">
            {formatDateTime(nextBooking.start_time)}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="font-label text-xs text-chrome/40">
              {nextBooking.duration_hours}hr · AED {nextBooking.total_aed}
            </span>
            <span className="font-label text-xs text-ember">→ Check In</span>
          </div>
        </div>
      ) : (
        <div className="bg-steel rounded-2xl p-5 text-center">
          <div className="text-3xl mb-2">🔧</div>
          <p className="font-body text-chrome/50 text-sm">No upcoming sessions</p>
          <button className="mt-3 bg-ember text-white font-label text-xs uppercase tracking-widest px-5 py-2 rounded-full">
            Book a Bay
          </button>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <p className="font-label text-xs text-chrome/30 uppercase tracking-widest mb-3">
          Quick Actions
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: "🏗️", label: "Book Bay", color: "bg-ember/10 border-ember/20" },
            { icon: "🔧", label: "Add Vehicle", color: "bg-chrome/5 border-steel" },
            { icon: "🎓", label: "Academy", color: "bg-chrome/5 border-steel" },
            { icon: "🤝", label: "Get Help", color: "bg-chrome/5 border-steel" },
          ].map((action) => (
            <button
              key={action.label}
              className={`${action.color} border rounded-xl p-4 flex flex-col items-start gap-2 hover:opacity-80 transition-opacity`}
            >
              <span className="text-xl">{action.icon}</span>
              <span className="font-label text-xs text-chrome/70 uppercase tracking-wider">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Current plan */}
      <div className="bg-midnight rounded-2xl p-5 border border-steel">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-label text-xs text-chrome/30 uppercase tracking-widest mb-1">
              Your Plan
            </p>
            <p className="font-display text-xl text-chrome capitalize">
              {user.subscription_tier?.replace("_", "-") ?? "Drop-In"}
            </p>
          </div>
          <div className="text-right">
            <p className="font-label text-xs text-ember uppercase">Upgrade</p>
          </div>
        </div>
      </div>
    </div>
  );
}
