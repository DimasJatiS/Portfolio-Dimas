"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Accent } from "@/components/ui/Accent";
import { KineticText } from "@/components/ui/kinetic-text";
import { heroState } from "@/lib/motion/heroState";
import {
  gsap,
  getTier,
  SCRUB,
  ScrollTrigger,
  useGSAP,
} from "@/lib/motion/gsap";

const HeroShader = dynamic(() => import("@/components/canvas/HeroShader"), {
  ssr: false,
});

// Spek 2.2: heights from the bottom (% of 100svh) and how far each column drops in the zoom (M-06).
const COLUMNS = [
  { h: 62, drop: 100 },
  { h: 52, drop: 80 },
  { h: 40, drop: 60 },
  { h: 26, drop: 40 },
  { h: 40, drop: 60 },
  { h: 52, drop: 80 },
  { h: 62, drop: 100 },
];
const COLUMNS_SM = [
  { h: 62, drop: 100 },
  { h: 44, drop: 70 },
  { h: 26, drop: 40 },
  { h: 44, drop: 70 },
  { h: 62, drop: 100 },
];
// Three glint loops at most (Motion & Artwork §3); the rest are static glints.
const LOOPING = new Set([0, 3, 5]);

type Props = {
  label: string;
  statement: string;
  cvUrl?: string;
};

