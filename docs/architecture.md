# Arsitektur

## Prinsip

- **Halaman statis/ISR.** Semua rute dirender di server dan di-cache (revalidate 1 jam + webhook Sanity). Teks selalu DOM; WebGL hanya latar Hero.
- **Satu loop per frame.** Lenis digerakkan ticker GSAP dan memberi tahu ScrollTrigger; shader R3F memakai `frameloop="never"` dan di-`advance` dari ticker yang sama.
- **Tanpa data palsu di publik.** Section tanpa data disembunyikan dan penomoran `0X / 0Y` mengikuti section yang tampil.

## Alur data

`sanity/queries.ts` (satu query GROQ) → `lib/content/get.ts` (cache React + `fetch` dengan tag `sanity`; seed bila Sanity belum dikonfigurasi, gagal, atau koleksinya kosong) → `lib/content/resolve.ts` (memilih bahasa dengan fallback ke EN, membentuk URL gambar grayscale `sat=-100` dari CDN Sanity, menandai `hasCase`/`hasDetail`, menyusun tile gallery) → komponen section.

## i18n

next-intl 4 dengan `localePrefix: "as-needed"`: `/` = EN, `/id` = ID, tanpa deteksi bahasa otomatis. `app/[locale]/layout.tsx` adalah root layout; `i18n/request.ts` membaca `next/root-params` (tanpa `setRequestLocale`). `proxy.ts` menjalankan middleware next-intl. Route handler (OG image) menerima locale lewat `params` karena root params belum didukung di sana. Teks UI di `messages/{en,id}.json` (paritas kunci diuji).

## Tema dan tone

`lib/motion/tier.ts` membuat skrip inline yang berjalan sebelum paint: `data-theme` (Night default, pilihan di `localStorage`) dan `data-motion`. Warna hanya lewat token semantik `--surface --fg --fg-muted --accent --line` (`app/globals.css`); tiap section memberi `data-tone="base|inverse"` dan tema hanya menukar arti `base`. `bronze-400` hanya di permukaan gelap, `bronze-600` di terang.

## Design system

| Peran | Font | Kelas |
| --- | --- | --- |
| Judul (display) | Manrope 700, tracking rapat | `.display`, `font-display` |
| Aksen satu kata + monogram DJS | Corben 700, `--accent` (hanya selingan) | `.accent-word` (`*kata*` di teks Sanity), `font-serif` |
| Body, label, kode | Manrope (tanpa mono, tanpa bobot light) | default |
| Label | Manrope 14px medium, huruf biasa | `.label` |

Grid: container 1440px, gutter `clamp(16px, 4vw, 64px)`, garis grid hairline 4 kolom per section (A5). Sudut: media 12px, panel 24px (atas), tombol pill. Grain global: tile PNG 72px 8 KB, opacity 5%/4%, tanpa blend mode.

## Section dan rute

| Rute / section | Komponen | Sumber data | Catatan |
| --- | --- | --- | --- |
| 01 Hero | `sections/Hero.tsx` | `siteSettings` | 7 kolom lembah (5 di mobile), shader/AVIF, track sticky |
| 02 About | `sections/About.tsx` | `manifesto` | Panel terang, kontur A1, siluet DJS (Q1) |
| 03 Work | `WorkGallery.tsx`, `WorkProjects.tsx` | `project` | Gallery 7 tile (5 mobile) dari data, kartu unggulan, Other work |
| 04 Skills | `sections/Skills.tsx` | `skillGroup` | Grid 2×2 + 2 marquee |
| 05 Experience | `sections/Experience.tsx` | `activity` (featured, maks. 6) | Disembunyikan bila kosong |
| 06 Contact | `sections/Contact.tsx` | `siteSettings` + env | Form hanya bila 5 kunci ada; kanal yang kosong disembunyikan |
| `/work/[slug]` | `app/[locale]/work/[slug]` | proyek dengan `problem` atau `decisions` | Hero sticky M-22, meta, isi, galeri, next project, JSON-LD, OG |
| `/activities/[slug]` | `app/[locale]/activities/[slug]` | aktivitas dengan body/gambar | Template ringkas |
| 404 | `app/[locale]/not-found.tsx` | - | Frame shader diam + kontur |
| `/cv.pdf` | `app/cv.pdf/route.ts` | `siteSettings.cv` | Redirect unduhan, 404 bila belum ada |

## Keamanan

Header di `next.config.ts`: CSP (inline script diizinkan karena halaman statis tanpa nonce; sisanya ketat), HSTS, `nosniff`, `X-Frame-Options: DENY`, Referrer-Policy, Permissions-Policy. Env divalidasi Zod dan tidak pernah menjatuhkan situs (`lib/config/env.ts`, `server-only`). Form: Zod, honeypot, rate limit in-memory 5/10 menit per IP, verifikasi Turnstile di server, Resend.
