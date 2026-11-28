import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import id from "@/messages/id.json";
import { buildGalleryTiles, mediaSet, pick, resolveContent, resolveImage, rowRatio } from "@/lib/content/resolve";
import media from "@/lib/content/media.json";
import { seed } from "@/lib/content/seed";
import { splitAccent, stripAccent } from "@/lib/content/text";
import { GLYPHS } from "@/lib/content/types";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const keys = (o: object, prefix = ""): string[] =>
  Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]));

describe("messages", () => {
  it("en and id have the same keys", () => expect(keys(id).sort()).toEqual(keys(en).sort()));
});

describe("pick", () => {
  it("falls back to English when Indonesian is empty", () => {
    expect(pick({ en: "Hi", id: " " }, "id")).toBe("Hi");
    expect(pick({ en: "Hi", id: "Halo" }, "id")).toBe("Halo");
    expect(pick(undefined, "en")).toBeUndefined();
  });
});

describe("splitAccent", () => {
  it("marks *word* as the accent", () => {
    expect(splitAccent("into *crafted* products")).toEqual([
      { text: "into ", accent: false },
      { text: "crafted", accent: true },
      { text: " products", accent: false },
    ]);
    expect(stripAccent("into *crafted* products")).toBe("into crafted products");
  });
});

describe("resolveImage", () => {
  it("asks the Sanity CDN for a grayscale variant", () => {
    const img = resolveImage({ url: "https://cdn.sanity.io/images/p/d/a.jpg", width: 10, height: 10 }, "en", "x")!;
    expect(img.gray).toContain("sat=-100");
    expect(img.alt).toBe("x");
  });
  it("resolves the settings portrait, absent when none is uploaded", () => {
    const portrait = { url: "https://cdn.sanity.io/images/p/d/me.jpg", width: 1600, height: 2000 };
    expect(resolveContent({ ...seed, settings: { ...seed.settings, portrait } }, "en").settings.portrait?.alt).toBe("Dimas Jati Satria");
    expect(resolveContent(seed, "en").settings.portrait).toBeUndefined();
  });
});

describe("seed", () => {
  const content = resolveContent(seed, "id");
  it("resolves both languages without empty required text", () => {
    expect(content.settings.heroStatement).toContain("*");
    expect(content.projects.every((p) => p.summary.length > 0)).toBe(true);
  });
  it("lists projects and activities newest first", () => {
    const years = content.projects.map((p) => p.year ?? "");
    expect(years).toEqual([...years].sort().reverse());
    const starts = content.activities.map((a) => a.startYear ?? "");
    expect(starts).toEqual([...starts].sort().reverse());
    expect(content.projects[0]!.slug).toBe("chainfolio");
  });
  it("has the six activities, newest first", () =>
    expect(resolveContent(seed, "en").activities.map((a) => a.slug)).toEqual([
      "pimnas-39",
      "revogy-2026",
      "long-distance-running",
      "dbl-yogyakarta-2025",
      "sre-ugm",
      "gelex-ugm-2025",
    ]));
  it("new activities have id copy", () => {
    expect(content.activities.find((a) => a.slug === "revogy-2026")!.title).toBe("Operator IT, REVOGY 2026");
    expect(content.activities.find((a) => a.slug === "dbl-yogyakarta-2025")!.title).toBe("Tim medis, DBL Yogyakarta 2025");
    expect(content.activities.find((a) => a.slug === "sre-ugm")!.summary).toBe("Tim solar & elektronika di divisi Research and Innovation.");
  });
  it("gives every project a cover", () => expect(content.projects.every((p) => p.cover)).toBe(true));
  it("caps every gallery at 8 images", () => {
    expect([...content.projects, ...content.activities].every((x) => x.gallery.length <= 8)).toBe(true);
    expect(content.projects.find((p) => p.slug === "innofa")!.gallery).toHaveLength(8);
  });
  it("uses the matching glyph for each project and activity", () => {
    const glyph = (slug: string) => [...content.projects, ...content.activities].find((x) => x.slug === slug)!.glyph;
    expect([glyph("shardfall"), glyph("chainfolio"), glyph("pimnas-39"), glyph("sre-ugm"), glyph("revogy-2026"), glyph("dbl-yogyakarta-2025")]).toEqual([
      "console",
      "portfolio",
      "chicken",
      "bolt",
      "podium",
      "basketball",
    ]);
  });
  it("keeps every generated photo under 300 KB and every cover under 700 KB", () => {
    const walk = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
    const images = [...walk("public/projects"), ...walk("public/activities")].filter((f) => /\.(jpe?g|png)$/i.test(f));
    const isCover = (f: string) => /\/cover(-color)?\.[0-9a-f]{8}\.jpg$/.test(f);
    expect(images.filter((f) => !isCover(f) && statSync(f).size > 300_000)).toEqual([]);
    expect(images.filter((f) => isCover(f) && statSync(f).size > 700_000)).toEqual([]);
  });
  it("serves covers at the source's own resolution, up to 2560 px (HD on retina)", () => {
    // Native widths of the raw owner files (projects/, not committed); a cover is never downscaled below min(native, 2560).
    const native = { tbxxpert: 2400, "ai-cv-screen": 2818, inofa: 1801, "bloomarie-store": 2397, siakad: 2862, shardfall: 1562, chainfolio: 3360 } as const;
    for (const [slug, width] of Object.entries(native)) expect(media[slug as keyof typeof media].cover.width, slug).toBeGreaterThanOrEqual(Math.min(width, 2560) - 1);
  });
  it("has no hero label by default", () => expect(resolveContent(seed, "en").settings.heroLabel).toBe(""));
  it("gives every project a case study", () => expect(content.projects.every((p) => p.problem && p.decisions.length > 0)).toBe(true));
  it("only references media that exists", () => {
    for (const p of [...content.projects, ...content.activities]) for (const img of [p.cover, ...p.gallery].filter((i) => i !== undefined)) {
      expect(existsSync(`public${img.src}`)).toBe(true);
      expect(existsSync(`public${img.gray}`)).toBe(true);
    }
  });
});

