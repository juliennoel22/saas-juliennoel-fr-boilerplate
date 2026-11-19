import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#ffffff",
          color: "#09090b",
          padding: "72px",
          border: "1px solid #e4e4e7",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 28,
            fontWeight: 600,
            color: "#71717a",
          }}
        >
          {siteConfig.name}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ fontSize: 58, fontWeight: 700, lineHeight: 1.1 }}>{siteConfig.tagline}</div>
          <div style={{ fontSize: 26, color: "#71717a", lineHeight: 1.4 }}>
            {siteConfig.description}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#10b981", fontWeight: 600 }}>
          {siteConfig.legal.websiteUrl}
        </div>
      </div>
    ),
    size,
  );
}
