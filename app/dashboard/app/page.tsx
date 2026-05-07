import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MobileAppShell from "@/components/dashboard/MobileAppShell";

export default async function AppPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch user data
  const [{ data: profile }, { data: bookings }, { data: vehicles }] =
    await Promise.all([
      supabase.from("users").select("*").eq("id", user.id).single(),
      supabase
        .from("bookings")
        .select("*, bays(name)")
        .eq("user_id", user.id)
        .order("start_time", { ascending: false })
        .limit(5),
      supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

  return (
    <MobileAppShell
      user={profile ?? { id: user.id, email: user.email ?? "", role: "customer", subscription_tier: "drop_in", preferred_language: "en" }}
      bookings={bookings ?? []}
      vehicles={vehicles ?? []}
    />
  );
}
