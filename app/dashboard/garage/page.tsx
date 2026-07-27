import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MyGarageScreen from "@/components/dashboard/screens/MyGarageScreen";

export default async function GaragePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <p className="font-label text-[10px] text-chrome/25 uppercase tracking-widest mb-1">
          Operations / My Garage
        </p>
        <h1 className="font-display text-3xl text-chrome">My Garage</h1>
        <p className="font-body text-sm text-chrome/40 mt-1">
          Manage your vehicles and build notes
        </p>
      </div>
      <div className="max-w-2xl bg-carbon border border-steel rounded-xl overflow-hidden">
        <MyGarageScreen vehicles={vehicles ?? []} userId={user.id} />
      </div>
    </div>
  );
}
