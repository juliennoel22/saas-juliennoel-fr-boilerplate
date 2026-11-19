export const ALLOWED_UPLOAD_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export type AllowedUploadMimeType = (typeof ALLOWED_UPLOAD_MIME_TYPES)[number];

export const MIME_TO_EXTENSION: Record<AllowedUploadMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export const uploadConfig = {
  bucket: "user-uploads",
  maxFileSizeBytes: 10 * 1024 * 1024, // 10 MB hard ceiling
  serverActionBypassBytes: 1 * 1024 * 1024, // Always use Signed URL above 1 MB
  signedUrlExpiresInSeconds: 120,
  compression: {
    maxDimensionPx: 1600,
    quality: 0.8,
    outputMimeType: "image/jpeg" as const,
  },
} as const;

export function isAllowedMimeType(mime: string): mime is AllowedUploadMimeType {
  return (ALLOWED_UPLOAD_MIME_TYPES as readonly string[]).includes(mime);
}
