import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import id from "@/messages/id.json";
import { buildGalleryTiles, mediaSet, pick, resolveContent, resolveImage, rowRatio } from "@/lib/content/resolve";
import { seed } from "@/lib/content/seed";
import { splitAccent, stripAccent } from "@/lib/content/text";
import { GLYPHS } from "@/lib/content/types";
import { existsSync } from "node:fs";

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
  it("has no hero label by default", () => expect(resolveContent(seed, "en").settings.heroLabel).toBe(""));
  it("gives every project a case study", () => expect(content.projects.every((p) => p.problem && p.decisions.length > 0)).toBe(true));
  it("only references media that exists", () => {
    for (const p of content.projects) for (const img of [p.cover, ...p.gallery].filter((i) => i !== undefined)) {
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
    expect(tiles.filter((t) => t.kind === "cover")).toHaveLength(3);
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
