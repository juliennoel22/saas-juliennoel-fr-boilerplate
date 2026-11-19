import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { siteConfig } from "@/config/site";
import {
  ALLOWED_UPLOAD_MIME_TYPES,
  MIME_TO_EXTENSION,
  uploadConfig,
} from "@/config/uploads";
import { getServerEnv } from "@/lib/env";
import { checkRateLimit, getClientIp, validateSameOrigin } from "@/lib/security";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/supabase/server";

const signUploadSchema = z.object({
  mimeType: z.enum(ALLOWED_UPLOAD_MIME_TYPES),
  sizeBytes: z.number().int().positive().max(uploadConfig.maxFileSizeBytes),
});

export async function POST(request: Request): Promise<NextResponse> {
  if (!siteConfig.features.uploadsEnabled) {
    return NextResponse.json({ error: "Téléversement désactivé." }, { status: 404 });
  }

  const env = getServerEnv();
  if (!validateSameOrigin(request, env.NEXT_PUBLIC_APP_URL)) {
    return NextResponse.json({ error: "Origine de requête non autorisée." }, { status: 403 });
  }

  const ipRate = checkRateLimit(`uploads:ip:${getClientIp(request)}`, 30, 60_000);
  if (!ipRate.allowed) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  const userRate = checkRateLimit(`uploads:user:${user.id}`, 20, 60_000);
  if (!userRate.allowed) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const parsed = signUploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Type ou taille de fichier non autorisé." },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Stockage non configuré." }, { status: 503 });
  }

  // Always generate an unpredictable server-side filename scoped to the authenticated user.
  // Bucket MIME allowlist & 10 MB cap are enforced at the Supabase Storage layer (001_initial_schema.sql).
  // TODO(security): Validate magic bytes and scan uploaded objects asynchronously before exposing them to downstream processors.
  const extension = MIME_TO_EXTENSION[parsed.data.mimeType];
  const objectPath = `${user.id}/${randomUUID()}.${extension}`;

  const { data, error } = await admin.storage
    .from(uploadConfig.bucket)
    .createSignedUploadUrl(objectPath, { upsert: false });

  if (error || !data) {
    return NextResponse.json(
      { error: "Impossible de signer l'URL de téléversement." },
      { status: 502 },
    );
  }

  return NextResponse.json(
    {
      signedUrl: data.signedUrl,
      path: data.path,
      token: data.token,
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
