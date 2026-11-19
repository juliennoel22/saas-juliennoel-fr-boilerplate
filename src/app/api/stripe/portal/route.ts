import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { checkRateLimit, getClientIp, validateSameOrigin } from "@/lib/security";
import { getStripeClient } from "@/lib/stripe/client";
import { createServerSupabaseClient, getAuthenticatedUser } from "@/lib/supabase/server";

export async function POST(request: Request): Promise<NextResponse> {
  const env = getServerEnv();
  if (!validateSameOrigin(request, env.NEXT_PUBLIC_APP_URL)) {
    return NextResponse.json({ error: "Origine de requête non autorisée." }, { status: 403 });
  }

  const ipRate = checkRateLimit(`portal:ip:${getClientIp(request)}`, 15, 60_000);
  if (!ipRate.allowed) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  const userRate = checkRateLimit(`portal:user:${user.id}`, 10, 60_000);
  if (!userRate.allowed) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  const stripe = getStripeClient();
  const supabase = await createServerSupabaseClient();
  if (!stripe || !supabase) {
    return NextResponse.json(
      { error: "Le portail de facturation n'est pas configuré." },
      { status: 503 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json(
      { error: "Aucun profil de facturation Stripe associé à ce compte." },
      { status: 404 },
    );
  }

  const returnUrl = `${env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "")}/dashboard`;

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl,
    });

    return NextResponse.json(
      { url: portalSession.url },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Impossible d'ouvrir le portail de facturation." },
      { status: 502 },
    );
  }
}
