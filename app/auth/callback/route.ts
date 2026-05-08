import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard/app";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // ── Welcome email for brand-new users ──────────────────────────────────
      // created_at and last_sign_in_at being equal (within 5s) means first login
      const user = data.user;
      const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0;
      const lastSignIn = user.last_sign_in_at
        ? new Date(user.last_sign_in_at).getTime()
        : 0;
      const isNewUser = Math.abs(createdAt - lastSignIn) < 5000;

      if (isNewUser && user.email) {
        const fullName =
          (user.user_metadata?.full_name as string | undefined) ??
          user.email.split("@")[0];

        // Fire-and-forget — don't block the redirect on email delivery
        sendWelcomeEmail({ to: user.email, customerName: fullName }).catch(
          (err) => console.error("Welcome email failed:", err)
        );
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
