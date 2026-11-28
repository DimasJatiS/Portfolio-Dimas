import { describe, expect, it } from "vitest";
import { buildContactEmail } from "@/components/forms/email";
import { contactSchema, createRateLimiter } from "@/components/forms/schema";

describe("contactSchema (F-08)", () => {
  it("accepts a normal message and trims it", () => {
    const r = contactSchema.parse({ name: "  Rina ", email: "rina@example.com", message: "Hello, let's talk about an internship." });
    expect(r.name).toBe("Rina");
    expect(r.company).toBe("");
  });
  it("reports each bad field by its key", () => {
    const r = contactSchema.safeParse({ name: "R", email: "nope", message: "short" });
    expect(r.success).toBe(false);
    expect(r.error!.issues.map((i) => i.message).sort()).toEqual(["email", "message", "name"]);
  });
});

describe("createRateLimiter", () => {
  it("blocks after the limit and frees up after the window", () => {
    const allow = createRateLimiter(2, 1000);
    expect([allow("a", 0), allow("a", 10), allow("a", 20)]).toEqual([true, true, false]);
    expect(allow("b", 20)).toBe(true);
    expect(allow("a", 1500)).toBe(true);
  });
});

describe("buildContactEmail", () => {
  const meta = { ip: "203.0.113.7", city: "Yogyakarta", region: "YO", country: "ID", timezone: "Asia/Jakarta", userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 Version/18.1 Mobile/15E148 Safari/604.1", language: "id-ID", sentAt: new Date("2026-11-28T06:00:00Z") };
  const mail = buildContactEmail({ name: "<b>Eve</b>", email: "eve@example.com", company: "", message: "hi <script>alert(1)</script>\nline 2" }, meta);

  it("escapes every visitor value in the HTML", () => {
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).not.toContain("<b>Eve</b>");
    expect(mail.html).toContain("&#60;script&#62;");
  });
  it("shows readable sender info in both parts", () => {
    expect(mail.html).toContain("Safari di iPhone");
    expect(mail.text).toContain("Yogyakarta, YO, ID (Asia/Jakarta)");
    expect(mail.text).toContain("13.00 WIB");
  });
  it("says unknown instead of a row of 'unknown'", () => {
    const local = buildContactEmail({ name: "A", email: "a@b.co", company: "", message: "hello there" }, { ...meta, city: "unknown", region: "unknown", country: "unknown", timezone: "unknown", userAgent: "" });
    expect(local.text).toContain("Lokasi    : Tidak diketahui");
    expect(local.text).toContain("Perangkat : Tidak diketahui");
  });
});
