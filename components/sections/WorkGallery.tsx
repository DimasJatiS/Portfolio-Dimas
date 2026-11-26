"use client";

import Image from "next/image";
import { useRef } from "react";
import { Glyph } from "@/components/artwork/Glyph";
import type { GlyphId } from "@/lib/content/types";
import { zoomScales } from "@/lib/motion/parallax";
import { gsap, getTier, SCRUB, useGSAP } from "@/lib/motion/gsap";

export type GalleryTile = {
  kind: "cover" | "glyph";
  title: string;
  glyph: GlyphId;
  gray?: string;
};

// Mobile shows 5 of the 7 slots (Spek 2.4): the two top corners drop out, the centre spans the row.
const SLOT_CLASS = [
  "max-sm:hidden",
  "",
  "max-sm:hidden",
  "",
  "z-10 max-sm:col-span-2",
  "",
  "sm:col-span-3",
];
const CENTRE = 4;

export function WorkGallery({ tiles }: { tiles: GalleryTile[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tier = getTier();
      if (tier === "still" || tiles.length === 0) return;
      const q = gsap.utils.selector(ref);
      const grid = q("[data-grid]")[0] as HTMLElement;
      const els = q("[data-tile]") as HTMLElement[];
      const centre = els[CENTRE]!;
      // Measured on refresh only (never inside the ticker).
      const fill = () =>
        Math.max(
          window.innerWidth / centre.offsetWidth,
          window.innerHeight / centre.offsetHeight,
        ) * 1.02;
      const cx = () => centre.offsetLeft + centre.offsetWidth / 2;
      const cy = () => centre.offsetTop + centre.offsetHeight / 2;

      const tl = gsap.timeline({
        defaults: { ease: "none", duration: 1 },
        scrollTrigger: {
          trigger: ref.current,
          start: "top top",
          end: "bottom bottom",
          scrub: SCRUB,
          invalidateOnRefresh: true,
          // GPU layers only while the zoom is running (≤ 12, Motion & Artwork §3).
          onToggle: (self) =>
            els.forEach(
              (el) => (el.style.willChange = self.isActive ? "transform" : ""),
            ),
        },
      });
      els.forEach((el, i) => {
        tl.fromTo(
          el,
          {
            scale: 1,
            transformOrigin: () =>
              `${cx() - el.offsetLeft}px ${cy() - el.offsetTop}px`,
          },
          { scale: () => zoomScales(els.length, CENTRE, fill())[i]! },
          0,
        );
      });
      // Bring the centre tile's middle to the middle of the viewport while it grows.
      tl.fromTo(
        grid,
        { x: 0, y: 0 },
        {
          x: () => window.innerWidth / 2 - grid.offsetLeft - cx(),
          y: () => window.innerHeight / 2 - grid.offsetTop - cy(),
        },
        0,
      );
      tl.fromTo(
        q("[data-centre-title]"),
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.2 },
        0.8,
      );
    },
    { scope: ref, dependencies: [tiles.length] },
  );

  if (tiles.length === 0) return null;
  const centreTile = tiles[CENTRE];

  return (
    <div ref={ref} className="track track-gallery">
      <div className="sticky-frame">
        <div
          data-grid
          className="container-x grid h-full grid-cols-2 grid-rows-3 gap-3 pt-[calc(var(--header-h)+24px)] pb-6 sm:grid-cols-3"
        >
          {tiles.map((tile, i) => (
            <div
              key={i}
              data-tile
              aria-hidden
              className={`media relative bg-[color-mix(in_srgb,var(--fg)_7%,var(--surface))] ${SLOT_CLASS[i] ?? ""}`}
            >
              {tile.kind === "cover" && tile.gray ? (
                // Grayscale is baked into the file (no CSS filter on a tile scaled up to 9×). The centre grows to
                // the full screen, so it is requested at 100vw; neighbours are visible at 2–3× mid-zoom.
                <Image src={tile.gray} alt="" fill sizes={i === CENTRE ? "min(100vw, 2560px)" : "(min-width: 640px) 50vw, 100vw"} className="object-cover" />
              ) : (
                <div className="grid size-full place-items-center text-muted">
                  <Glyph
                    glyph={tile.glyph}
                    variant="halftone"
                    animate
                    className="h-[55%] max-h-40"
                  />
                </div>
              )}
              <span className="label absolute top-3 left-3 rounded-full bg-surface/70 px-2 py-1 text-fg">
                {tile.title}
              </span>
            </div>
          ))}
        </div>
        {centreTile && (
          <div
            data-centre-title
            aria-hidden
            className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent pt-32 pb-8 opacity-0 in-data-[motion=still]:hidden"
          >
            <p className="display container-x text-[clamp(48px,9vw,160px)] text-[#f5f5f2]">
              {centreTile.title}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
