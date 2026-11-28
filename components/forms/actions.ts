"use server";

import { headers } from "next/headers";
import { Resend } from "resend";
import { contactConfigured, env } from "@/lib/config/env";
import { buildContactEmail } from "./email";
import { contactSchema, createRateLimiter, type ContactState, type FieldErrors } from "./schema";

const allow = createRateLimiter(5, 10 * 60 * 1000);

async function verifyTurnstile(token: string, ip: string) {
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY!, response: token, remoteip: ip }),
  });
  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}

export async function sendMessage(_prev: ContactState, form: FormData): Promise<ContactState> {
  if (!contactConfigured) return { status: "error" };
  // Honeypot: bots fill the hidden field; pretend success so they learn nothing.
  if (String(form.get("website") ?? "")) return { status: "success" };

  const parsed = contactSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const errors: FieldErrors = {};
    for (const issue of parsed.error.issues) errors[issue.path[0] as keyof FieldErrors] ??= issue.message;
    return { status: "invalid", errors };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  if (!allow(ip)) return { status: "rateLimited" };

  const token = String(form.get("cf-turnstile-response") ?? "");
  if (!token || !(await verifyTurnstile(token, ip))) return { status: "invalid", errors: { captcha: "captcha" } };

  // Vercel URL-encodes geo headers; absent locally, so fall back to "unknown".
  const geo = (k: string) => {
    const v = h.get(`x-vercel-ip-${k}`) ?? "unknown";
    try { return decodeURIComponent(v); } catch { return v; }
  };
  const mail = buildContactEmail(parsed.data, {
    ip,
    city: geo("city"),
    region: geo("country-region"),
    country: geo("country"),
    timezone: geo("timezone"),
    userAgent: h.get("user-agent") ?? "",
    language: h.get("accept-language")?.split(",")[0] ?? "",
    sentAt: new Date(),
  });
  try {
    const { error } = await new Resend(env.RESEND_API_KEY).emails.send({
      from: env.CONTACT_FROM_EMAIL!,
      to: env.CONTACT_TO_EMAIL!,
      replyTo: parsed.data.email,
      ...mail,
    });
    if (error) throw new Error(error.message);
    return { status: "success" };
  } catch (err) {
    console.error("[contact] Resend failed", err);
    return { status: "error" };
  }
}
