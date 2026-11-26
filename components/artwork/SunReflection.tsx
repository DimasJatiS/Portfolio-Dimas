/**
 * The sun's reflection on the sea (after the sunset sketches in Sunsets/): a solid column of
 * thick, overlapping horizontal bands right under the disc, as wide as the sun at the horizon,
 * with wavy broken edges, narrowing towards the viewer and ending short (0.3 sun widths).
 * 100 viewBox units = the sun's width. `skip` cuts off the top and `max` caps the height, so one
 * shape can be split across two boxes (hairline band, then Contact) and still line up.
 */
const BANDS: [number, number][] = [
  [3, 97],
  [10, 92],
  [5, 86],
  [16, 93],
  [12, 80],
  [24, 87],
  [20, 72],
  [32, 76],
  [38, 62],
];
const T = 4; // band thickness; bands step by 0.8T, so neighbours overlap into one shape
const H = T + (BANDS.length - 1) * T * 0.8;

/** Height of the whole reflection for a given sun width (a CSS length). */
export const reflectionHeight = (sun: string) => `calc(${sun} * ${H / 100})`;

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
        height: `max(0px, min(${max}, calc(${reflectionHeight(sun)} - ${skip})))`,
      }}
    >
      <svg
        viewBox={`0 0 100 ${H}`}
        className="absolute left-0 w-full text-accent"
        style={{ top: `calc(-1 * ${skip})` }}
      >
        <g stroke="currentColor" strokeWidth={T} strokeLinecap="round">
          {BANDS.map(([x1, x2], i) => (
            <line
              key={i}
              x1={x1}
              x2={x2}
              y1={T / 2 + i * T * 0.8}
              y2={T / 2 + i * T * 0.8}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
