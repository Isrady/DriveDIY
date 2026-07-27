import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";
import type { OrderItem } from "@/types/database";

const STATUS_CONFIG: Record<
  string,
  { label: string; cls: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  pending:    { label: "Pending",    cls: "text-amber-400 bg-amber-400/10",  Icon: Clock },
  processing: { label: "Processing", cls: "text-ember bg-ember/10",          Icon: Clock },
  fulfilled:  { label: "Fulfilled",  cls: "text-emerald-400 bg-emerald-400/10", Icon: CheckCircle2 },
  cancelled:  { label: "Cancelled",  cls: "text-race-red bg-race-red/10",    Icon: AlertCircle },
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <p className="font-label text-[10px] text-chrome/25 uppercase tracking-widest mb-1">
          Commerce / My Orders
        </p>
        <h1 className="font-display text-3xl text-chrome">My Orders</h1>
      </div>

      <div className="bg-carbon border border-steel rounded-xl overflow-hidden">
        {(orders?.length ?? 0) === 0 ? (
          <div className="py-16 text-center">
            <p className="font-body text-sm text-chrome/30 mb-3">No parts orders yet</p>
            <Link
              href="/dashboard/parts"
              className="font-label text-xs text-ember uppercase tracking-widest"
            >
              Browse Parts Store →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-steel">
                  {["Order ID", "Date", "Items", "Status", "Total"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-2.5 text-left font-label text-[10px] text-chrome/30 uppercase tracking-widest"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders?.map((order) => {
                  const s = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
                  const SIcon = s.Icon;
                  const items = (order.items as OrderItem[]) ?? [];
                  return (
                    <tr
                      key={order.id}
                      className="border-b border-steel/40 hover:bg-steel/20 transition-colors"
                    >
                      <td className="px-5 py-3 font-label text-xs text-chrome/50 uppercase">
                        {order.id.slice(0, 8)}
                      </td>
                      <td className="px-5 py-3 font-body text-sm text-chrome">
                        {new Date(order.created_at).toLocaleDateString("en-AE", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          timeZone: "Asia/Dubai",
                        })}
                      </td>
                      <td className="px-5 py-3 font-body text-sm text-chrome/60">
                        {items.length > 0
                          ? items.map((i) => `${i.name} ×${i.qty}`).join(", ")
                          : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label text-[10px] uppercase tracking-wider ${s.cls}`}
                        >
                          <SIcon className="w-2.5 h-2.5" />
                          {s.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-body text-sm text-emerald-400">
                        AED {Number(order.total_aed).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
