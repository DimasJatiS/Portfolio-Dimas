import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";
import { Experience } from "@/components/sections/Experience";
import { Hero } from "@/components/sections/Hero";
import { Skills } from "@/components/sections/Skills";
import { WorkGallery } from "@/components/sections/WorkGallery";
import { FeaturedCards, OtherWork } from "@/components/sections/WorkProjects";
import { Section } from "@/components/ui/Section";
import type { Locale } from "@/i18n/routing";
import { contactConfigured, env } from "@/lib/config/env";
import { getContent } from "@/lib/content/get";
import { buildGalleryTiles } from "@/lib/content/resolve";
import { jsonLdString, personJsonLd } from "@/lib/seo/jsonld";
import { alternates } from "@/lib/seo/metadata";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: alternates((await getLocale()) as Locale, "") };
}

export default async function Home() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("section");
  const meta = await getTranslations("meta");
  const { settings, projects, activities, skills } = await getContent(locale);

  const featured = projects.filter((p) => p.featured);
  const others = projects.filter((p) => !p.featured);
  const timeline = activities.filter((a) => a.featured).slice(0, 6);
  const tiles = buildGalleryTiles(projects).map((tile) => ({
    kind: tile.kind,
    title: tile.project.title,
    glyph: tile.project.glyph,
    gray: tile.kind === "cover" ? tile.project.cover?.gray : undefined,
  }));

  // Sections without data are hidden (no placeholders in public).
  const form = contactConfigured
    ? ({ mode: "live", siteKey: env.NEXT_PUBLIC_TURNSTILE_SITE_KEY! } as const)
    : ({ mode: process.env.NODE_ENV === "production" ? "hidden" : "note" } as const);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(personJsonLd(settings, meta("description"))) }} />
      <Hero label={settings.heroLabel} statement={settings.heroStatement} cvUrl={settings.cvUrl} />
      <About label={t("about")} manifesto={settings.manifesto} portrait={settings.portrait} />
      <Section id="work" tone="base" panel label={t("work")}>
        <WorkGallery tiles={tiles} />
        <FeaturedCards projects={featured} />
        <OtherWork projects={others} />
      </Section>
      {skills.length > 0 && <Skills label={t("skills")} groups={skills} />}
      {timeline.length > 0 && <Experience label={t("experience")} items={timeline} />}
      <Contact label={t("contact")} panel={timeline.length === 0 && skills.length > 0} settings={settings} form={form} />
    </>
  );
}
