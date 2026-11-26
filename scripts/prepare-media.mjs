// Builds every generated asset once (run `pnpm media`); outputs are committed:
// - public/projects/<slug>/: cover.<hash>.jpg (grayscale, for the zoom gallery), cover-color.<hash>.jpg, gallery-N.<hash>.jpg
// - lib/content/media.json: sizes for the seed content
// - public/grain.png: A6 grain tile (≤ 10 KB)
// - public/hero-fallback-{dark,light}.avif: still frame of the hero shader (lite/still tiers, 404)
// - components/artwork/contour-paths.json: A1 topographic contours (noise field + marching squares)
// Raw owner media lives in projects/ (not committed).
import { createHash } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = new URL("../", import.meta.url);
// Owner decision (2026-11-26): at most 8 gallery images per project/activity, listed explicitly.
const GALLERY_MAX = 8;
const COVER_W = 2560; // covers are scaled to full screen (retina) in the zoom gallery and case hero
const PHOTO_W = 1200; // gallery and activity photos
const MAX_BYTES = 300_000; // photos
const COVER_MAX_BYTES = 700_000; // HD covers; next/image serves them as AVIF/WebP at the size each page needs
const SOURCES = {
  tbxxpert: { dir: "tbxxpert", cover: "cover.png", gallery: ["tbxpert-1.jpeg", "tbxpert-2.jpeg", "tbxpert-3.jpeg", "tbxpert-4.jpeg"] },
  "ai-cv-screen": { dir: "ai-cv-screen", cover: "cover.png", gallery: [] },
  // 8 of 31: landing, sign-up, find developers, projects, admin, developer dashboard, chat, payment.
  inofa: { dir: "inofa", cover: "cover.png", gallery: [20, 11, 22, 14, 15, 30, 17, 27].map((n) => `inofa-${n}.jpeg`) },
  "bloomarie-store": { dir: "bloomarie-store", cover: "cover.png", gallery: ["featured.jpeg", "product.jpeg", "Whole page.jpeg"] },
  siakad: { dir: "siakad", cover: "cover.png", gallery: ["siakad-1.png", "siakad-2.png", "siakad-3.png"] },
  // Gallery = phone screenshots of a landscape video: `band` crops each to the lit band in the middle.
  shardfall: { dir: "shardfall-game", cover: "cover.jpeg", gallery: ["gameplay 1.jpeg", "gameplay 2.jpeg", "gameplay 3.jpeg"], band: true },
  // Full-screen macOS screenshots: `cropTop` drops the 50 px menu bar.
  chainfolio: { dir: "Chainfolio", cover: "Main.png", gallery: ["login.png", "Register.png"], cropTop: 50 },
};

/**
 * Writes `<dir>/<name>.<hash>.jpg` at the highest quality ≤ `q` that stays under `max` bytes (drops 6 per try,
 * floor 50). The file name carries a hash of its bytes, so a changed image is a new URL: neither the browser
 * nor next/image's cache (keyed by URL) can keep serving the old one. Returns the sharp info plus `name`.
 */
async function jpeg(img, dir, name, q, max = MAX_BYTES) {
  const tmp = fileURLToPath(new URL(`${name}.tmp.jpg`, dir));
  for (;;) {
    const info = await img.clone().jpeg({ quality: q, mozjpeg: true }).toFile(tmp);
    if (info.size <= max || q <= 50) {
      const hash = createHash("sha1").update(await readFile(tmp)).digest("hex").slice(0, 8);
      const file = `${name}.${hash}.jpg`;
      await rename(tmp, fileURLToPath(new URL(file, dir)));
      return { ...info, name: file };
    }
    q -= 6;
  }
}

/** Rows of a phone screenshot that hold the actual (landscape) picture: the tallest run of non-black rows, ignoring the status/control bars. */
async function contentBand(file) {
  const { data, info } = await sharp(file).greyscale().raw().toBuffer({ resolveWithObject: true });
  const lit = (y) => {
    let sum = 0;
    for (let x = 0; x < info.width; x++) sum += data[y * info.width + x];
    return sum / info.width > 12;
  };
  let best = { top: 0, height: info.height };
  let start = -1;
  for (let y = Math.round(info.height * 0.12); y <= Math.round(info.height * 0.88); y++) {
    if (lit(y) && start < 0) start = y;
    if ((!lit(y) || y === Math.round(info.height * 0.88)) && start >= 0) {
      if (y - start > (best.height === info.height ? 0 : best.height)) best = { top: start, height: y - start };
      start = -1;
    }
  }
  return { left: 0, top: best.top, width: info.width, height: best.height };
}

