import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { CaseHero } from "@/components/sections/CaseHero";
import { Related } from "@/components/sections/Related";
import { RichText } from "@/components/ui/RichText";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { getContent } from "@/lib/content/get";
import { mediaSet } from "@/lib/content/resolve";
import { getSequence, relatedFor } from "@/lib/content/sequence";
import { alternates } from "@/lib/seo/metadata";

export const revalidate = 3600;

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const { activities } = await getContent(routing.defaultLocale);
  return activities.filter((a) => a.hasDetail).map((a) => ({ slug: a.slug }));
}

async function load(slug: string) {
  const locale = (await getLocale()) as Locale;
  const list = (await getContent(locale)).activities.filter((a) => a.hasDetail);
  const i = list.findIndex((a) => a.slug === slug);
  if (i < 0) notFound();
  return { locale, activity: list[i]!, related: relatedFor(await getSequence(locale), `activity-${slug}`) };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const { locale, activity } = await load(slug);
  return { title: activity.title, description: activity.summary, alternates: alternates(locale, `/activities/${slug}`) };
}

export default async function ActivityPage({ params }: Params) {
  const { slug } = await params;
  const { activity: a, related } = await load(slug);
  const t = await getTranslations("activity");
  const w = await getTranslations("case");
  const period = [a.startYear, a.endYear].filter(Boolean).join(" - ");
  const media = mediaSet(a.cover, a.gallery);
  // Photos already shown in the opening frame are not repeated below.
  const rest = a.gallery.filter((g) => !media.some((m) => m.src === g.src));

  return (
    <>
      <CaseHero media={media}>
        <Link href="/activities" className="label link-underline self-start text-muted">
          ← {t("back")}
        </Link>
        <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
          <p className="label text-accent">{[t(`types.${a.type}`), a.org, period].filter(Boolean).join(" · ")}</p>
          <h1 className="display mt-6 max-w-[16ch] text-[clamp(44px,7.4vw,128px)]" data-line-mask>
            {a.title}
          </h1>
          {a.summary && <p className="mt-8 max-w-[48ch] text-[clamp(18px,1.6vw,22px)] text-muted">{a.summary}</p>}
          {a.url && (
            <a href={a.url} target="_blank" rel="noreferrer" className="label link-underline mt-6 inline-block">
              {t("link")} ↗
            </a>
          )}
        </div>
        <p className="label border-t border-line pt-4 text-muted">{w("explore")} ↓</p>
      </CaseHero>
      <div data-tone="inverse" className="bg-surface text-fg">
        <div className="container-x grid gap-16 py-20">
          {a.body && <RichText value={a.body} />}
          {rest.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2">
              {rest.map((img) => (
                <div key={img.src} className="media relative">
                  <Image src={img.src} alt={img.alt} width={img.width} height={img.height} sizes="(min-width: 1024px) 40vw, 92vw" className="h-auto w-full" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Related items={related.items} start={related.start} />
    </>
  );
}
