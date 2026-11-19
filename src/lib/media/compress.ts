"use client";

import { z } from "zod";
import { isAllowedMimeType, uploadConfig } from "@/config/uploads";
import { err, ok, type Result } from "@/types/result";

const signedUploadResponseSchema = z.object({
  signedUrl: z.url(),
  path: z.string().min(1),
  token: z.string().min(1).optional(),
});

export interface UploadedFileRef {
  readonly path: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
}

export async function compressImageFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "application/pdf") {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const { maxDimensionPx, quality, outputMimeType } = uploadConfig.compression;
  const largestSide = Math.max(bitmap.width, bitmap.height);
  const scale = largestSide > maxDimensionPx ? maxDimensionPx / largestSide : 1;

  const targetWidth = Math.max(1, Math.round(bitmap.width * scale));
  const targetHeight = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }

  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), outputMimeType, quality);
  });

  if (!blob) return file;

  const baseName = file.name.replace(/\.[^/.]+$/, "") || "upload";
  return new File([blob], `${baseName}.jpg`, { type: outputMimeType });
}

export async function uploadViaSignedUrl(
  rawFile: File,
): Promise<Result<UploadedFileRef, string>> {
  if (!isAllowedMimeType(rawFile.type)) {
    return err("Type de fichier non autorisé.");
  }

  const preparedFile =
    rawFile.type === "application/pdf" ? rawFile : await compressImageFile(rawFile);

  if (preparedFile.size > uploadConfig.maxFileSizeBytes) {
    return err("Le fichier dépasse la limite maximale autorisée.");
  }

  const signResponse = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mimeType: preparedFile.type,
      sizeBytes: preparedFile.size,
    }),
  });

  if (!signResponse.ok) {
    return err("Impossible de préparer le téléversement sécurisé.");
  }

  const signJson: unknown = await signResponse.json();
  const parsed = signedUploadResponseSchema.safeParse(signJson);
  if (!parsed.success) {
    return err("Réponse de signature de téléversement invalide.");
  }

  const putResponse = await fetch(parsed.data.signedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": preparedFile.type,
    },
    body: preparedFile,
  });

  if (!putResponse.ok) {
    return err("Le transfert du fichier a échoué.");
  }

  return ok({
    path: parsed.data.path,
    mimeType: preparedFile.type,
    sizeBytes: preparedFile.size,
  });
}
