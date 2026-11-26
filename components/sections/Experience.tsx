"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { Section } from "@/components/ui/Section";
import { Link } from "@/i18n/navigation";
import type { Activity } from "@/lib/content/types";
import { gsap, getTier, SCRUB, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";

type Props = { label: string; items: Activity[] };

/**
 * Timeline (max. 6) as an accordion on one straight line: a bronze progress bar and dot follow the
 * scroll (M-28); one row is open at a time and slides open (grid-rows 0fr → 1fr, no library).
 * Photos in a panel load on its first open. On fine pointers the cursor becomes a disc that
 * inverts the colours under it.
 */
export function Experience({ label, items }: Props) {
  const t = useTranslations("activity");
  const uid = useId();
  const ref = useRef<HTMLOListElement>(null);
  const [open, setOpen] = useState<string | null>(items[0]?.slug ?? null);
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set(items[0] ? [items[0].slug] : []));
  const mounted = useRef(false);

  const toggle = (slug: string) => {
    const next = open === slug ? null : slug;
    setOpen(next);
    if (next && !seen.has(next)) setSeen(new Set(seen).add(next));
  };

  // Opening a row changes the page height: re-measure every ScrollTrigger once the slide has ended.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const id = setTimeout(() => ScrollTrigger.refresh(), getTier() === "still" ? 0 : 550);
    return () => clearTimeout(id);
  }, [open]);

  useGSAP(
    () => {
      const list = ref.current!;
      const col = list.querySelector<HTMLElement>("[data-path-col]")!;
      // --h (column height) is re-read on every refresh, so the dot's translate stays in pixels.
      const measure = () => col.style.setProperty("--h", `${col.offsetHeight}px`);
      measure();
      ScrollTrigger.addEventListener("refresh", measure);
      if (getTier() === "still") gsap.set(col, { "--p": 1 });
      else
        gsap.fromTo(
          col,
          { "--p": 0 },
          { "--p": 1, ease: "none", scrollTrigger: { trigger: list, start: "top 70%", end: "bottom 70%", scrub: SCRUB } },
        );
      return () => ScrollTrigger.removeEventListener("refresh", measure);
    },
    { scope: ref },
  );

  // Inverting cursor disc: follows the pointer inside the list, grows over linked rows.
  useGSAP(
    () => {
      if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
      const list = ref.current!;
      const disc = list.querySelector<HTMLElement>("[data-disc]")!;
      const d = getTier() === "still" ? 0.01 : 0.35;
      gsap.set(disc, { xPercent: -50, yPercent: -50, scale: 0 });
      const qx = gsap.quickTo(disc, "x", { duration: d, ease: "power3" });
      const qy = gsap.quickTo(disc, "y", { duration: d, ease: "power3" });
      let on = false;
      const show = (next: boolean) => {
        if (next === on) return;
        on = next;
        gsap.to(disc, { scale: next ? 1 : 0, duration: d, ease: "power3.out", overwrite: "auto" });
      };
      const move = (e: PointerEvent) => {
        const r = list.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        const hit = Boolean((e.target as Element).closest("[data-row]"));
        // Entering a row: start at the pointer instead of flying in from the last spot.
        if (hit && !on) {
          qx(x, x);
          qy(y, y);
        } else {
          qx(x);
          qy(y);
        }
        show(hit);
      };
      const leave = () => show(false);
      list.addEventListener("pointermove", move);
      list.addEventListener("pointerleave", leave);
      return () => {
        list.removeEventListener("pointermove", move);
        list.removeEventListener("pointerleave", leave);
      };
    },
    { scope: ref },
  );

  const period = (a: Activity) => [a.startYear, a.endYear && a.endYear !== a.startYear ? a.endYear : undefined].filter(Boolean).join(" — ");

  return (
    <Section id="experience" tone="base" panel label={label}>
      <ol ref={ref} className="container-x relative grid grid-cols-[40px_1fr] pt-12 pb-[clamp(96px,14vh,160px)] lg:grid-cols-12">
        <li
          aria-hidden
          data-path-col
          className="pointer-events-none absolute inset-y-0 left-[var(--gutter)] w-10 [--p:0] lg:left-[calc(var(--gutter)+(100%-2*var(--gutter))*2/12)] lg:w-[calc((100%-2*var(--gutter))/12)]"
        >
          <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-line" />
          <span className="absolute inset-y-0 left-1/2 w-px origin-top -translate-x-1/2 scale-y-[var(--p)] bg-accent" />
          <span className="absolute top-0 left-1/2 size-2.5 -translate-x-1/2 translate-y-[calc(var(--p)*var(--h,0px)-50%)] rounded-full bg-accent" />
        </li>
        <li aria-hidden data-disc className="pointer-events-none absolute top-0 left-0 z-10 hidden size-32 rounded-full bg-white mix-blend-difference [@media(hover:hover)_and_(pointer:fine)]:block" />
        {items.map((a) => {
          const isOpen = open === a.slug;
          const btn = `${uid}-${a.slug}-btn`;
          const panel = `${uid}-${a.slug}-panel`;
          const photos = [a.cover, ...a.gallery].filter((img) => img !== undefined).slice(0, 3);
          return (
            <li key={a.slug} data-row className="relative col-span-full grid grid-cols-subgrid border-t border-line py-8 [@media(hover:hover)_and_(pointer:fine)]:cursor-none">
              <p className="label col-start-2 text-accent lg:col-span-2 lg:col-start-1">{period(a)}</p>
              <span
                className={`col-start-1 row-start-1 mt-1.5 size-2 justify-self-center rounded-full transition-colors lg:col-start-3 lg:row-start-auto ${isOpen ? "bg-accent" : "bg-fg"}`}
              />
              <div className="col-start-2 lg:col-span-7 lg:col-start-4">
                <h3>
                  {/* The button's ::before covers the whole row, so the row is one click target. */}
                  <button
                    type="button"
                    id={btn}
                    aria-expanded={isOpen}
                    aria-controls={panel}
                    onClick={() => toggle(a.slug)}
                    className="flex w-full items-start justify-between gap-6 text-left before:absolute before:inset-0 before:content-[''] [@media(hover:hover)_and_(pointer:fine)]:cursor-none"
                  >
                    <span>
                      <span className="block text-[clamp(20px,2vw,28px)] leading-snug font-medium">{a.title}</span>
                      {a.org && <span className="label mt-1 block text-muted">{a.org}</span>}
                    </span>
                    <svg viewBox="0 0 24 24" aria-hidden className={`mt-2 size-5 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-accent" : "text-muted"}`}>
                      <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </h3>
                <div
                  id={panel}
                  role="region"
                  aria-labelledby={btn}
                  inert={!isOpen}
                  data-open={isOpen || undefined}
                  className="relative z-10 grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-[var(--ease-out)] data-[open]:grid-rows-[1fr] in-data-[motion=still]:duration-0"
                >
                  <div className="overflow-hidden">
                    <div className="pt-4">
                      {a.summary && <p className="max-w-[60ch] text-muted">{a.summary}</p>}
                      {seen.has(a.slug) && photos.length > 0 && (
                        <ul className="mt-5 grid max-w-[504px] grid-cols-3 gap-3">
                          {photos.map((img) => (
                            <li key={img.src} className="media relative aspect-[4/3] overflow-hidden rounded-lg">
                              <Image src={img.src} alt={img.alt} fill sizes="(min-width: 640px) 160px, 30vw" className="object-cover grayscale transition-[filter] duration-500 hover:grayscale-0" />
                            </li>
                          ))}
                        </ul>
                      )}
                      {a.hasDetail && (
                        <Link href={`/activities/${a.slug}`} className="pill pill-ghost mt-5 min-h-11 font-semibold">
                          {t("more")} →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
