"use client";

import Link from "next/link";
import { Bell, Search, Settings } from "lucide-react";

interface Props {
  user: {
    full_name: string | null;
    email: string;
    role: string;
    subscription_tier: string;
  };
  pendingCount: number;
}

const TIER_LABEL: Record<string, string> = {
  drop_in: "Drop-in",
  builder: "Builder",
  gearhead: "Gearhead",
};

export default function TopBar({ user, pendingCount }: Props) {
  const initials = user.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : user.email[0].toUpperCase();

  return (
    <header className="h-14 border-b border-steel bg-carbon flex items-center gap-4 px-5 flex-shrink-0">
      {/* Global search */}
      <div className="flex-1 max-w-md">
        <div className="flex items-center gap-2 bg-midnight/60 rounded-lg px-3 py-2 border border-steel/60 hover:border-chrome/20 transition-colors">
          <Search className="w-3.5 h-3.5 text-chrome/30 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search bookings, parts, guides…"
            className="bg-transparent text-sm text-chrome placeholder:text-chrome/25 outline-none flex-1 min-w-0"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        {/* Notifications — admin only */}
        {user.role === "admin" && (
          <Link
            href="/dashboard/commander"
            className="relative p-2 rounded-lg hover:bg-steel/60 transition-colors"
            title="Pending approvals"
          >
            <Bell className="w-4 h-4 text-chrome/50" />
            {pendingCount > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-race-red rounded-full text-[9px] font-label text-white flex items-center justify-center leading-none">
                {pendingCount > 9 ? "9+" : pendingCount}
              </span>
            )}
          </Link>
        )}

        {/* Settings */}
        <Link
          href="/dashboard/profile"
          className="p-2 rounded-lg hover:bg-steel/60 transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4 text-chrome/50" />
        </Link>

        {/* Divider */}
        <div className="w-px h-6 bg-steel mx-1" />

        {/* User */}
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-steel/40 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-ember flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-label font-medium">{initials}</span>
          </div>
          <div className="hidden sm:block text-left">
            <p className="font-body text-sm text-chrome leading-none">
              {user.full_name ?? user.email.split("@")[0]}
            </p>
            <p className="font-label text-[10px] text-chrome/30 uppercase tracking-wider leading-none mt-0.5">
              {TIER_LABEL[user.subscription_tier] ?? "Drop-in"}
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}
