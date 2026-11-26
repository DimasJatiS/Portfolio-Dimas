"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef } from "react";
import { Glyph } from "@/components/artwork/Glyph";
import { Link } from "@/i18n/navigation";
import type { Project } from "@/lib/content/types";
import { gsap, getTier, isMobile, SCRUB, useGSAP } from "@/lib/motion/gsap";

// Card actions: house pills, enlarged to a 44 px target with larger, heavier text.
const BTN = "pill min-h-11 px-5 text-base font-semibold sm:text-lg";
const BTN_GHOST = `${BTN} pill-ghost hover:border-accent hover:text-accent`;

function ExternalLinks({ project }: { project: Project }) {
  const t = useTranslations("work");
  const a11y = useTranslations("a11y");
  return (
    <>
      {project.liveUrl && (
        <a href={project.liveUrl} target="_blank" rel="noreferrer" className={BTN_GHOST}>
          {t("live")} ↗<span className="sr-only"> ({a11y("external")})</span>
        </a>
      )}
      {project.repoUrl && (
        <a href={project.repoUrl} target="_blank" rel="noreferrer" className={BTN_GHOST}>
          {t("source")} ↗<span className="sr-only"> ({a11y("external")})</span>
        </a>
      )}
    </>
  );
}

/** Featured projects as stacked cards (ScrollStack pattern, CSS sticky) entering with M-14. */
export function FeaturedCards({ projects }: { projects: Project[] }) {
  const t = useTranslations("work");
  const ref = useRef<HTMLOListElement>(null);

  useGSAP(
    () => {
      const tier = getTier();
      if (tier === "still") return;
      const mobile = isMobile();
      gsap.utils.toArray<HTMLElement>("[data-card]", ref.current).forEach((card) => {
        gsap.fromTo(
          card,
          { scale: mobile ? 1 : 0.95, y: 60, opacity: 0 },
          { scale: 1, y: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: card.parentElement, start: "top 90%", end: "top 50%", scrub: SCRUB } },
        );
      });
    },
    { scope: ref },
  );

  return (
    <ol ref={ref} className="container-x flex flex-col gap-[12vh] pt-[8vh] pb-[16vh]" aria-label={t("featured")}>
      {projects.map((p, i) => (
        <li key={p.slug} className="sm:sticky" style={{ top: `calc(var(--header-h) + 16px + ${i * 18}px)` }}>
          <article data-card className="relative mx-auto grid max-w-[1180px] gap-6 rounded-[24px] border border-line bg-surface p-5 will-change-transform sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:grid-rows-[auto_1fr] lg:gap-x-10">
            <header className="flex items-end gap-5 lg:col-start-1 lg:row-start-1">
              <h3 className="font-display text-[clamp(36px,5.4vw,80px)] leading-none font-bold tracking-[-0.03em]">{p.title}</h3>
              <Glyph glyph={p.glyph} animate className="ml-auto hidden size-16 shrink-0 text-muted sm:block lg:hidden" />
            </header>
            {p.cover && (
              // The cover keeps its own ratio (never cropped); its height is capped so the pinned card fits the screen.
              // Monochrome by default; the colour version fades in on hover (PRD 13.3).
              <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
                <div
                  className="group media relative mx-auto bg-[color-mix(in_srgb,var(--fg)_7%,var(--surface))]"
                  style={{ width: `min(100%, calc(46svh * ${(p.cover.width / p.cover.height).toFixed(4)}))` }}
                >
                  <Image data-cover src={p.cover.gray} alt={p.cover.alt} width={p.cover.width} height={p.cover.height} sizes="(min-width: 1240px) 640px, (min-width: 1024px) 50vw, 92vw" className="block h-auto w-full" />
                  {p.cover.gray !== p.cover.src && (
                    <Image src={p.cover.src} alt="" aria-hidden width={p.cover.width} height={p.cover.height} sizes="(min-width: 1240px) 640px, (min-width: 1024px) 50vw, 92vw" className="absolute inset-0 size-full opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  )}
                </div>
              </div>
            )}
            <div className="flex flex-col gap-6 lg:col-start-1 lg:row-start-2 lg:justify-end">
              <div>
                <p className="max-w-[60ch] text-muted">{p.summary}</p>
                <p className="label mt-3 text-muted">{[p.role, p.year, p.stack.join(" · ")].filter(Boolean).join("  ·  ")}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href={`/work/${p.slug}`} className={`${BTN} pill-accent`}>
                  {t("readCase")} →
                </Link>
                <ExternalLinks project={p} />
              </div>
            </div>
          </article>
        </li>
      ))}
    </ol>
  );
}

/** Longest side of the hover preview in CSS px; the other side follows the cover's own ratio. */
const PREVIEW = 340;

/** Non-featured projects as large rows; on fine pointers the cover follows the cursor (M-15). */
export function OtherWork({ projects }: { projects: Project[] }) {
  const t = useTranslations("work");
  const ref = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const follow = useRef<{ x: gsap.QuickToFunc; y: gsap.QuickToFunc } | null>(null);
  const shown = useRef(false);
  const seq = useRef(0);

  const enabled = () => getTier() !== "still" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const hide = useCallback(() => {
    seq.current++; // a cover still decoding must not appear after this
    if (!shown.current || !imgRef.current) return;
    shown.current = false;
    gsap.to(imgRef.current, { opacity: 0, scale: 0.9, duration: 0.25, overwrite: "auto" });
  }, []);

  // Fast scrolling slides the rows away from a still pointer without any pointer event, so the
  // row's pointerleave never comes: hide on any scroll, and when the window loses focus.
  useEffect(() => {
    window.addEventListener("scroll", hide, { passive: true });
    window.addEventListener("blur", hide);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("scroll", hide);
      window.removeEventListener("blur", hide);
      document.removeEventListener("visibilitychange", hide);
    };
  }, [hide]);

  const onEnter = (p: Project, e: React.PointerEvent) => {
    const img = imgRef.current;
    if (!img || !p.cover || !enabled()) return;
    const ratio = p.cover.width / p.cover.height;
    // The box has the cover's own ratio, so object-fit never crops it (portrait stays portrait).
    img.style.width = `${Math.round(ratio >= 1 ? PREVIEW : PREVIEW * ratio)}px`;
    img.style.height = `${Math.round(ratio >= 1 ? PREVIEW / ratio : PREVIEW)}px`;
    if (!follow.current) {
      gsap.set(img, { xPercent: -50, yPercent: -50 });
      follow.current = {
        x: gsap.quickTo(img, "x", { duration: 0.5, ease: "power3.out" }),
        y: gsap.quickTo(img, "y", { duration: 0.5, ease: "power3.out" }),
      };
    }
    if (!shown.current) gsap.set(img, { x: e.clientX, y: e.clientY, opacity: 0, scale: 0.9 });
    shown.current = true;
    const token = ++seq.current;
    // Served resized by next/image (750 px wide ≈ 2× the preview), so a 2560 px cover is never downloaded for a card.
    img.src = `/_next/image?url=${encodeURIComponent(p.cover.src)}&w=750&q=75`;
    // Show it once decoded, so the previous project's cover never flashes under the new title.
    img.decode().catch(() => {}).then(() => {
      if (token === seq.current && shown.current) gsap.to(img, { opacity: 1, scale: 1, rotate: -3, duration: 0.4, overwrite: "auto" });
    });
  };
  const onMove = (e: React.PointerEvent) => {
    follow.current?.x(e.clientX);
    follow.current?.y(e.clientY);
  };

  if (projects.length === 0) return null;
  return (
    <div ref={ref} className="container-x pb-[clamp(96px,14vh,160px)]" onPointerMove={onMove} onPointerLeave={hide}>
      <h3 className="label border-b border-line pb-3 text-muted" data-scramble>
        {t("other")}
      </h3>
      <ul>
        {projects.map((p) => {
          const row = (
            <>
              <span className="font-display text-[clamp(32px,4.4vw,64px)] leading-tight font-bold tracking-[-0.02em]">{p.title}</span>
              <span className="hidden max-w-[36ch] text-base text-muted lg:block">{p.summary}</span>
              <span className="label ml-auto flex items-center gap-4 text-muted">
                {p.year}
                <span aria-hidden>→</span>
              </span>
            </>
          );
          const cls = "flex items-center gap-8 border-b border-line py-6 sm:py-8";
          return (
            <li key={p.slug} onPointerEnter={(e) => onEnter(p, e)} onPointerLeave={hide}>
              <Link href={`/work/${p.slug}`} className={`${cls} hover:text-accent`}>
                {row}
              </Link>
            </li>
          );
        })}
      </ul>
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative cursor follower, resized through /_next/image */}
      <img data-follower ref={imgRef} alt="" aria-hidden className="media pointer-events-none fixed top-0 left-0 z-40 object-cover opacity-0 max-sm:hidden" />
    </div>
  );
}
