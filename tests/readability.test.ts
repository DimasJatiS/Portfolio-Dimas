import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync("app/globals.css", "utf8");

/** Value of a custom property in the theme's base rule (its selector list starts with `:root[data-theme="…"],`). */
function token(theme: "night" | "day", name: string): string {
  const selector = (r: string) => r.split("{")[0]!.replace(/\/\*[\s\S]*?\*\//g, "").trim();
  const rule = css.split("}").find((r) => selector(r).startsWith(`:root[data-theme="${theme}"],`) && r.includes(name));
  const value = rule?.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`))?.[1];
  if (!value) throw new Error(`${name} not found for ${theme}`);
  return value;
}

/** WCAG 2.x contrast ratio of two #rrggbb colours. */
function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * bl!;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

const tsx = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tsx(join(dir, e.name)) : e.name.endsWith(".tsx") ? [join(dir, e.name)] : []));

describe("readability", () => {
  it("muted text is ≥ 7:1 on its surface in both themes", () => {
    expect(contrast(token("night", "--fg-muted"), "#0a0a0a")).toBeGreaterThanOrEqual(7);
    expect(contrast(token("day", "--fg-muted"), "#f5f5f2")).toBeGreaterThanOrEqual(7);
  });
  it("has no text smaller than 13px in components", () => {
    // OG images render at 1200×630 and are not read in the page, so app/**/opengraph-image.tsx is out of scope.
    const files = [...tsx("components"), ...tsx("app")].filter((f) => !f.includes("opengraph-image"));
    const offenders = files.filter((f) => /text-\[(?:[0-9]|1[0-2])px\]|\btext-xs\b/.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });
  it("body copy is at least 17px", () => expect(css).toMatch(/body\s*{[^}]*font-size:\s*17px/));
});
