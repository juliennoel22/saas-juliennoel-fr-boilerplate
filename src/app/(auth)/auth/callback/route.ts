import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sanitizeRedirectPath } from "@/lib/security";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ALLOWED_OTP_TYPES = new Set<EmailOtpType>([
  "magiclink",
  "email",
  "signup",
  "recovery",
  "invite",
  "email_change",
]);

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const rawType = searchParams.get("type");
  const nextPath = sanitizeRedirectPath(searchParams.get("next"), "/dashboard");

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/login?error=auth_unavailable`);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${nextPath}`);
    }
  }

  if (tokenHash && rawType && ALLOWED_OTP_TYPES.has(rawType as EmailOtpType)) {
    const { error } = await supabase.auth.verifyOtp({
      type: rawType as EmailOtpType,
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${nextPath}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=invalid_link`);
}
