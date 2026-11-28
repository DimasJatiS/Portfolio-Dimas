import type { ContactInput } from "./schema";

export type SenderMeta = { ip: string; city: string; region: string; country: string; timezone: string; userAgent: string; language: string; sentAt: Date };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const known = (s: string) => (s && s !== "unknown" ? s : "");

/** "Chrome di macOS" from a user-agent string; good enough to read at a glance, the raw string stays below it. */
export function describeDevice(ua: string) {
  const os = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac OS X|Macintosh/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\/|Opera/.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\/|CriOS\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "";
  return [browser, os].filter(Boolean).join(" di ") || "Tidak diketahui";
}

/** The contact email: a readable HTML layout plus a plain-text twin. Every visitor value is escaped. */
export function buildContactEmail({ name, email, company, message }: ContactInput, m: SenderMeta) {
  const time = `${m.sentAt.toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "full", timeStyle: "short" })} WIB`;
  const place = [m.city, m.region, m.country].map(known).filter(Boolean).join(", ");
  const location = place ? `${place}${known(m.timezone) ? ` (${m.timezone})` : ""}` : "Tidak diketahui";
  const device = describeDevice(m.userAgent);
  const subject = `Pesan portfolio dari ${name}${company ? ` (${company})` : ""}`;
  const rows: [string, string][] = [["IP", m.ip], ["Lokasi", location], ["Perangkat", device], ["Bahasa", m.language || "Tidak diketahui"], ["Waktu", time]];

  const text = [
    `PESAN BARU DARI PORTFOLIO`,
    ``,
    `Nama      : ${name}`,
    `Email     : ${email}`,
    ...(company ? [`Perusahaan: ${company}`] : []),
    ``,
    `PESAN`,
    message,
    ``,
    `INFO PENGIRIM`,
    ...rows.map(([k, v]) => `${k.padEnd(10)}: ${v}`),
    `User agent: ${m.userAgent || "-"}`,
  ].join("\n");

  const cell = "padding:8px 0;border-bottom:1px solid #ece9e4;vertical-align:top;";
  const meta = rows.map(([k, v]) => `<tr><td style="${cell}width:110px;color:#8a857d;font-size:14px;">${k}</td><td style="${cell}font-size:15px;color:#1a1a1a;">${esc(v)}</td></tr>`).join("");
  const html = `<!doctype html><html><body style="margin:0;padding:24px 12px;background:#f4f2ee;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
<tr><td style="background:#0a0a0a;padding:20px 28px;color:#ffffff;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Pesan baru <span style="color:#cd7f32;">&bull;</span> Portfolio</td></tr>
<tr><td style="padding:28px 28px 8px;">
  <div style="font-size:24px;font-weight:700;line-height:1.3;">${esc(name)}</div>
  <div style="font-size:16px;margin-top:4px;"><a href="mailto:${esc(email)}" style="color:#9a6230;">${esc(email)}</a>${company ? ` <span style="color:#8a857d;">&middot; ${esc(company)}</span>` : ""}</div>
</td></tr>
<tr><td style="padding:20px 28px;">
  <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#8a857d;margin-bottom:10px;">Pesan</div>
  <div style="font-size:18px;line-height:1.65;white-space:pre-wrap;border-left:3px solid #cd7f32;padding-left:16px;">${esc(message)}</div>
  <div style="margin-top:24px;"><a href="mailto:${esc(email)}?subject=${esc(encodeURIComponent(`Re: ${subject}`))}" style="display:inline-block;background:#0a0a0a;color:#ffffff;text-decoration:none;font-size:15px;padding:12px 22px;border-radius:999px;">Balas ${esc(name)}</a></div>
</td></tr>
<tr><td style="padding:8px 28px 28px;">
  <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#8a857d;margin:12px 0 4px;">Info pengirim</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${meta}</table>
  <div style="font-size:12px;color:#a8a39b;margin-top:12px;word-break:break-all;">${esc(m.userAgent || "-")}</div>
</td></tr>
</table></body></html>`;

  return { subject, text, html };
}
