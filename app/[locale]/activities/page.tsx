import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { IndexGrid } from "@/components/sections/IndexGrid";
import { Accent } from "@/components/ui/Accent";
import type { Locale } from "@/i18n/routing";
import { getContent } from "@/lib/content/get";
import { mediaSet } from "@/lib/content/resolve";
import { stripAccent } from "@/lib/content/text";
import { alternates } from "@/lib/seo/metadata";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("activity");
  return { title: stripAccent(t("indexTitle")), alternates: alternates((await getLocale()) as Locale, "/activities") };
}

/** Same grid as /work, in the editor's order (Home keeps the A2 trail with at most 6). */
export default async function ActivitiesIndex() {
  const { activities } = await getContent((await getLocale()) as Locale);
  const t = await getTranslations("activity");
  const w = await getTranslations("work");

  return (
    <section data-tone="base" className="bg-surface text-fg">
      <div className="container-x pt-[calc(var(--header-h)+clamp(48px,10vh,120px))] pb-12">
        <p className="label text-accent">{t("indexLabel")}</p>
        <h1 className="display mt-6 text-[clamp(56px,11vw,176px)]" data-line-mask>
          <Accent text={t("indexTitle")} />
        </h1>
      </div>
      <IndexGrid
        view={w("view")}
        cards={activities.map((a) => ({
          key: a.slug,
          href: a.hasDetail ? `/activities/${a.slug}` : undefined,
          title: a.title,
          meta: [t(`types.${a.type}`), [a.startYear, a.endYear].filter(Boolean).join(" - ")].filter(Boolean).join(" · "),
          summary: a.summary,
          images: mediaSet(a.cover, a.gallery),
          glyph: a.glyph,
        }))}
      />
    </section>
  );
}
