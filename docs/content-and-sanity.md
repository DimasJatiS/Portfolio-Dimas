# Konten dan Sanity

## Studio

Paket `studio/` (workspace pnpm). Jalankan `SANITY_STUDIO_PROJECT_ID=<id> pnpm --filter studio dev` lalu buka `http://localhost:3333`, atau `pnpm --filter studio deploy` ke `*.sanity.studio`. Validasi schema: `pnpm --filter studio validate` (juga di CI).

## Model

Field dua bahasa berbentuk `{ en, id }`; ID kosong → tampil EN.

| Tipe | Field penting |
| --- | --- |
| `siteSettings` (singleton) | `heroLabel`, `heroStatement`, `manifesto`, `email`, `linkedin`, `github`, `repoUrl`, `cv` (PDF ≤ 500 KB) |
| `project` | `title`, `slug`, `featured`, `order`, `summary`, `role`, `year`, `duration`, `team`, `stack`, `glyph`, `cover` (+alt), `galleryTile`, `liveUrl`, `repoUrl`, `problem`, `process`, `decisions[]` (judul, isi, kode), `results`, `gallery[]` |
| `activity` | `title`, `slug`, `org`, `type`, `startDate`, `endDate`, `summary`, `body`, `cover`, `gallery[]`, `url`, `featured`, `order` |
| `skillGroup` | `title`, `items[]`, `order` |

Tulis satu kata dalam `*bintang*` di `heroStatement`/`manifesto` untuk kata aksen bronze italic.

## Menambah proyek

1. Buat dokumen `project`, isi kartu (judul, slug, order, summary, stack, cover ≥ 1440px, glyph).
2. `featured = true` → masuk kartu unggulan dan cover-nya ke zoom gallery (3 cover pertama). Gallery menyesuaikan diri untuk berapa pun jumlah proyek.
3. Halaman `/work/[slug]` muncul otomatis begitu `problem` atau `decisions` terisi; tanpa itu kartu tidak menjadi link.

## Menambah aktivitas

Buat `activity`. Home menampilkan maksimal 6 yang `featured`, urut `order`. Bila punya `body` atau gambar, barisnya menjadi link ke `/activities/[slug]`. Section Experience tersembunyi selama belum ada aktivitas.

## Seed dan fixture

- `lib/content/seed.ts`: dipakai bila Sanity belum dikonfigurasi, gagal diakses, atau koleksi kosong. Hanya fakta dari dokumen (PRD §13, Figma): 5 proyek, 4 kelompok skill, teks hero/manifesto/fakta. Tanpa kanal kontak, tanpa CV, tanpa aktivitas, tanpa isi case study.
- `tests/fixtures/content.ts`: data palsu berlabel "Example", hanya untuk `CONTENT_FIXTURES=1` di development.
- Gambar seed: `pnpm media` membaca `projects/` (tidak ikut git) dan menulis versi grayscale + berwarna 1600px ke `public/projects/<slug>/` beserta `lib/content/media.json`.

## Revalidasi

Webhook Sanity (POST ke `/api/revalidate`, secret = `SANITY_REVALIDATE_SECRET`, projection apa pun) menandai tag `sanity` kedaluwarsa; perubahan tampil di permintaan berikutnya. Tanpa webhook, cache kedaluwarsa sendiri setiap 1 jam.

## Mengganti gambar proyek dan Selected work (3 teratas)

**Urutan.** Proyek tampil dari `year` terbaru; `order` hanya mengurutkan proyek dengan tahun yang sama (1 = paling depan). Aktivitas tampil dari `startDate` terbaru. Urutan ini dipakai di Home, `/work`, `/activities`, dan urutan Related (semua proyek → semua aktivitas → Contact).

**Selected work = proyek dengan `featured` aktif.** Proyek featured tampil sebagai kartu besar di Home dan sampulnya mengisi galeri zoom (pusat + dua slot). Idealnya tepat 3 proyek featured, masing-masing punya cover.

### Cara 1 - Sanity Studio (langsung ke situs live, tanpa deploy)

1. Buka https://dimasjati.sanity.studio dan login dengan akun Sanity-mu (atau lokal: `cd studio && pnpm dev` → `http://localhost:3333`).
2. **Project** → pilih proyek → tab **Card**:
   - **Cover**: unggah gambar landscape ≥ 1440 px, isi **Alt text** (EN + ID). Foto portrait juga boleh: halaman akan memasangkannya dengan foto portrait pertama di Gallery, berdampingan.
   - **Featured**: aktifkan untuk 3 proyek pilihan, matikan yang lain.
3. Tab **Case study** → **Gallery**: tambah, hapus, atau urutkan screenshot.
4. **Publish**. Webhook memperbarui situs dalam beberapa detik.

Catatan: `scripts/import-seed.ts` menimpa dokumen proyek dengan isi seed. Setelah mengedit di Studio, jangan jalankan import lagi kecuali seed juga sudah disamakan.

### Cara 2 - File di repo (seed), lalu import

1. Taruh gambar mentah di `projects/<folder>/` (folder ini tidak di-commit).
2. Petakan di `scripts/prepare-media.mjs` → `SOURCES`: nama file `cover` dan pola `gallery`. Untuk screenshot HP dari video landscape, tambahkan `band: true` agar dipotong otomatis ke area gambar.
3. `pnpm media` → membuat `public/projects/<slug>/` (cover abu-abu + berwarna, gallery) dan `lib/content/media.json`.
4. Di `lib/content/seed.ts`, pakai `cover("<slug>", "<Judul>")` dan `gallery(...)`; untuk Selected work ubah `featured: true/false`.
5. Kirim ke Sanity: `cd studio && pnpm exec sanity exec scripts/import-seed.ts --with-user-token`. Kalau ada perubahan kode juga, deploy ulang.
