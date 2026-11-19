import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { checkRateLimit, getClientIp, signVipToken, validateSameOrigin } from "@/lib/security";
import { checkoutRequestSchema, createHostedCheckoutSession } from "@/lib/stripe/checkout";
import { getAuthenticatedUser } from "@/lib/supabase/server";

const VIP_COOKIE_NAME =
  process.env.NODE_ENV === "production" ? "__Host-vip_session" : "vip_session";

export async function POST(request: Request): Promise<NextResponse> {
  const env = getServerEnv();
  if (!validateSameOrigin(request, env.NEXT_PUBLIC_APP_URL)) {
    return NextResponse.json({ error: "Origine de requête non autorisée." }, { status: 403 });
  }

  const rate = checkRateLimit(`checkout:${getClientIp(request)}`, 20, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans une minute." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const parsed = checkoutRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Paramètres de commande invalides." }, { status: 400 });
  }

  const user = await getAuthenticatedUser();
  const result = await createHostedCheckoutSession(
    parsed.data,
    user ? { id: user.id, email: user.email } : undefined,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const response = NextResponse.json(result.data, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });

  if (result.data.type === "vip" && env.VIP_BYPASS_CODES) {
    const signedToken = signVipToken(result.data.planKey, env.VIP_BYPASS_CODES);
    response.cookies.set(VIP_COOKIE_NAME, signedToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 15 * 60,
    });
  }

  return response;
}
