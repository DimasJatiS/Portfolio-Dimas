/**
 * The sun's reflection on the sea (after the sunset sketches in Sunsets/): unbroken horizontal
 * lines stacked under the disc, as wide as the sun at the horizon, with wavy edges, narrowing
 * towards the viewer. They run thick to thin, fading to nothing at the bottom; a slow light sweeps
 * left and right across them (`.refl-shine`, globals.css). The shape is `--refl-h` tall. `skip`
 * cuts off the top and `max` caps the height, so one shape splits across two boxes (hairline band,
 * then behind the form) and still lines up.
 */
const N = 30;
const LINES = Array.from({ length: N }, (_, i) => {
  const t = i / (N - 1);
  const half = 50 * (1 - 0.7 * t); // 100 units = the sun's width
  return {
    y: ((i + 0.5) / N) * 100,
    w: +(0.3 + 4.2 * (1 - t) ** 1.4).toFixed(2), // px: 4.5 at the horizon, 0.3 at the end
    o: +(1 - t ** 1.6).toFixed(2), // 1 to 0, so the last line vanishes
    x1: +(50 - half + 5 * Math.sin(i * 2.3) + 2).toFixed(1),
    x2: +(50 + half + 5 * Math.sin(i * 1.7 + 1) - 2).toFixed(1),
  };
});

export function SunReflection({
  sun,
  skip = "0px",
  max = "100vh",
}: {
  sun: string;
  skip?: string;
  max?: string;
}) {
  return (
    <div
      aria-hidden
      className="relative mx-auto overflow-hidden"
      style={{
        width: sun,
        height: `max(0px, min(${max}, calc(var(--refl-h) - ${skip})))`,
      }}
    >
      {/* Stretched to --refl-h; strokes keep their px width. */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="refl-shine absolute left-0 h-[var(--refl-h)] w-full text-accent"
        style={{ top: `calc(-1 * ${skip})` }}
      >
        <g stroke="currentColor" strokeLinecap="round">
          {LINES.map((l, i) => (
            <line
              key={i}
              x1={l.x1}
              x2={l.x2}
              y1={l.y}
              y2={l.y}
              strokeWidth={l.w}
              strokeOpacity={l.o}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
