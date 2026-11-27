"use client";

import Script from "next/script";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef } from "react";
import { Magnet } from "@/components/ui/Magnet";
import { track } from "@/lib/track";
import { sendMessage } from "./actions";
import type { ContactState } from "./schema";

const field =
  "mt-2 w-full rounded-xl border-2 border-fg/35 bg-transparent px-4 py-3 text-fg outline-none transition-colors focus:border-accent aria-[invalid=true]:border-accent";

/** F-08. Always parallax speed 1 (never moves while being filled in). */
export function ContactForm({ siteKey }: { siteKey: string }) {
  const t = useTranslations("form");
  const [state, action, pending] = useActionState<ContactState, FormData>(sendMessage, { status: "idle" });
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state.errors ?? {};

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      track("contact_form");
    }
    if (state.status !== "idle") (window as Window & { turnstile?: { reset: () => void } }).turnstile?.reset();
  }, [state]);

  const input = (name: "name" | "email" | "company" | "message", label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block">
      <span className="label text-muted">{label}</span>
      {name === "message" ? (
        <textarea name={name} required rows={5} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `${name}-error` : undefined} className={`${field} resize-y`} />
      ) : (
        <input name={name} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `${name}-error` : undefined} className={field} {...props} />
      )}
      {errors[name] && (
        <span id={`${name}-error`} className="mt-1 block text-sm text-accent">
          {t(`errors.${name}`)}
        </span>
      )}
    </label>
  );

  const status = { success: t("success"), error: t("error"), invalid: t("invalid"), rateLimited: t("rateLimited"), idle: "" }[state.status];

  return (
    <form ref={formRef} action={action} noValidate className="grid gap-5 sm:grid-cols-2">
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
      {input("name", t("name"), { required: true, autoComplete: "name", maxLength: 80 })}
      {input("email", t("email"), { required: true, type: "email", autoComplete: "email", maxLength: 200 })}
      <div className="sm:col-span-2">{input("company", t("company"), { autoComplete: "organization", maxLength: 120 })}</div>
      <div className="sm:col-span-2">{input("message", t("message"))}</div>
      {/* Honeypot: hidden from people and assistive tech, tempting for bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label>
          Website <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="sm:col-span-2">
        <div className="cf-turnstile" data-sitekey={siteKey} data-theme="auto" data-size="flexible" />
        {errors.captcha && <p className="mt-1 text-sm text-accent">{t("errors.captcha")}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-5 sm:col-span-2">
        <Magnet>
          <button type="submit" disabled={pending} className="pill pill-accent disabled:opacity-60">
            {pending ? t("sending") : t("send")} <span aria-hidden className="size-1.5 rounded-full bg-current" />
          </button>
        </Magnet>
        <p role="status" aria-live="polite" className={`text-sm ${state.status === "success" ? "text-fg" : "text-accent"}`}>
          {status}
        </p>
      </div>
    </form>
  );
}
