import { ImageResponse } from "next/og";
import type { Locale } from "@/i18n/routing";
import { getContent } from "@/lib/content/get";
import { stripAccent } from "@/lib/content/text";

export const alt = "Satria's";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** F-16: monochrome, typographic, one bronze light - the hero in 1200×630, per locale. */
export default async function OpengraphImage({ params }: { params: Promise<{ locale: Locale }> }) {
  // Route handler: root params are not available here, so the locale comes from `params`.
  const { locale } = await params;
  const { settings } = await getContent(locale);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0A0A0A", color: "#F5F5F2", padding: 72, position: "relative" }}>
        <div style={{ position: "absolute", left: 300, bottom: -380, width: 600, height: 600, borderRadius: 999, background: "radial-gradient(circle, #CD7F32 0%, rgba(205,127,50,0.35) 35%, rgba(10,10,10,0) 70%)" }} />
        <div style={{ display: "flex", fontSize: 22, letterSpacing: 4, color: "#CD7F32" }}>{settings.heroLabel}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 96, letterSpacing: -2, lineHeight: 1 }}>DIMAS JATI SATRIA</div>
          <div style={{ fontSize: 34, color: "#A3A3A3", marginTop: 24, maxWidth: 900 }}>{stripAccent(settings.heroStatement)}</div>
        </div>
        <div style={{ display: "flex", fontSize: 20, letterSpacing: 3, color: "#A3A3A3" }}>DIMASJATI.VERCEL.APP</div>
      </div>
    ),
    size,
  );
}