/** Opens a source image upright, minus `top` rows (menu bars). */
async function open(file, top = 0) {
  if (!top) return sharp(file).rotate();
  const { width, height } = await sharp(file).metadata();
  return sharp(file).extract({ left: 0, top, width, height: height - top });
}

const media = {};
for (const [slug, src] of Object.entries(SOURCES)) {
  const inDir = new URL(`projects/${src.dir}/`, root);
  const outDir = new URL(`public/projects/${slug}/`, root);
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  const cover = (await open(fileURLToPath(new URL(src.cover, inDir)), src.cropTop)).resize({ width: COVER_W, withoutEnlargement: true });
  // Gallery tiles are scaled up to 9×, so grayscale is baked into the file (no CSS filter).
  const gray = await jpeg(cover.clone().grayscale(), outDir, "cover", 80, COVER_MAX_BYTES);
  const color = await jpeg(cover, outDir, "cover-color", 82, COVER_MAX_BYTES);
  const entry = { cover: { src: `/projects/${slug}/${gray.name}`, color: `/projects/${slug}/${color.name}`, width: gray.width, height: gray.height }, gallery: [] };
  for (const [i, f] of src.gallery.slice(0, GALLERY_MAX).entries()) {
    const file = fileURLToPath(new URL(f, inDir));
    const img = (src.band ? sharp(file).extract(await contentBand(file)) : await open(file, src.cropTop)).resize({ width: PHOTO_W, withoutEnlargement: true });
    const info = await jpeg(img, outDir, `gallery-${i + 1}`, 76);
    entry.gallery.push({ src: `/projects/${slug}/${info.name}`, width: info.width, height: info.height });
  }
  media[slug] = entry;
}
await writeFile(new URL("lib/content/media.json", root), JSON.stringify(media, null, 2) + "\n");

// Activity photos (activities/, owner media) → public/activities/<slug>/photo-N(-gray).jpg, in this order.
const ACTIVITIES = {
  "pimnas-39": ["pimnas/WhatsApp Image 2026-11-18 at 9.25.28 PM (1).jpeg", "pimnas/WhatsApp Image 2026-11-18 at 9.25.28 PM.jpeg", "Foto/kandang-pimnas.jpeg", "Foto/Lab-pimnas.jpeg"],
  "gelex-ugm-2025": ["Foto/Medis-Gelex-1.jpeg", "Foto/Medis-Gelex-2.jpeg", "Foto/Medis-Gelex-3.jpeg"],
  "revogy-2026": ["Foto/IT-revogy.jpeg"],
  "sre-ugm": ["Foto/RnI-SRE.jpeg"],
};
const activityMedia = {};
await rm(new URL("public/activities/", root), { recursive: true, force: true });
for (const [slug, files] of Object.entries(ACTIVITIES)) {
  const outDir = new URL(`public/activities/${slug}/`, root);
  await mkdir(outDir, { recursive: true });
  activityMedia[slug] = [];
  for (const [i, f] of files.slice(0, GALLERY_MAX + 1).entries()) {
    const img = sharp(fileURLToPath(new URL(`activities/${f}`, root))).rotate().resize({ width: PHOTO_W, withoutEnlargement: true });
    const info = await jpeg(img, outDir, `photo-${i + 1}`, 76);
    const gray = await jpeg(img.clone().grayscale(), outDir, `photo-${i + 1}-gray`, 74);
    activityMedia[slug].push({ src: `/activities/${slug}/${info.name}`, gray: `/activities/${slug}/${gray.name}`, width: info.width, height: info.height });
  }
}
await writeFile(new URL("lib/content/activity-media.json", root), JSON.stringify(activityMedia, null, 2) + "\n");

// Deterministic PRNG so every run produces the same assets.
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

// A6 grain: gray noise, single channel.
const G = 72;
const noise = Buffer.alloc(G * G);
for (let i = 0; i < noise.length; i++) noise[i] = Math.round(rand() * 255);
await sharp(noise, { raw: { width: G, height: G, channels: 1 } }).png({ compressionLevel: 9, palette: false }).toFile(fileURLToPath(new URL("public/grain.png", root)));

