"use client";

import { useRef } from "react";
import { gsap, getTier, useGSAP } from "@/lib/motion/gsap";
import { kineticPull } from "@/lib/motion/parallax";

const RADIUS = 160;

/**
 * Text whose letters rise and stretch toward the pointer. Each letter is a `[data-char]`
 * span, so an entrance animation can target them too. Screen readers get the plain text; still tier and touch get no effect.
 */
export function KineticText({ children, className = "" }: { children: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      if (getTier() === "still" || !matchMedia("(hover: hover)").matches) return;
      const root = ref.current!;
      const chars = gsap.utils.toArray<HTMLElement>("[data-char]", root);
      const onMove = (e: PointerEvent) => {
        for (const c of chars) {
          const r = c.getBoundingClientRect();
          const k = kineticPull(Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)), RADIUS);
          gsap.to(c, { yPercent: -18 * k, scaleY: 1 + 0.22 * k, duration: 0.45, ease: "power3.out", overwrite: "auto" });
        }
      };
      const onLeave = () => {
        gsap.to(chars, { yPercent: 0, scaleY: 1, duration: 0.8, ease: "elastic.out(1, 0.45)", overwrite: "auto" });
      };

      root.addEventListener("pointermove", onMove);
      root.addEventListener("pointerleave", onLeave);
      return () => {
        root.removeEventListener("pointermove", onMove);
        root.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope: ref },
  );

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{children}</span>
      <span aria-hidden>
        {children.split(" ").map((word, w) => (
          <span key={w}>
            {w > 0 && " "}
            <span className="inline-block whitespace-nowrap">
              {[...word].map((ch, i) => (
                <span key={i} data-char className="inline-block origin-bottom will-change-transform">
                  {ch}
                </span>
              ))}
            </span>
          </span>
        ))}
      </span>
    </span>
  );
}
