import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BookBayScreen from "@/components/dashboard/screens/BookBayScreen";

export default async function BookPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <p className="font-label text-[10px] text-chrome/25 uppercase tracking-widest mb-1">
          Operations / Bay Booking
        </p>
        <h1 className="font-display text-3xl text-chrome">Book a Bay</h1>
        <p className="font-body text-sm text-chrome/40 mt-1">
          Reserve one of 5 bays at DriveDIY Al Quoz — AED 85/hr
        </p>
      </div>

      {/* Enterprise wrapper: centered, max width constrained */}
      <div className="max-w-2xl">
        <div className="bg-carbon border border-steel rounded-xl overflow-hidden">
          <BookBayScreen userId={user.id} />
        </div>
      </div>
    </div>
  );
}