export function Hero({ label, statement, cvUrl }: Props) {
  const t = useTranslations("hero");
  const ref = useRef<HTMLElement>(null);
  const [shader, setShader] = useState<"off" | "on" | "failed">("off");

  useGSAP(
    () => {
      const section = ref.current!;
      const q = gsap.utils.selector(section);
      const tier = getTier();

      // M-01 / M-02: once, time-based, after the display font is ready.
      if (tier !== "still") {
        document.fonts.ready.then(() => {
          gsap.set(q("[data-hero-reveal]"), { opacity: 1, animation: "none" });
          gsap.from(q("[data-hero-name] [data-char]"), {
            opacity: 0,
            filter: "blur(12px)",
            yPercent: 20,
            stagger: 0.04,
            duration: 0.9,
            clearProps: "filter",
          });
          gsap.from(q("[data-hero-item]"), {
            opacity: 0,
            y: 16,
            stagger: 0.08,
            duration: 0.7,
            delay: 0.3,
          });
        });
      }

      // Pause the shader and the glint loops while the hero is off-screen.
      ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => {
          heroState.visible = self.isActive;
          section.toggleAttribute("data-offscreen", !self.isActive);
        },
      });
      if (tier === "still") return;

      // M-05…M-08: hero zoom.
      const tl = gsap.timeline({
        defaults: { ease: "none", duration: 1 },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: SCRUB,
        },
      });
      q("[data-col]").forEach((col) =>
        tl.to(col, { yPercent: Number((col as HTMLElement).dataset.col) }, 0),
      );
      tl.to(
        q("[data-hero-text]"),
        { y: () => -0.3 * window.innerHeight, opacity: 0, duration: 0.5 },
        0,
      );
      if (tier === "full") tl.to(heroState, { zoom: 1 }, 0);
      tl.fromTo(q("[data-core]"), { scale: 1 }, { scale: 16 }, 0);

      if (tier === "full") {
        const onMove = (e: PointerEvent) => {
          heroState.target.x = e.clientX / window.innerWidth;
          heroState.target.y = Math.min(
            0.6,
            1 - e.clientY / window.innerHeight,
          );
        };
        window.addEventListener("pointermove", onMove, { passive: true });
        // Load three.js only after the page is idle, so it never competes with LCP (M-03).
        const start = () =>
          "requestIdleCallback" in window
            ? requestIdleCallback(() => setShader("on"))
            : setTimeout(() => setShader("on"), 300);
        if (document.readyState === "complete") start();
        else window.addEventListener("load", start, { once: true });
        return () => window.removeEventListener("pointermove", onMove);
      }
    },
    { scope: ref },
  );

  const columns = (cols: typeof COLUMNS, className: string) => (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
    >
      {cols.map((c, i) => (
        <div
          key={i}
          data-col={c.drop}
          className="absolute bottom-0 border-t border-[color-mix(in_srgb,var(--fg)_30%,transparent)] bg-surface"
          style={{
            left: `${(i * 100) / cols.length}%`,
            width: `calc(${100 / cols.length}% + 1px)`,
            height: `${c.h}svh`,
          }}
        >
          <span
            className="glint"
            data-loop={LOOPING.has(i) ? "" : undefined}
            style={{
              ["--glint-d" as string]: `${6 + ((i * 7) % 5)}s`,
              ["--glint-x" as string]: `calc(${100 / cols.length}vw - 80px)`,
              left: LOOPING.has(i) ? 0 : "35%",
            }}
          />
        </div>
      ))}
    </div>
  );

  return (
    <section
      ref={ref}
      id="top"
      data-tone="base"
      aria-labelledby="hero-name"
      className="hero track track-hero bg-surface"
    >
      <div className="sticky-frame">
        {/* Back layer: static frame (lite/still/no WebGL), CSS core (lite), shader (full). */}
        <div aria-hidden className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- decorative, sized by CSS, both themes ship */}
          <img
            src="/hero-fallback-dark.avif"
            alt=""
            className="absolute inset-0 size-full object-cover in-data-[theme=day]:hidden"
            fetchPriority="low"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-fallback-light.avif"
            alt=""
            className="absolute inset-0 hidden size-full object-cover in-data-[theme=day]:block"
            fetchPriority="low"
          />
          <div
            data-core
            className="absolute bottom-[calc(26svh-9vmax)] left-1/2 -ml-[9vmax] size-[18vmax] rounded-full bg-[radial-gradient(circle,var(--accent)_0%,color-mix(in_srgb,var(--accent)_45%,transparent)_35%,transparent_70%)] in-data-[motion=still]:hidden"
          />
          {shader === "on" && (
            <HeroShader onFallback={() => setShader("failed")} />
          )}
        </div>

        {columns(COLUMNS, "hidden sm:block")}
        {columns(COLUMNS_SM, "sm:hidden")}

        <div
          data-hero-text
          className="container-x relative flex flex-col items-center pt-[max(18svh,120px)] text-center"
        >
          {label && (
            <p data-hero-reveal data-hero-item className="label text-accent">
              {label}
            </p>
          )}
          <h1
            id="hero-name"
            data-hero-reveal
            data-hero-name
            className="display font-[family-name:var(--font-playfair)] mt-5 max-w-[6em] text-[clamp(40px,18vw,80px)] tracking-[-0.01em] text-wrap sm:max-w-none sm:text-[clamp(44px,8.6vw,140px)] sm:whitespace-nowrap"
          >
            {/* Phones: 6em fits "Dimas Jati" (~4.4em) but not the whole name, so "Satria" drops to line 2. sm+ (iPad up): one line. */}
            <KineticText>Dimas Jati Satria</KineticText>
          </h1>
          <p
            data-hero-reveal
            data-hero-item
            className="mt-6 max-w-[34ch] text-[clamp(18px,1.6vw,24px)] leading-snug text-balance"
          >
            <Accent text={statement} />
          </p>
          <div
            data-hero-reveal
            data-hero-item
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <a href="#work" className="pill pill-accent">
              {t("viewWork")}
            </a>
            {cvUrl && (
              <a href="/cv.pdf" className="pill pill-ghost" data-track="cv">
                {t("downloadCv")} <span aria-hidden>↓</span>
              </a>
            )}
          </div>
        </div>

        <div
          data-hero-text
          className="label container-x absolute inset-x-0 bottom-6 flex items-center justify-end text-muted"
        >
          <span aria-hidden className="hidden sm:inline">
            {t("scroll")} ↓
          </span>
        </div>
      </div>
    </section>
  );
}
