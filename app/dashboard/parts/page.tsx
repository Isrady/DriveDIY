import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PartsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Dynamic import so the client component is only bundled client-side
  const { default: PartsScreen } = await import(
    "@/components/dashboard/screens/PartsScreen"
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <p className="font-label text-[10px] text-chrome/25 uppercase tracking-widest mb-1">
          Commerce / Parts Store
        </p>
        <h1 className="font-display text-3xl text-chrome">Parts Store</h1>
        <p className="font-body text-sm text-chrome/40 mt-1">
          OEM and aftermarket parts — in-stock, same-day pickup at Al Quoz
        </p>
      </div>
      <PartsScreen />
    </div>
  );
}