describe("buildGalleryTiles", () => {
  const projects = resolveContent(seed, "en").projects;
  it("puts the first featured cover in the centre and fills 7 slots", () => {
    const tiles = buildGalleryTiles(projects);
    expect(tiles).toHaveLength(7);
    expect(tiles[4]).toMatchObject({ kind: "cover", project: { slug: "tbxpert" } });
  });
  it("shows a cover on every tile when every project has one", () => {
    expect(buildGalleryTiles(projects).every((t) => t.kind === "cover")).toBe(true);
  });
  it("never repeats a project while there are enough projects", () => {
    const tiles = buildGalleryTiles(projects);
    expect(new Set(tiles.map((t) => t.project.slug)).size).toBe(tiles.length);
  });
  it("only falls back to a glyph for a project without a cover", () => {
    const noCover = projects.map((p, i) => (i === 0 ? { ...p, cover: undefined } : p));
    const tiles = buildGalleryTiles(noCover);
    expect(tiles.filter((t) => t.kind === "glyph").map((t) => t.project.slug)).toEqual([noCover[0]!.slug]);
  });
  it("still fills every slot with a single project, and is empty without projects", () => {
    expect(buildGalleryTiles(projects.slice(0, 1))).toHaveLength(7);
    expect(buildGalleryTiles([])).toEqual([]);
  });
});

describe("mediaSet", () => {
  const img = (src: string, width: number, height: number) => ({ src, gray: src, width, height, alt: src });
  it("pairs a portrait cover with the next portrait image, never a landscape one", () => {
    const set = mediaSet(img("a", 3, 4), [img("a", 3, 4), img("wide", 16, 9), img("b", 3, 4)]);
    expect(set.map((i) => i.src)).toEqual(["a", "b"]);
    expect(rowRatio(set)).toBeCloseTo(1.5);
  });
  it("keeps a landscape cover alone and handles no cover", () => {
    expect(mediaSet(img("w", 16, 9), [img("b", 3, 4)])).toHaveLength(1);
    expect(mediaSet(undefined, [img("b", 3, 4)])).toEqual([]);
  });
});

describe("glyphs", () => {
  it("knows the new glyphs", () => {
    for (const g of ["console", "portfolio", "chicken", "bolt", "podium", "basketball"]) expect(GLYPHS).toContain(g);
  });
  it("uses the activity's own glyph, else one by type, and drops unknown ids", () => {
    const base = { title: { en: "A" }, startDate: "2026-01-01" };
    const { activities, projects } = resolveContent(
      {
        settings: {},
        projects: [{ title: "P", slug: "p", glyph: "nope" as never }],
        activities: [
          { ...base, slug: "own", type: "event", glyph: "stopwatch" },
          { ...base, slug: "typed", type: "competition" },
          { ...base, slug: "bad", type: "event", glyph: "nope" as never },
        ],
        skills: [],
      },
      "en",
    );
    const by = Object.fromEntries(activities.map((a) => [a.slug, a.glyph]));
    expect(by).toEqual({ own: "stopwatch", typed: "trophy", bad: "pulse" });
    expect(projects[0]!.glyph).toBe("generic");
  });
});
