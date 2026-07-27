import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AcademyScreen from "@/components/dashboard/screens/AcademyScreen";

export default async function AcademyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <p className="font-label text-[10px] text-chrome/25 uppercase tracking-widest mb-1">
          Learning / DIY Academy
        </p>
        <h1 className="font-display text-3xl text-chrome">DIY Academy</h1>
        <p className="font-body text-sm text-chrome/40 mt-1">
          Step-by-step guides in English, Arabic, Urdu & Filipino
        </p>
      </div>
      <div className="max-w-2xl bg-carbon border border-steel rounded-xl overflow-hidden">
        <AcademyScreen />
      </div>
    </div>
  );
}
