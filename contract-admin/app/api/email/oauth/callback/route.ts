import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { exchangeCode } from "@/lib/email/gmail";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  if (!code) {
    return NextResponse.redirect(`${appUrl}/dashboard/settings/email?error=no_code`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${appUrl}/login`);

  try {
    const { access_token, refresh_token, expiry_date, email } = await exchangeCode(code);

    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await admin.from("email_accounts").upsert({
      user_id: user.id,
      provider: "gmail",
      email_address: email,
      gmail_access_token: access_token,
      gmail_refresh_token: refresh_token,
      gmail_token_expiry: new Date(expiry_date).toISOString(),
      is_active: true,
    }, { onConflict: "email_address" });

    return NextResponse.redirect(`${appUrl}/dashboard/settings/email?connected=true`);
  } catch (err) {
    console.error("Gmail OAuth error:", err);
    return NextResponse.redirect(`${appUrl}/dashboard/settings/email?error=oauth_failed`);
  }
}
