/**
 * The sun's reflection on the sea (after the sunset sketches in Sunsets/): thin, unbroken
 * horizontal lines stacked under the disc, as wide as the sun at the horizon, with wavy edges,
 * narrowing towards the viewer. It is `--refl-h` tall (globals.css): it ends just above the
 * contact form's Company field. `skip` cuts off the top and `max` caps the height, so one shape
 * splits across two boxes (hairline band, then behind the form) and still lines up.
 */
const N = 22;
const LINES = Array.from({ length: N }, (_, i) => {
  const t = i / (N - 1);
  const half = 50 * (1 - 0.62 * t); // 100 units = the sun's width
  return {
    y: ((i + 0.5) / N) * 100,
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
        className="absolute left-0 h-[var(--refl-h)] w-full text-accent"
        style={{ top: `calc(-1 * ${skip})` }}
      >
        <g stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
          {LINES.map((l, i) => (
            <line
              key={i}
              x1={l.x1}
              x2={l.x2}
              y1={l.y}
              y2={l.y}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
