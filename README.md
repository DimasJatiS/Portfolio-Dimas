# Dimas Jati Satria - Portfolio ("Summit")

Personal portfolio of a software engineer (full-stack + AI), built to land an internship from February 2027.
Monochrome with one bronze light, a WebGL grain shader in the hero, scroll-scrubbed parallax and zoom, English + Indonesian, content in Sanity.

**Stack:** Next.js 16 (App Router, static/ISR) · React 19 · TypeScript · Tailwind CSS v4 · GSAP (ScrollTrigger, SplitText, ScrambleText, MotionPath) · Lenis · three.js via React Three Fiber · next-intl · Sanity · Resend + Cloudflare Turnstile · Vitest · Playwright + axe.

## Run it

Requires Node 24 (`.nvmrc`) and pnpm 12.

```bash
nvm use 24
pnpm install
pnpm dev            # http://localhost:3010
```

No environment variables are needed: without Sanity the site renders from the local seed in `lib/content/seed.ts`, and the contact form stays hidden in production. See `.env.example` for every option.

| Command | What it does |
| --- | --- |
| `pnpm dev` / `pnpm build` / `pnpm start` | Next.js on port 3010 |
| `pnpm check` | ESLint + TypeScript + unit tests |
| `pnpm test:e2e` | Playwright (desktop + mobile Chromium, axe) against a production build on 3110 |
| `pnpm media` | Regenerates optimized project images, the grain tile, hero fallbacks and topographic contours from `projects/` |
| `pnpm --filter studio dev` | Sanity Studio on port 3333 (`SANITY_STUDIO_PROJECT_ID` required) |

Preview the motion tiers with `?motion=full`, `?motion=lite` or `?motion=still`. `CONTENT_FIXTURES=1 pnpm dev` loads fake data that exercises the optional sections (timeline, case study, contact channels); it is ignored by production builds.

## Structure

```
app/                 routes only: [locale]/ (Home, work/[slug], activities/[slug], 404, OG), api/revalidate, cv.pdf, sitemap, robots
components/
  sections/          Hero, About, Work (gallery, cards, other work), Skills, Experience, Contact, CaseHero
  layout/            Header (floating pill + mobile menu), toggles, MotionRoot (Lenis + global motion), Footer
  artwork/           2D SVG artwork: project glyphs, topographic contours, sunrise
  canvas/            HeroShader (one full-screen plane, R3F)
  forms/             ContactForm + server action + Zod schema
  ui/                Section frame, Accent, Magnet, TextPressure, RichText, CopyButton
lib/
  motion/            gsap setup, tier detection, parallax math, shared hero state
  content/           types, seed, Sanity → UI mapping, loader
  seo/ config/       metadata, JSON-LD, env validation, site URL
sanity/              GROQ query + server client
studio/              Sanity Studio (schemas)
shaders/             hero GLSL
messages/            UI strings (en, id)
tests/ e2e/          Vitest unit tests, Playwright specs
docs/                how it is built (architecture, motion, content, deployment)
```

## Content

Projects, activities, skills and site settings (hero text, manifesto, email, LinkedIn, GitHub, CV) live in Sanity; every translatable field is `{ en, id }` and falls back to English. A project becomes a `/work/[slug]` case study as soon as it has a problem or a key decision; an activity gets a detail page when it has a body or images. Publishing in Sanity revalidates the site through the webhook at `/api/revalidate`. Details: [`docs/content-and-sanity.md`](docs/content-and-sanity.md).

## Fonts

Fonts: Manrope for headings and body text, Corben only as an accent (accent words, DJS monogram), both from Google Fonts via `next/font`.

## Deploy

Vercel, static/ISR, no server state. Environment variables, Sanity webhook, Turnstile/Resend setup and the launch checklist: [`docs/deployment-and-launch.md`](docs/deployment-and-launch.md).
