import { ImageResponse } from "next/og";
import type { Locale } from "@/i18n/routing";
import { getContent } from "@/lib/content/get";

export const alt = "Case study | Satria's";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params;
  const { projects } = await getContent(locale);
  const p = projects.find((x) => x.slug === slug);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0A0A0A", color: "#F5F5F2", padding: 72 }}>
        <div style={{ display: "flex", fontSize: 22, letterSpacing: 4, color: "#CD7F32" }}>CASE STUDY · DIMAS JATI SATRIA</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 120, letterSpacing: -3, lineHeight: 1 }}>{p?.title ?? "Portfolio"}</div>
          <div style={{ fontSize: 32, color: "#A3A3A3", marginTop: 24, maxWidth: 950 }}>{p?.summary ?? ""}</div>
        </div>
        <div style={{ display: "flex", fontSize: 22, letterSpacing: 2, color: "#A3A3A3" }}>{p?.stack.join(" · ").toUpperCase() ?? ""}</div>
      </div>
    ),
    size,
  );
}
