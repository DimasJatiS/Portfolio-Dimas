/** M-10: total travel of a `[data-speed]` layer; y runs from -d/2 to +d/2 across its section. */
export function parallaxDistance(speed: number, sectionHeight: number, viewportHeight: number, mobile: boolean) {
  return (1 - speed) * Math.min(sectionHeight, viewportHeight) * (mobile ? 0.5 : 1);
}

/** M-13: per-tile end scale. The centre tile fills the viewport; the rest overshoot so they leave the frame. */
export function zoomScales(count: number, centre: number, fillScale: number) {
  const spread = [5, 7, 6, 9, 8, 5.5, 7.5, 6.5, 8.5];
  return Array.from({ length: count }, (_, i) => (i === centre ? fillScale : Math.max(fillScale + 1, spread[i % spread.length]!)));
}

/** Kinetic text: how strongly a letter `distance` px from the pointer is pulled, 1 under it, 0 at `radius` and beyond (smooth falloff). */
export function kineticPull(distance: number, radius: number) {
  const t = Math.max(0, 1 - distance / radius);
  return t * t * (3 - 2 * t);
}
