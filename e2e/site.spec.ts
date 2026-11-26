import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Headless Chromium stalls on the WebGL hero, so automated runs use the `still` tier;
// motion itself is measured in real Chrome (docs/motion.md).
test("home renders server-side text in English and Indonesian", async ({ page }) => {
  await page.goto("/?motion=still");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Dimas");
  await expect(page.getByText("LONG LIVE LEARNER")).toHaveCount(0);
  for (const id of ["about", "work", "skills", "contact"]) await expect(page.locator(`#${id}`)).toBeAttached();

  await page.goto("/id?motion=still");
  await expect(page.locator("html")).toHaveAttribute("lang", "id");
  await expect(page.getByText("Lihat karya", { exact: false }).first()).toBeVisible();
});

test("still tier: no pins and no hidden hero text", async ({ page }) => {
  await page.goto("/?motion=still");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "still");
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCSS("opacity", "1");
});

test("Night/Day choice persists across reloads without a flash", async ({ page, isMobile }) => {
  await page.goto("/?motion=still");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
  if (isMobile) await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("button", { name: "Day" }).first().click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "day");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "day");
});

test("language toggle keeps the page", async ({ page, isMobile }) => {
  await page.goto("/?motion=still");
  if (isMobile) await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("link", { name: "ID", exact: true }).click();
  await expect(page).toHaveURL(/\/id$/);
});

test("work and activities have index pages, and a case study offers related work", async ({ page }) => {
  await page.goto("/work?motion=still");
  const first = page.locator('main a[href*="/work/"]').first();
  const href = await first.getAttribute("href");
  await first.click();
  // The first visit to a case study can be slow under parallel load (on-demand render).
  await expect(page).toHaveURL(new RegExp(`${href}$`), { timeout: 15_000 });
  const related = page.locator("[data-card]");
  await expect(related.first()).toBeAttached();
  // Clicking another card selects it instead of navigating; the centre card opens it.
  // The neighbour is only partly inside the clipped strip, so click it without scrolling.
  const slug = await page.locator('li:has([data-card][aria-pressed="true"]) + li [data-card]').getAttribute("data-card");
  const other = page.locator(`[data-card="${slug}"]`);
  await other.dispatchEvent("click");
  await expect(other).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL(new RegExp(`${href}$`));

  await page.goto("/id/activities?motion=still");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator('main a[href*="/activities/"]').first()).toBeAttached();
});

test("unknown pages return the localized 404", async ({ page }) => {
  const res = await page.goto("/id/does-not-exist?motion=still");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Jejaknya hilang" })).toBeVisible();
});

test("security headers are set", async ({ request }) => {
  const res = await request.get("/");
  const h = res.headers();
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["strict-transport-security"]).toContain("max-age=");
});

for (const theme of ["night", "day"] as const) {
  test(`no serious axe violations (${theme})`, async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
    await page.goto("/?motion=still");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
  });
}

test("featured cards keep their actions inside the viewport while pinned", async ({ page }) => {
  await page.goto("/?motion=still");
  const cards = page.locator("#work article[data-card]");
  const n = await cards.count();
  expect(n).toBeGreaterThan(0);
  for (let i = 0; i < n; i++) {
    const card = cards.nth(i);
    await card.locator("xpath=..").evaluate((li) => li.scrollIntoView({ block: "start" }));
    await page.waitForTimeout(300);
    const read = card.getByRole("link", { name: /Read case study/ });
    const box = (await read.boundingBox())!;
    const vh = page.viewportSize()!.height;
    expect(box.y + box.height, `card ${i} actions`).toBeLessThanOrEqual(vh);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
});

test("related work shows animated glyphs, not photos", async ({ page }) => {
  await page.goto("/work/siakad?motion=still");
  const cards = page.locator("[data-card]");
  expect(await cards.count()).toBeGreaterThan(3);
  await expect(cards.locator("img")).toHaveCount(0);
  await expect(cards.first().locator("svg.glyph")).toHaveCount(1);
  await expect(page.locator("[data-zoom] img")).toHaveCount(0);
});