// Hero fallback: blobs + bronze core at the valley floor, same palette as the shader (Spek §4).
const fallback = (bg, blob, blobA, core) => `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000">
  <defs><filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="70"/></filter></defs>
  <rect width="1600" height="1000" fill="${bg}"/>
  <g filter="url(#b)" fill="${blob}" fill-opacity="${blobA}">
    <circle cx="520" cy="420" r="190"/><circle cx="1080" cy="380" r="210"/><circle cx="800" cy="560" r="170"/><circle cx="300" cy="640" r="140"/>
  </g>
  <circle cx="800" cy="820" r="150" fill="${core}" filter="url(#b)"/>
</svg>`;
for (const [name, svg] of [
  ["dark", fallback("#0A0A0A", "#A3A3A3", 0.35, "#CD7F32")],
  ["light", fallback("#F5F5F2", "#5C5C5C", 0.25, "#9A6230")],
]) {
  await sharp(Buffer.from(svg)).avif({ quality: 40 }).toFile(fileURLToPath(new URL(`public/hero-fallback-${name}.avif`, root)));
}

// A1 contours: a smooth height field with one peak in the upper-right third, traced with marching squares.
const W = 1440, H = 900, step = 18, cols = W / step + 1, rows = H / step + 1;
const bumps = Array.from({ length: 9 }, () => ({ x: rand() * W, y: rand() * H, s: 120 + rand() * 220, a: (rand() - 0.5) * 0.9 }));
const field = (x, y) => {
  let v = Math.exp(-(((x - 980) / 420) ** 2 + ((y - 300) / 330) ** 2));
  for (const b of bumps) v += b.a * Math.exp(-(((x - b.x) / b.s) ** 2 + ((y - b.y) / b.s) ** 2));
  return v;
};
const grid = Array.from({ length: rows }, (_, j) => Array.from({ length: cols }, (_, i) => field(i * step, j * step)));
const lerp = (a, b, t) => a + (b - a) * t;
const levels = Array.from({ length: 13 }, (_, k) => 0.08 + k * 0.07);
const paths = [];
for (const level of levels) {
  const segs = [];
  for (let j = 0; j < rows - 1; j++)
    for (let i = 0; i < cols - 1; i++) {
      const c = [grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]];
      const p = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]].map(([x, y]) => [x * step, y * step]);
      const pts = [];
      for (let e = 0; e < 4; e++) {
        const a = c[e], b = c[(e + 1) % 4];
        if ((a < level) !== (b < level)) {
          const t = (level - a) / (b - a);
          pts.push([lerp(p[e][0], p[(e + 1) % 4][0], t), lerp(p[e][1], p[(e + 1) % 4][1], t)]);
        }
      }
      if (pts.length >= 2) segs.push([pts[0], pts[1]]);
      if (pts.length === 4) segs.push([pts[2], pts[3]]);
    }
  // Chain segments into polylines.
  const key = ([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`;
  const unused = new Set(segs.keys());
  const byPoint = new Map();
  segs.forEach((s, idx) => s.forEach((pt) => byPoint.set(key(pt), [...(byPoint.get(key(pt)) ?? []), idx])));
  while (unused.size) {
    const first = unused.values().next().value;
    unused.delete(first);
    const line = [...segs[first]];
    for (let grow = true; grow; ) {
      grow = false;
      for (const idx of byPoint.get(key(line.at(-1))) ?? []) {
        if (!unused.has(idx)) continue;
        unused.delete(idx);
        const [a, b] = segs[idx];
        line.push(key(a) === key(line.at(-1)) ? b : a);
        grow = true;
        break;
      }
    }
    if (line.length < 12) continue;
    // Simplify to ≤ 40 points per path (Motion & Artwork §4, A1).
    const every = Math.max(1, Math.ceil(line.length / 40));
    const pts = line.filter((_, i) => i % every === 0 || i === line.length - 1);
    paths.push({ level, d: "M" + pts.map(([x, y]) => `${x.toFixed(0)} ${y.toFixed(0)}`).join("L") });
  }
}
// Outer to inner, so the draw-in (M-26) runs from the outside towards the peak.
paths.sort((a, b) => a.level - b.level);
await writeFile(new URL("components/artwork/contour-paths.json", root), JSON.stringify(paths.map((p) => p.d)) + "\n");
console.log(`media: ${Object.keys(media).length} projects, ${paths.length} contour paths`);
