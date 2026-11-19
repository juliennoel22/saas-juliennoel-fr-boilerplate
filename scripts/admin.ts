import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { sanitizeRedirectPath } from "../src/lib/security";
import type { Database } from "../src/types/database.types";

const emailSchema = z.string().trim().pipe(z.email());
const positiveIntSchema = z.coerce.number().int().positive().max(1_000_000);

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }
  return createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function resolveProfileByEmail(email: string) {
  const admin = getAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, email, credits, plan, is_active, stripe_customer_id, created_at")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  return data;
}

async function ensureUser(email: string): Promise<string> {
  const existing = await resolveProfileByEmail(email);
  if (existing) return existing.id;

  const admin = getAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: email.toLowerCase(),
    email_confirm: true,
  });
  if (error || !data.user) {
    console.error("Failed to create user:", error?.message ?? "unknown error");
    process.exit(1);
  }
  return data.user.id;
}

async function main(): Promise<void> {
  const [command, rawEmail, rawArg] = process.argv.slice(2);
  if (!command || !rawEmail) {
    console.info("Usage:");
    console.info("  npm run admin -- grant <email> [credits]");
    console.info("  npm run admin -- link <email> [next]");
    console.info("  npm run admin -- credits <email> <amount>");
    console.info("  npm run admin -- reset <email>");
    console.info("  npm run admin -- info <email>");
    process.exit(1);
  }

  const parsedEmail = emailSchema.safeParse(rawEmail);
  if (!parsedEmail.success) {
    console.error("Invalid email argument.");
    process.exit(1);
  }
  const email = parsedEmail.data.toLowerCase();
  const admin = getAdminClient();

  switch (command) {
    case "grant": {
      const credits = rawArg ? positiveIntSchema.parse(rawArg) : 50;
      const userId = await ensureUser(email);
      const { error: updateError } = await admin
        .from("profiles")
        .update({ is_active: true, plan: "pro" })
        .eq("id", userId);
      if (updateError) {
        console.error("Profile activation failed:", updateError.message);
        process.exit(1);
      }
      const { data: nextCredits, error } = await admin.rpc("credit_user_credits", {
        p_user_id: userId,
        p_amount: credits,
        p_reason: "admin_grant",
        p_reference_id: `admin:${Date.now()}`,
      });
      if (error) {
        console.error("Grant failed:", error.message);
        process.exit(1);
      }
      console.info("Granted access.", { userId, credits: nextCredits });
      break;
    }

    case "credits": {
      const amount = positiveIntSchema.parse(rawArg);
      const userId = await ensureUser(email);
      const { data: nextCredits, error } = await admin.rpc("credit_user_credits", {
        p_user_id: userId,
        p_amount: amount,
        p_reason: "admin_topup",
        p_reference_id: `admin:${Date.now()}`,
      });
      if (error) {
        console.error("Credit operation failed:", error.message);
        process.exit(1);
      }
      console.info("Updated credits.", { userId, credits: nextCredits });
      break;
    }

    case "link": {
      const nextPath = sanitizeRedirectPath(rawArg, "/dashboard");
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
        /\/+$/,
        "",
      );
      await ensureUser(email);
      const { data, error } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
      });
      const hashedToken = data.properties?.hashed_token;
      if (error || !hashedToken) {
        console.error("Magic link generation failed:", error?.message ?? "unknown");
        process.exit(1);
      }
      const callbackUrl = `${appUrl}/auth/callback?token_hash=${encodeURIComponent(hashedToken)}&type=magiclink&next=${encodeURIComponent(nextPath)}`;
      console.info("Generated SSR-compatible magic link:", callbackUrl);
      break;
    }

    case "reset": {
      const profile = await resolveProfileByEmail(email);
      if (!profile) {
        console.error("Profile not found.");
        process.exit(1);
      }
      const { error: resetError } = await admin
        .from("profiles")
        .update({ credits: 0, plan: "free", is_active: false })
        .eq("id", profile.id);
      if (resetError) {
        console.error("Reset failed:", resetError.message);
        process.exit(1);
      }
      console.info("Reset profile to free tier.", { userId: profile.id });
      break;
    }

    case "info": {
      const profile = await resolveProfileByEmail(email);
      if (!profile) {
        console.info("Profile not found.");
        process.exit(0);
      }
      console.info("Profile summary:", {
        id: profile.id,
        plan: profile.plan,
        credits: profile.credits,
        isActive: profile.is_active,
        hasStripeCustomer: Boolean(profile.stripe_customer_id),
        createdAt: profile.created_at,
      });
      break;
    }

    default:
      console.error(`Unknown subcommand: ${command}`);
      process.exit(1);
  }
}

void main();
