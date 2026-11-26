"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Glyph } from "@/components/artwork/Glyph";
import { Link, useRouter } from "@/i18n/navigation";
import type { GlyphId } from "@/lib/content/types";
import { gsap, getTier, SCRUB, useGSAP } from "@/lib/motion/gsap";

/** One stop of the site-wide sequence (lib/content/sequence.ts). */
export type RelatedItem = { key: string; href: string; title: string; label: string; glyph: GlyphId };

/** Animated glyph tile: no photos in this strip, so it costs no image requests. */
function Media({ item, active = false, zoom = false }: { item: RelatedItem; active?: boolean; zoom?: boolean }) {
  return (
    <span className="grid size-full place-items-center bg-[color-mix(in_srgb,var(--fg)_6%,var(--surface))]">
      <Glyph glyph={item.glyph} animate variant="halftone" className={`${zoom ? "size-[min(40vh,50vw)]" : "size-1/2"} ${active ? "text-fg" : "text-muted"}`} />
    </span>
  );
}

/**
 * W-05…W-07 (Jetton-style next project): a sticky strip of related cards. Scrolling through the
 * track grows the selected (centre) card to the full frame, and when the zoom finishes the visitor
 * lands on that page. Any card can be selected first (click, or swipe on touch). The order is one
 * pass (projects → activities → Contact on Home), so the strip never wraps.
 */
export function Related({ items, start }: { items: RelatedItem[]; start: number }) {
  const t = useTranslations("case");
  const router = useRouter();
  const ref = useRef<HTMLElement>(null);
  const [sel, setSel] = useState(start);
  const selRef = useRef(sel);
  const swipe = useRef<{ x: number; moved: boolean }>({ x: 0, moved: false });
  const current = items[sel]!;
  const { href, label } = current;

  useEffect(() => {
    selRef.current = sel;
    router.prefetch(href);
  }, [sel, href, router]);

  useGSAP(
    () => {
      if (getTier() === "still") return;
      const root = ref.current!;
      const frame = root.querySelector<HTMLElement>("[data-frame]")!;
      const wrap = root.querySelector<HTMLElement>("[data-strip]")!;
      const zoom = root.querySelector<HTMLElement>("[data-zoom]")!;

      // The selected card always ends centred, so its rect is known without measuring it mid-move.
      const measure = () => {
        const f = frame.getBoundingClientRect();
        const w = wrap.getBoundingClientRect();
        const card = wrap.querySelector<HTMLElement>("[data-card]")!.offsetWidth;
        zoom.style.setProperty("--t", `${w.top - f.top}px`);
        zoom.style.setProperty("--b", `${f.bottom - w.bottom}px`);
        zoom.style.setProperty("--s", `${(f.width - card) / 2}px`);
      };

      // Armed only after the visitor has been above the end, so a reload at the bottom never redirects.
      let armed = false;
      let gone = false;
      const state = { p: 0 };
      const tl = gsap.timeline({
        scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: SCRUB, onRefresh: measure },
      });
      tl.to(state, {
        p: 1,
        ease: "power1.in",
        duration: 1,
        onUpdate: () => {
          zoom.style.setProperty("--p", String(state.p));
          zoom.style.visibility = state.p > 0.001 ? "visible" : "hidden";
          if (state.p < 0.9) armed = true;
          if (armed && !gone && state.p > 0.995) {
            gone = true;
            router.push(items[selRef.current]!.href);
          }
        },
      }).to(root.querySelectorAll("[data-fade]"), { opacity: 0, y: -24, ease: "none", duration: 0.5 }, 0);
      measure();
    },
    { scope: ref, dependencies: [items] },
  );

  const choose = (i: number) => {
    if (swipe.current.moved) return;
    if (i === sel) router.push(href);
    else setSel(i);
  };

  return (
    <section ref={ref} data-tone="base" aria-label={label} className="track track-related bg-surface text-fg">
      <div data-frame className="sticky-frame flex flex-col items-center justify-center gap-6 pt-[var(--header-h)]">
        <div data-fade className="container-x text-center">
          <p className="label text-muted">{label}</p>
          <p aria-live="polite" className="display mt-4 text-[clamp(44px,9vw,140px)]">
            {current.title}
          </p>
          <p className="label mt-4">
            <span className="text-accent">{t("keep")}</span> <span className="text-muted">{t("scrolling")}</span>
          </p>
        </div>

        <div
          data-strip
          data-fade
          className="relative h-[calc(var(--w)*1.25)] w-full touch-pan-y [--gap:20px] [--w:min(56vw,280px)] sm:[--w:clamp(200px,20vw,300px)]"
          onPointerDown={(e) => (swipe.current = { x: e.clientX, moved: false })}
          onPointerUp={(e) => {
            const dx = e.clientX - swipe.current.x;
            if (Math.abs(dx) < 40) return;
            swipe.current.moved = true;
            setSel((s) => Math.min(items.length - 1, Math.max(0, s + (dx < 0 ? 1 : -1))));
            setTimeout(() => (swipe.current.moved = false));
          }}
        >
          <ul
            className="absolute top-0 left-1/2 flex gap-[var(--gap)] transition-transform duration-700 ease-[var(--ease-out)]"
            style={{ transform: `translateX(calc(-1 * (${sel} * (var(--w) + var(--gap)) + var(--w) / 2)))` }}
          >
            {items.map((item, i) => (
              <li key={item.key}>
                <button
                  type="button"
                  data-card={item.key}
                  aria-pressed={i === sel}
                  aria-label={i === sel ? t("open", { title: item.title }) : item.title}
                  onClick={() => choose(i)}
                  className={`media relative block aspect-[4/5] w-[var(--w)] overflow-hidden rounded-xl transition-[opacity,outline-color] duration-500 ${
                    i === sel ? "outline outline-1 outline-offset-[6px] outline-accent" : "opacity-50 outline-transparent hover:opacity-80"
                  }`}
                >
                  <Media item={item} active={i === sel} />
                  <span className="label absolute top-3 left-3 text-left text-[13px] text-white mix-blend-difference">{item.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div data-fade className="label flex flex-col items-center gap-3 text-center text-muted">
          <span>← {t("choose")} →</span>
          <Link href={href} className="link-underline text-fg">
            {t("open", { title: current.title })} →
          </Link>
        </div>

        {/* The growing frame: clip-path from the centred card's rect (--t/--s/--b) to the whole frame. */}
        <div
          data-zoom
          aria-hidden
          className="pointer-events-none invisible absolute inset-0 overflow-hidden [--p:0] [clip-path:inset(calc(var(--t)*(1-var(--p)))_calc(var(--s)*(1-var(--p)))_calc(var(--b)*(1-var(--p)))_calc(var(--s)*(1-var(--p)))_round_calc(12px*(1-var(--p))))]"
        >
          <Media item={current} active zoom />
        </div>
      </div>
    </section>
  );
}
