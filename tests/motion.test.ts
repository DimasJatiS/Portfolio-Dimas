import { describe, expect, it } from "vitest";
import { kineticPull, parallaxDistance, zoomScales } from "@/lib/motion/parallax";
import { detectTier } from "@/lib/motion/tier";

const desktop = { reducedMotion: false, coarsePointer: false, cores: 8, memory: 8 };

describe("detectTier (Motion & Artwork §2)", () => {
  it("full on a capable desktop", () => expect(detectTier(desktop)).toBe("full"));
  it("still when reduced motion is requested, even on a capable desktop", () =>
    expect(detectTier({ ...desktop, reducedMotion: true })).toBe("still"));
  it.each([
    { coarsePointer: true },
    { cores: 4 },
    { memory: 4 },
    { saveData: true },
  ])("lite for %o", (signal) => expect(detectTier({ ...desktop, ...signal })).toBe("lite"));
  it("honours ?motion= overrides and ignores junk", () => {
    expect(detectTier({ ...desktop, reducedMotion: true, override: "full" })).toBe("full");
    expect(detectTier({ ...desktop, override: "turbo" })).toBe("full");
  });
});

describe("parallaxDistance (M-10)", () => {
  it("is capped by the viewport height", () => expect(parallaxDistance(0.7, 3000, 900, false)).toBeCloseTo(270));
  it("uses the section height when it is shorter", () => expect(parallaxDistance(0.7, 500, 900, false)).toBeCloseTo(150));
  it("is halved on mobile and negative for foreground layers", () => expect(parallaxDistance(1.2, 900, 900, true)).toBeCloseTo(-90));
  it("is zero for content (speed 1)", () => expect(parallaxDistance(1, 900, 900, false)).toBe(0));
});

describe("zoomScales (M-13)", () => {
  it("centre fills, every other tile overshoots it", () => {
    const s = zoomScales(7, 4, 3.2);
    expect(s[4]).toBe(3.2);
    s.forEach((v, i) => i !== 4 && expect(v).toBeGreaterThan(3.2));
  });
});

describe("kineticPull", () => {
  it("is 1 under the pointer, 0 at the radius and beyond, and falls off in between", () => {
    expect(kineticPull(0, 160)).toBe(1);
    expect(kineticPull(160, 160)).toBe(0);
    expect(kineticPull(400, 160)).toBe(0);
    expect(kineticPull(40, 160)).toBeGreaterThan(kineticPull(120, 160));
  });
});
