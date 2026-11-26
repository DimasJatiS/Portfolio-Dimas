# Motion dan artwork (yang terimplementasi)

## Tier

`data-motion` diset sebelum paint (`lib/motion/tier.ts`, diuji unit): `still` bila reduced motion; `lite` bila pointer kasar, ≤ 4 core, ≤ 4 GB, atau Save-Data; selain itu `full`. Paksa dengan `?motion=full|lite|still`. Shader juga turun DPR 1,5 → 1 → 0,75 lalu ke fallback AVIF setelah penurunan FPS ketiga (`PerformanceMonitor`).

## Zoom = track sticky

Tiga momen besar dan hero case study memakai **track CSS** (`.track` + `.sticky-frame` 100svh, tinggi track per tier di `globals.css`), bukan pin GSAP. Pin GSAP mengganti elemen ke `position: fixed` dan Chrome mencatat tiap pergantian sebagai layout shift penuh (terukur CLS 1,99 saat scroll); dengan sticky CLS saat scroll = 0.

| Track | `full` | `lite` | `still` |
| --- | --- | --- | --- |
| Hero (M-05) | 200svh | 160svh | 100svh, tanpa gerak |
| Work gallery (M-12) | 300svh | 220svh | grid statis |
| Contact sunrise (M-29) | 180svh | tanpa hold | matahari penuh |
| Case study hero (M-22) | 180svh (140 di mobile) | sama | media 100% |

## Kode gerak

| ID | Tempat | Implementasi |
| --- | --- | --- |
| M-01/02 | `Hero.tsx` | SplitText chars dari blur 12px, stagger 40ms; item stagger 80ms; fallback CSS bila JS gagal |
| M-03/04 | `HeroShader.tsx` | Canvas dimuat setelah `load` + idle, fade 800ms; inti bronze lerp 0,06 ke pointer |
| M-06/07/08 | `Hero.tsx` | Kolom `yPercent` 100/80/60/40, teks −30vh + fade, `uZoom` 0→1 (`lite`: div radial di-`scale`) |
| M-09 | `MotionRoot.tsx` | Pelat `.panel-bg` `scaleX 0.92→1`, `y 6vh→0` (mobile 0,96/3vh) |
| M-10 | `MotionRoot.tsx` + `lib/motion/parallax.ts` | `[data-speed]`, jarak `(1−speed)·min(section, 100vh)`, ×0,5 di mobile/`lite` |
| M-11 | `About.tsx` | Kata manifesto 0,15→1 |
| M-13 | `WorkGallery.tsx` | Tile tengah memenuhi layar, tile lain 5–9× keluar frame; `will-change` hanya saat zoom berjalan |
| M-14 | `WorkProjects.tsx` | Kartu sticky bertumpuk, `scale 0.95→1`, `y 60→0`; 3 layer GPU |
| M-15 | `WorkProjects.tsx` | Gambar 320px mengikuti kursor (`quickTo`), hanya pointer halus |
| M-16 | `Skills.tsx` | 40px/s × (1 + |v|/1000), arah ikut scroll, lebar diukur saat refresh |
| M-19 | `ui/Magnet.tsx` | Tombol Send magnet 0,3/80px (M-18 TextPressure dihapus: Corben tidak punya sumbu bobot) |
| M-20 | `MotionRoot.tsx` | ScrambleText ≤ 400ms untuk label section |
| M-21 | `Header.tsx` | Pill mengambang setelah 80px, murni CSS (clip-path + translate) |
| M-22 | `CaseHero.tsx` | Media `scale 0.6→1` |
| M-23 | `MotionRoot.tsx` | `[data-line-mask]` SplitText lines + mask |
| M-24/25 | `artwork/Glyph.tsx` | Path dirakit sekali; loop CSS hanya di `full` dan saat terlihat |
| M-26/27 | `Contour.tsx`, `About.tsx` | Kontur tergambar sekali dari luar ke dalam; potret tune-in dari noise |
| M-28/17 | `Experience.tsx` | Jalur zig-zag melewati penanda, titik bronze lewat MotionPathPlugin (dimuat lazy) |
| M-29 | `Contact.tsx` | Matahari `yPercent 100→0`, cakrawala diam |

## Artwork

A1 kontur: medan noise + marching squares di `scripts/prepare-media.mjs` → `components/artwork/contour-paths.json` (17 path, ≤ 40 titik). A2 jalur (Experience). A3 glyph G1–G5 + `generic`, varian line/halftone (`<pattern>`), satu elemen bronze. A4 matahari. A5 grid hairline. A6 grain PNG 8 KB. A7 potret tune-in (siluet DJS, Q1 default).

## Hasil ukur (19 Nov 2026, MacBook Intel Iris Plus, Chrome, 1440×900 DPR 2, build produksi)

| Ukuran | Hasil | Target |
| --- | --- | --- |
| Scroll otomatis atas→bawah 8 dtk, `?motion=full` | rata-rata 40 fps, p95 51ms, 0 long task | 60 fps desktop |
| Bagian kartu Work saja | 51 fps (34 sebelum `will-change` di kartu) | - |
| Gallery Work saja | 49 fps | - |
| CLS selama scroll | 0,000 (1,99 dengan pin GSAP) | < 0,05 |
| LCP mobile, Slow 4G + CPU 4× | 1,94 dtk, CLS 0 | < 2,5 dtk |
| Long task > 50ms saat scroll | 0 | 0 |
| Tinggi Home / posisi Work | 13,3 layar / layar ke-3,0 | ≤ 14 / ≤ 3 |

Mac ini otomatis mendapat tier `lite`; angka `full` di atas dipaksa dan bukan ekstrapolasi untuk desktop lain. Gate 60 fps harus diukur ulang di desktop menengah.
