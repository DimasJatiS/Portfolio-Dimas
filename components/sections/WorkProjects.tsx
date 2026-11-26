"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef } from "react";
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
          <article data-card className="relative mx-auto will-change-transform max-w-[1180px] rounded-[24px] border border-line bg-surface p-5 sm:p-10">
            <header className="flex items-end gap-5">
              <h3 className="font-display text-[clamp(36px,5.4vw,80px)] leading-none font-bold tracking-[-0.03em]">{p.title}</h3>
              <Glyph glyph={p.glyph} animate className="ml-auto hidden size-16 shrink-0 text-muted sm:block" />
            </header>
            {p.cover && (
              // Monochrome by default; the colour version fades in on hover (PRD 13.3).
              // Capped at 38svh so the whole pinned card (title → actions) fits a 720 px viewport.
              <div className="group media relative mt-6 aspect-video max-h-[38svh] w-full bg-[color-mix(in_srgb,var(--fg)_7%,var(--surface))] sm:mt-8 sm:aspect-[21/9]">
                <Image src={p.cover.gray} alt={p.cover.alt} fill sizes="(min-width: 1240px) 1100px, 92vw" className="object-cover" />
                {p.cover.gray !== p.cover.src && (
                  <Image src={p.cover.src} alt="" aria-hidden fill sizes="(min-width: 1240px) 1100px, 92vw" className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                )}
              </div>
            )}
            <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
              <div>
                <p className="max-w-[60ch] text-muted">{p.summary}</p>
                <p className="label mt-3 text-muted">{[p.role, p.year, p.stack.join(" · ")].filter(Boolean).join("  ·  ")}</p>
              </div>
              <div className="flex flex-wrap gap-3 lg:shrink-0">
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

/** Non-featured projects as large rows; on fine pointers a cover follows the cursor (M-15). */
export function OtherWork({ projects }: { projects: Project[] }) {
  const t = useTranslations("work");
  const ref = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const follow = useRef<{ x: gsap.QuickToFunc; y: gsap.QuickToFunc } | null>(null);

  const enabled = () => getTier() !== "still" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const onEnter = (p: Project, e: React.PointerEvent) => {
    const img = imgRef.current;
    if (!img || !p.cover || !enabled()) return;
    if (!follow.current) {
      follow.current = {
        x: gsap.quickTo(img, "x", { duration: 0.5, ease: "power3.out" }),
        y: gsap.quickTo(img, "y", { duration: 0.5, ease: "power3.out" }),
      };
      gsap.set(img, { x: e.clientX, y: e.clientY });
    }
    img.src = p.cover.src;
    gsap.to(img, { opacity: 1, scale: 1, rotate: -3, duration: 0.4 });
  };
  const onMove = (e: React.PointerEvent) => {
    follow.current?.x(e.clientX);
    follow.current?.y(e.clientY);
  };
  const onLeave = () => imgRef.current && gsap.to(imgRef.current, { opacity: 0, scale: 0.9, duration: 0.3 });

  if (projects.length === 0) return null;
  return (
    <div ref={ref} className="container-x pb-[clamp(96px,14vh,160px)]" onPointerMove={onMove}>
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
            <li key={p.slug} onPointerEnter={(e) => onEnter(p, e)} onPointerLeave={onLeave}>
              <Link href={`/work/${p.slug}`} className={`${cls} hover:text-accent`}>
                {row}
              </Link>
            </li>
          );
        })}
      </ul>
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative cursor follower */}
      <img
        ref={imgRef}
        alt=""
        aria-hidden
        className="media pointer-events-none fixed top-0 left-0 z-40 -mt-[100px] -ml-[160px] w-80 opacity-0 max-sm:hidden"
        style={{ aspectRatio: "16 / 10", objectFit: "cover" }}
      />
    </div>
  );
}
