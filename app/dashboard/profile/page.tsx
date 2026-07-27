import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileScreen from "@/components/dashboard/screens/ProfileScreen";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: profile }, { data: bookings }] = await Promise.all([
    supabase.from("users").select("*").eq("id", user.id).single(),
    supabase
      .from("bookings")
      .select("id, status, payment_status, total_aed")
      .eq("user_id", user.id),
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <p className="font-label text-[10px] text-chrome/25 uppercase tracking-widest mb-1">
          Account / Profile & Settings
        </p>
        <h1 className="font-display text-3xl text-chrome">Profile & Settings</h1>
      </div>
      <div className="max-w-lg bg-carbon border border-steel rounded-xl overflow-hidden">
        <ProfileScreen
          user={
            profile ?? {
              id: user.id,
              email: user.email ?? "",
              full_name: null,
              role: "customer",
              subscription_tier: "drop_in",
              preferred_language: "en",
            }
          }
          bookings={bookings ?? []}
        />
      </div>
    </div>
  );
}
