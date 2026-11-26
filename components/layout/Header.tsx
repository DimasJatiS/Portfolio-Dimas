"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { gsap, getTier, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import { LocaleToggle, ThemeToggle } from "./Toggles";

/** Work and Activities are pages; About and Contact stay sections of Home. */
const NAV = [
  { id: "work", page: "/work" },
  { id: "activities", page: "/activities" },
  { id: "about" },
  { id: "contact" },
] as const;

function NavLink({ item, className, onClick, children }: { item: (typeof NAV)[number]; className?: string; onClick?: () => void; children: React.ReactNode }) {
  const pathname = usePathname();
  if (!("page" in item))
    return (
      <SectionLink id={item.id} className={className} onClick={onClick}>
        {children}
      </SectionLink>
    );
  const current = pathname === item.page || pathname.startsWith(`${item.page}/`);
  return (
    <Link href={item.page} className={className} onClick={onClick} aria-current={current ? "page" : undefined}>
      {children}
    </Link>
  );
}

/** Anchor to a Home section: a plain hash on Home (Lenis handles it), a full link elsewhere. */
function SectionLink({ id, className, onClick, children }: { id: string; className?: string; onClick?: () => void; children: React.ReactNode }) {
  const onHome = usePathname() === "/";
  return onHome ? (
    <a
      href={`#${id}`}
      className={className}
      onClick={(e) => {
        if (!onClick) return;
        // From the menu: Lenis is stopped while the dialog is open and ignores scrollTo, so restart it first.
        e.preventDefault();
        onClick();
        const lenis = window.__lenis;
        if (lenis) lenis.scrollTo(`#${id}`);
        else document.getElementById(id)?.scrollIntoView();
      }}
    >
      {children}
    </a>
  ) : (
    <Link href={{ pathname: "/", hash: id }} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

export function Monogram({ className = "" }: { className?: string }) {
  return <span className={`font-serif text-xl font-bold tracking-[-0.01em] ${className}`}>Satria&apos;s</span>;
}

/**
 * M-21: after 80px the header condenses into a floating pill. Everything is CSS (clip-path +
 * translate driven by one attribute), so nothing animates layout and no scroll listener is added.
 */
export function Header({ cvUrl }: { cvUrl?: string }) {
  const t = useTranslations("nav");
  const ref = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useGSAP(() => {
    ScrollTrigger.create({
      start: 80,
      // Not "max": at the very bottom the trigger would count as finished and the pill would drop.
      end: Number.MAX_SAFE_INTEGER,
      onToggle: (self) => ref.current?.toggleAttribute("data-condensed", self.isActive),
    });
  });

  const openMenu = () => {
    const dialog = menuRef.current;
    if (!dialog) return;
    dialog.showModal();
    setOpen(true);
    window.__lenis?.stop();
    if (getTier() !== "still") gsap.from(dialog.querySelectorAll("[data-menu-item]"), { yPercent: 40, opacity: 0, stagger: 0.06, duration: 0.5 });
  };
  const closeMenu = () => {
    window.__lenis?.start();
    menuRef.current?.close();
  };

  return (
    <>
      <header ref={ref} className="group/h fixed inset-x-0 top-0 z-50 h-[var(--header-h)] [--o:max(0px,calc((min(100vw,1440px)-960px)/2-var(--gutter)+20px))]">
        <div
          aria-hidden
          className="absolute inset-0 bg-[color-mix(in_srgb,var(--surface)_80%,transparent)] opacity-0 backdrop-blur-[12px] transition-[opacity,clip-path] duration-[400ms] ease-[var(--ease-out)] [clip-path:inset(0_0_round_0)] group-data-[condensed]/h:opacity-100 group-data-[condensed]/h:[clip-path:inset(10px_max(10px,calc((100%-960px)/2))_round_999px)]"
        />
        <div className="relative mx-auto flex h-full max-w-[1440px] items-center justify-between gap-4 px-[var(--gutter)]">
          <Link href="/" aria-label={`Satria's, ${t("home")}`} className="transition-transform duration-[400ms] ease-[var(--ease-out)] group-data-[condensed]/h:translate-x-[var(--o)]">
            <Monogram />
          </Link>
          <nav aria-label={t("primary")} className="label absolute left-1/2 hidden -translate-x-1/2 gap-8 lg:flex">
            {NAV.map((item) => (
              <NavLink key={item.id} item={item} className="link-underline py-1 text-muted hover:text-fg aria-[current=page]:text-fg">
                {t(item.id)}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2 transition-transform duration-[400ms] ease-[var(--ease-out)] group-data-[condensed]/h:-translate-x-[var(--o)]">
            <div className="hidden items-center gap-2 lg:flex">
              <LocaleToggle />
              <ThemeToggle />
            </div>
            {cvUrl && (
              <a href="/cv.pdf" className="pill pill-accent" data-track="cv">
                {t("cv")}
              </a>
            )}
            <button type="button" onClick={openMenu} aria-haspopup="dialog" aria-expanded={open} className="pill pill-ghost lg:hidden">
              {t("menu")}
            </button>
          </div>
        </div>
      </header>

      <dialog
        ref={menuRef}
        aria-label={t("menu")}
        onClose={() => {
          setOpen(false);
          window.__lenis?.start();
        }}
        className="m-0 h-[100dvh] max-h-none w-full max-w-none bg-surface p-0 text-fg backdrop:bg-transparent"
      >
        <div className="container-x flex h-full flex-col pt-5 pb-8">
          <div className="flex items-center justify-between">
            <Monogram />
            <button type="button" onClick={closeMenu} className="pill pill-ghost" autoFocus>
              {t("close")}
            </button>
          </div>
          <nav aria-label={t("primary")} className="mt-16 flex flex-col gap-2">
            {NAV.map((item) => (
              <NavLink key={item.id} item={item} onClick={closeMenu} className="font-display text-[clamp(44px,13vw,88px)] leading-[1.05] font-bold aria-[current=page]:text-accent">
                <span data-menu-item className="inline-block">
                  {t(item.id)}
                </span>
              </NavLink>
            ))}
          </nav>
          <div data-menu-item className="mt-auto flex flex-wrap items-center gap-3">
            <LocaleToggle />
            <ThemeToggle />
            {cvUrl && (
              <a href="/cv.pdf" className="pill pill-accent" data-track="cv">
                {t("cv")}
              </a>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
