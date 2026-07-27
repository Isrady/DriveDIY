import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/email/gmail";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect("/login");

  const url = getAuthUrl();
  return NextResponse.redirect(url);
}
