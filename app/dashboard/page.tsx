import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  CalendarPlus,
  Car,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

const STATUS_CONFIG: Record<
  string,
  { label: string; cls: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  confirmed:  { label: "Confirmed",  cls: "text-emerald-400 bg-emerald-400/10", Icon: CheckCircle2 },
  pending:    { label: "Pending",    cls: "text-amber-400 bg-amber-400/10",     Icon: Clock },
  completed:  { label: "Completed",  cls: "text-chrome/40 bg-steel/40",         Icon: CheckCircle2 },
  cancelled:  { label: "Cancelled",  cls: "text-race-red bg-race-red/10",       Icon: AlertCircle },
  active:     { label: "Active",     cls: "text-emerald-400 bg-emerald-400/10", Icon: Clock },
  no_show:    { label: "No-show",    cls: "text-chrome/30 bg-steel/20",         Icon: AlertCircle },
};

const TIER_LABEL: Record<string, { label: string; cls: string }> = {
  drop_in:  { label: "Drop-in",  cls: "text-chrome/40" },
  builder:  { label: "Builder",  cls: "text-ember" },
  gearhead: { label: "Gearhead", cls: "text-race-red" },
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: profile }, { data: bookings }, { data: vehicles }] =
    await Promise.all([
      supabase.from("users").select("*").eq("id", user.id).single(),
      supabase
        .from("bookings")
        .select("*, bays(name)")
        .eq("user_id", user.id)
        .order("start_time", { ascending: false })
        .limit(10),
      supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const today = new Date().toLocaleDateString("en-AE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Dubai",
  });

  const completed = bookings?.filter((b) => b.status === "completed") ?? [];
  const upcoming = bookings?.find(
    (b) => b.status === "confirmed" || b.status === "pending"
  );
  const totalSpend = (bookings ?? [])
    .filter((b) => b.payment_status === "paid")
    .reduce((sum, b) => sum + Number(b.total_aed), 0);

  const tier = TIER_LABEL[profile?.subscription_tier ?? "drop_in"];
  const upcomingBay = upcoming?.bays as { name: string } | null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <p className="font-label text-[10px] text-chrome/25 uppercase tracking-widest mb-1">
          {today}
        </p>
        <h1 className="font-display text-3xl text-chrome">
          Welcome back, {firstName}
        </h1>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: "Next Booking",
            value: upcoming ? upcomingBay?.name ?? "—" : "None scheduled",
            sub: upcoming
              ? new Date(upcoming.start_time).toLocaleString("en-AE", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Asia/Dubai",
                })
              : "Book a bay to get started",
            accent: upcoming,
          },
          {
            label: "Sessions Completed",
            value: completed.length,
            sub: "All time",
            accent: completed.length > 0,
          },
          {
            label: "Vehicles",
            value: vehicles?.length ?? 0,
            sub: "In your garage",
            accent: false,
          },
          {
            label: "Total Spend",
            value: `AED ${totalSpend.toLocaleString()}`,
            sub: "All time, paid bookings",
            accent: false,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-carbon border border-steel rounded-xl p-5"
          >
            <p className="font-label text-[10px] text-chrome/30 uppercase tracking-widest mb-3">
              {card.label}
            </p>
            <p
              className={`font-display text-2xl mb-1 ${card.accent ? "text-ember" : "text-chrome"}`}
            >
              {card.value}
            </p>
            <p className="font-label text-[11px] text-chrome/30">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard/book"
          className="flex items-center gap-1.5 bg-ember hover:bg-race-red text-white font-label text-xs uppercase tracking-widest px-4 py-2.5 rounded-lg transition-colors"
        >
          <CalendarPlus className="w-3.5 h-3.5" />
          Book a Bay
        </Link>
        {[
          { href: "/dashboard/parts",    label: "Browse Parts" },
          { href: "/dashboard/garage",   label: "Add Vehicle" },
          { href: "/dashboard/academy",  label: "View Academy" },
          { href: "/dashboard/profile",  label: "Manage Subscription" },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="flex items-center gap-1 border border-steel text-chrome/50 hover:text-chrome hover:border-chrome/30 font-label text-xs uppercase tracking-widest px-4 py-2.5 rounded-lg transition-colors"
          >
            {a.label}
            <ChevronRight className="w-3 h-3" />
          </Link>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bookings table */}
        <div className="lg:col-span-2 bg-carbon border border-steel rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-steel">
            <h2 className="font-display text-base text-chrome">Recent Bookings</h2>
            <Link
              href="/dashboard/book"
              className="font-label text-xs text-ember hover:text-chrome/60 uppercase tracking-widest transition-colors"
            >
              + New Booking
            </Link>
          </div>

          {(bookings?.length ?? 0) === 0 ? (
            <div className="py-12 text-center">
              <p className="font-body text-sm text-chrome/30 mb-3">No bookings yet</p>
              <Link
                href="/dashboard/book"
                className="font-label text-xs text-ember uppercase tracking-widest"
              >
                Book your first bay →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-steel">
                    {["Date & Time", "Bay", "Duration", "Status", "Amount"].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-2.5 text-left font-label text-[10px] text-chrome/30 uppercase tracking-widest whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bookings?.map((booking) => {
                    const s = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
                    const SIcon = s.Icon;
                    const bay = booking.bays as { name: string } | null;
                    return (
                      <tr
                        key={booking.id}
                        className="border-b border-steel/40 hover:bg-steel/20 transition-colors"
                      >
                        <td className="px-5 py-3 font-body text-sm text-chrome whitespace-nowrap">
                          {new Date(booking.start_time).toLocaleString("en-AE", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Asia/Dubai",
                          })}
                        </td>
                        <td className="px-5 py-3 font-body text-sm text-chrome">
                          {bay?.name ?? "—"}
                        </td>
                        <td className="px-5 py-3 font-body text-sm text-chrome/60">
                          {booking.duration_hours}hr
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label text-[10px] uppercase tracking-wider ${s.cls}`}
                          >
                            <SIcon className="w-2.5 h-2.5" />
                            {s.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-body text-sm">
                          <span
                            className={
                              booking.payment_status === "paid"
                                ? "text-emerald-400"
                                : "text-chrome/40"
                            }
                          >
                            AED {Number(booking.total_aed).toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Subscription card */}
          <div className="bg-carbon border border-steel rounded-xl p-5">
            <p className="font-label text-[10px] text-chrome/30 uppercase tracking-widest mb-2">
              Subscription
            </p>
            <p className={`font-display text-2xl mb-1 ${tier.cls}`}>{tier.label}</p>
            {profile?.subscription_tier === "drop_in" ? (
              <>
                <p className="font-body text-xs text-chrome/40 mb-4">
                  AED 85/hr · Pay per session
                </p>
                <Link
                  href="/dashboard/profile"
                  className="block w-full text-center bg-ember hover:bg-race-red text-white font-label text-xs uppercase tracking-widest py-2.5 rounded-lg transition-colors"
                >
                  Upgrade to Builder
                </Link>
                <p className="text-center font-label text-[10px] text-chrome/20 mt-1.5">
                  AED 349/mo — 10 hrs included
                </p>
              </>
            ) : (
              <p className="font-body text-xs text-chrome/40">
                {profile?.subscription_tier === "gearhead"
                  ? "AED 749/mo · Unlimited hours"
                  : "AED 349/mo · 10 hrs included"}
              </p>
            )}
          </div>

          {/* Garage */}
          <div className="bg-carbon border border-steel rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-steel">
              <h2 className="font-display text-base text-chrome">My Garage</h2>
              <Link
                href="/dashboard/garage"
                className="font-label text-xs text-ember uppercase tracking-widest"
              >
                View all
              </Link>
            </div>
            {(vehicles?.length ?? 0) === 0 ? (
              <div className="py-8 text-center">
                <p className="font-body text-xs text-chrome/30 mb-2">No vehicles added</p>
                <Link
                  href="/dashboard/garage"
                  className="font-label text-xs text-ember uppercase tracking-widest"
                >
                  + Add your first vehicle
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-steel/40">
                {vehicles?.slice(0, 4).map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-steel/20 transition-colors"
                  >
                    <div className="w-8 h-8 bg-steel/60 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Car className="w-4 h-4 text-chrome/40" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-body text-sm text-chrome truncate">
                        {v.year} {v.make} {v.model}
                      </p>
                      {v.trim && (
                        <p className="font-label text-[10px] text-chrome/30 uppercase tracking-wider truncate">
                          {v.trim}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {(vehicles?.length ?? 0) > 4 && (
                  <div className="px-5 py-2.5">
                    <Link
                      href="/dashboard/garage"
                      className="font-label text-[10px] text-chrome/30 uppercase tracking-wider hover:text-chrome/50"
                    >
                      +{(vehicles?.length ?? 0) - 4} more
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
