import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { corben, manrope, playfair } from "@/app/fonts";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MotionRoot } from "@/components/layout/MotionRoot";
import { SkipLink } from "@/components/layout/SkipLink";
import { Tracking } from "@/components/layout/Tracking";
import { routing, type Locale } from "@/i18n/routing";
import { SITE_NAME, SITE_NAME_AUTHOR, SITE_URL } from "@/lib/config/site";
import { getContent } from "@/lib/content/get";
import { bootScript } from "@/lib/motion/tier";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t("title"), template: `%s | ${SITE_NAME}` },
    description: t("description"),
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME_AUTHOR }],
    openGraph: { type: "website", siteName: SITE_NAME, locale: (await getLocale()) === "id" ? "id_ID" : "en_US" },
    twitter: { card: "summary_large_image" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0A" },
    { media: "(prefers-color-scheme: light)", color: "#0A0A0A" },
  ],
};

export default async function LocaleLayout({ children }: { children: React.ReactNode }) {
  const locale = (await getLocale()) as Locale;
  const { settings } = await getContent(locale);

  return (
    <html lang={locale} data-theme="night" suppressHydrationWarning className={`${manrope.variable} ${corben.variable} ${playfair.variable}`}>
      <head>
        {/* Theme + motion tier before first paint (no flash, PRD §5.2, Motion & Artwork §2). */}
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>
        <NextIntlClientProvider>
          <SkipLink />
          <Header cvUrl={settings.cvUrl} />
          <main id="main" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <Footer />
          <MotionRoot />
          <Tracking />
        </NextIntlClientProvider>
        <div aria-hidden className="grain" />
        {/* Only on Vercel: elsewhere the scripts 404. */}
        {process.env.VERCEL && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
      </body>
    </html>
  );
}
