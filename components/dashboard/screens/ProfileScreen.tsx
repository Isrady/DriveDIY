"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User, Booking } from "@/types/database";

const TIER_BADGES: Record<string, { label: string; color: string }> = {
  drop_in: { label: "Drop-In", color: "bg-steel text-chrome" },
  builder: { label: "Builder", color: "bg-ember text-white" },
  gearhead: { label: "Gearhead", color: "bg-race-red text-white" },
};

interface Props {
  user: Partial<User> & { id: string; email: string };
  bookings: Booking[];
}

export default function ProfileScreen({ user, bookings }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const tier = user.subscription_tier ?? "drop_in";
  const badge = TIER_BADGES[tier] ?? TIER_BADGES.drop_in;
  const completedBookings = bookings.filter((b) => b.status === "completed").length;
  const totalSpend = bookings
    .filter((b) => b.payment_status === "paid")
    .reduce((sum, b) => sum + b.total_aed, 0);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="p-5">
      <h2 className="font-display text-3xl text-chrome mb-5">PROFILE</h2>

      {/* User card */}
      <div className="bg-midnight border border-steel rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-ember rounded-full flex items-center justify-center font-display text-2xl text-white">
            {(user.full_name ?? user.email)[0].toUpperCase()}
          </div>
          <div>
            <p className="font-display text-xl text-chrome">{user.full_name ?? "Driver"}</p>
            <p className="font-body text-xs text-chrome/40">{user.email}</p>
          </div>
        </div>
        <div className={`inline-flex px-3 py-1 rounded-full font-label text-xs uppercase tracking-widest ${badge.color}`}>
          {badge.label}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: "Sessions", value: completedBookings },
          { label: "Total Spend", value: `AED ${totalSpend}` },
        ].map((s) => (
          <div key={s.label} className="bg-steel rounded-xl p-4 text-center">
            <p className="font-display text-2xl text-ember">{s.value}</p>
            <p className="font-label text-xs text-chrome/40 uppercase tracking-wider mt-1">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Settings */}
      <div className="bg-midnight border border-steel rounded-2xl overflow-hidden mb-4">
        {[
          { icon: "🏆", label: "Upgrade Plan", action: () => {} },
          { icon: "🔔", label: "Notifications", action: () => {} },
          { icon: "🌐", label: "Language", action: () => {} },
          { icon: "💳", label: "Payment Methods", action: () => {} },
        ].map((item, i) => (
          <button
            key={item.label}
            onClick={item.action}
            className={`w-full flex items-center gap-4 px-5 py-4 hover:bg-steel/30 transition-colors text-left ${
              i > 0 ? "border-t border-steel/30" : ""
            }`}
          >
            <span>{item.icon}</span>
            <span className="font-body text-sm text-chrome/70 flex-1">{item.label}</span>
            <span className="text-chrome/20">›</span>
          </button>
        ))}
      </div>

      <button
        onClick={handleSignOut}
        className="w-full border border-steel/50 text-chrome/40 hover:text-chrome/60 font-label text-xs uppercase tracking-widest py-4 rounded-xl transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}
