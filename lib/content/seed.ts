import type { PortableTextBlock } from "next-sanity";
import activityMedia from "./activity-media.json";
import media from "./media.json";
import type { I18n, RawContent, RawDecision, RawImage } from "./types";

/** Plain paragraphs as portable text (same shape Sanity stores). */
const blocks = (...paragraphs: string[]): PortableTextBlock[] =>
  paragraphs.map((text, i) => ({ _type: "block", _key: `p${i}`, style: "normal", markDefs: [], children: [{ _type: "span", _key: `s${i}`, text, marks: [] }] }));

const rich = (en: string[], id: string[]): I18n<PortableTextBlock[]> => ({ en: blocks(...en), id: blocks(...id) });
const decision = ([enTitle, enBody]: [string, string], [idTitle, idBody]: [string, string]): RawDecision => ({
  title: { en: enTitle, id: idTitle },
  body: { en: enBody, id: idBody },
});

function activityPhoto(slug: keyof typeof activityMedia, index: number, alt: I18n): RawImage {
  const p = activityMedia[slug][index]!;
  return { url: p.src, grayUrl: p.gray, width: p.width, height: p.height, alt };
}

// Local fallback (PRD F-12). Case-study text comes from the owner's case-study template
// (docs/Template Case Study), checked against the public GitHub repos; Sanity overrides it.
type MediaKey = keyof typeof media;

function cover(slug: MediaKey, title: string): RawImage {
  const c = media[slug].cover;
  return { url: c.color, grayUrl: c.src, width: c.width, height: c.height, alt: { en: `${title} — cover`, id: `${title} — sampul` } };
}

function gallery(slug: MediaKey, title: string): RawImage[] {
  return media[slug].gallery.map((g, i) => ({
    url: g.src,
    width: g.width,
    height: g.height,
    alt: { en: `${title} — screenshot ${i + 1}`, id: `${title} — tangkapan layar ${i + 1}` },
  }));
}

export const seed: RawContent = {
  settings: {
    heroStatement: {
      en: "Software engineer turning curiosity into *crafted* products",
      id: "Software engineer yang meramu rasa ingin tahu menjadi produk yang *matang*",
    },
    manifesto: {
      en: "I learn by building. Every project adds one more layer of depth, from *interface* to model to server.",
      id: "Saya belajar dengan membangun. Setiap proyek menambah satu lapis kedalaman, dari *antarmuka* ke model hingga server.",
    },
    email: "jati.satria000@gmail.com",
    linkedin: "https://www.linkedin.com/in/dimasjatisatria",
    github: "https://github.com/DimasJatiS",
  },
  projects: [
    {
      title: "TBXpert",
      slug: "tbxpert",
      featured: true,
      order: 3,
      summary: {
        en: "AI app that screens for tuberculosis from cough audio, with medication reminders.",
        id: "Aplikasi AI untuk skrining TBC dari audio batuk, dilengkapi pengingat minum obat.",
      },
      role: "AI engineer & backend integration",
      year: "2026",
      team: "Sakha Syakh (lead) · Aditya Lucky Zulkarnaen (backend) · Tito Alla Khairi (frontend)",
      stack: ["Flutter", "FastAPI", "HeAR embeddings", "Gemini API", "Firebase"],
      glyph: "tbxxpert",
      cover: cover("tbxxpert", "TBXpert"),
      galleryTile: true,
      repoUrl: "https://github.com/AdityaZulkarnaen/TBXpert",
      problem: rich(
        ["Many people with a lingering cough never get checked, yet tuberculosis needs to be caught early. After a diagnosis, patients take medication for months, and a missed dose can undo the treatment."],
        ["Banyak orang dengan batuk lama tidak segera memeriksakan diri, padahal TB perlu ditangani sejak awal. Setelah terdiagnosis pun, pasien harus disiplin minum obat dalam waktu panjang, dan satu dosis yang terlewat bisa menggagalkan pengobatan."],
      ),
      process: rich(
        [
          "TBXpert only asks for a recorded cough. The recording goes to a model I trained on normal and TB cough data, and the result is shown as an early screening. It is not a diagnosis: the app always points the user to a doctor for a proper check.",
          "I served the model as a separate API (TBC Audio Classifier, packaged with Docker), so the Flutter app calls a single endpoint, and I worked on the part of the backend that connects the online model to the app's screening logic. Around it the team added a Gemini chatbot for questions about TB, medication reminders synced to Google Calendar, and an automatic email to the person in charge when a patient misses a dose confirmation.",
        ],
        [
          "TBXpert cukup meminta pengguna merekam suara batuk. Rekaman dikirim ke model AI yang saya latih dari dataset batuk normal dan batuk TB, lalu hasilnya ditampilkan sebagai skrining awal. Hasil ini bukan diagnosis: aplikasi selalu mengarahkan pengguna berkonsultasi ke dokter untuk pemeriksaan lanjutan.",
          "Model saya sajikan sebagai API terpisah (TBC Audio Classifier, dikemas dengan Docker) sehingga aplikasi Flutter hanya memanggil satu endpoint, dan saya ikut mengerjakan bagian backend yang menyambungkan model yang sudah online ke logika skrining aplikasi. Di sekelilingnya tim menambahkan chatbot Gemini untuk pertanyaan seputar TB, pengingat obat yang tersinkron ke Google Calendar, dan email otomatis ke PIC bila pasien terlambat mengonfirmasi dosis.",
        ],
      ),
      decisions: [
        decision(
          ["HeAR embeddings instead of an audio model from scratch", "The TB cough dataset is small, so a light DNN/MLP classifier on top of pretrained health-audio embeddings made more sense than training a large model."],
          ["Embedding HeAR, bukan model audio dari nol", "Dataset batuk TB kecil, jadi klasifier ringan (DNN/MLP) di atas embedding audio kesehatan yang sudah terlatih lebih masuk akal daripada melatih model besar."],
        ),
        decision(
          ["Screening, not diagnosis", "Every result points to a doctor, because the model can be wrong and medical decisions belong to health workers."],
          ["Skrining, bukan diagnosis", "Setiap hasil selalu mengarahkan ke dokter, karena model bisa salah dan keputusan medis tetap milik tenaga kesehatan."],
        ),
      ],
      results: rich(
        ["Finalist at the GDGoC UGM competition.", "The full flow works in the app: record a cough, get a screening result, get referred to a doctor, plus the chatbot and medication reminders."],
        ["Finalis kompetisi GDGoC UGM.", "Alur lengkap berjalan di aplikasi: rekam batuk, hasil skrining, arahan ke dokter, ditambah chatbot dan pengingat obat."],
      ),
      gallery: gallery("tbxxpert", "TBXpert"),
    },
    {
      title: "AI CV Screen",
      slug: "ai-cv-screen",
      featured: true,
      order: 5,
      summary: {
        en: "Recruitment screening that reads CVs with Gemini and scores candidates by skill relevance.",
        id: "Screening rekrutmen yang membaca CV dengan Gemini dan memberi skor kandidat berdasarkan relevansi skill.",
      },
      role: "Backend & AI logic",
      year: "2026",
      team: "Ihsan Dwi Andika (frontend)",
      stack: ["Node.js", "Gemini API", "PostgreSQL", "Prisma", "Next.js"],
      glyph: "cv",
      cover: cover("ai-cv-screen", "AI CV Screen"),
      galleryTile: true,
      liveUrl: "https://ai-recruitment-screening-gdg-web.vercel.app/",
      repoUrl: "https://github.com/DimasJatiS/ai-recruitment-screening-gdg",
      problem: rich(
        ["HR teams read dozens to hundreds of CVs for a single opening. Manual screening is slow, and a relevant candidate can be missed just because their CV uses different words."],
        ["Tim HR harus membaca puluhan sampai ratusan CV untuk satu lowongan. Penyaringan manual lambat, dan kandidat yang relevan bisa terlewat hanya karena CV-nya memakai istilah berbeda."],
      ),
      process: rich(
        [
          "An uploaded CV is parsed by the Gemini API into structured data. The system then scores the candidate on three things: work experience related to the opening, keyword match, and supporting experience and certificates. The score helps HR decide who to call first.",
          "I wrote all of the backend logic, from parsing to scoring, as separate modules so the scoring criteria are easy to change.",
        ],
        [
          "CV yang diunggah diurai oleh Gemini API menjadi data terstruktur. Sistem lalu menilai kandidat dari tiga sisi: pengalaman kerja yang berkaitan dengan lowongan, kecocokan kata kunci, serta pengalaman dan sertifikat pendukung. Skornya membantu HR menentukan siapa yang dipanggil lebih dulu.",
          "Saya mengerjakan seluruh logika di backend, dari parsing sampai penilaian, sebagai modul terpisah agar kriteria penilaian mudah diubah.",
        ],
      ),
      decisions: [
        decision(
          ["Gemini for parsing, clear rules for scoring", "The language model reads CVs in any format, while the score comes from explicit criteria, so HR can see the reason behind every number."],
          ["Gemini untuk parsing, aturan jelas untuk penilaian", "Model bahasa dipakai untuk membaca CV yang formatnya beragam, sedangkan skor dihitung dari kriteria yang jelas sehingga HR bisa melihat alasan di balik setiap angka."],
        ),
      ],
      results: rich(
        ["Live on Vercel: upload a CV and the score with its reasons appears right away.", "Tested by friends."],
        ["Live di Vercel: unggah CV, lalu skor dan alasannya langsung tampil.", "Diuji oleh teman."],
      ),
    },
    {
      title: "Innofa",
      slug: "innofa",
      featured: true,
      order: 6,
      summary: {
        en: "Marketplace for developer services with chat, contracts and held payments in one app, on web and Android.",
        id: "Marketplace jasa developer dengan chat, kontrak, dan pembayaran tertahan dalam satu aplikasi, di web dan Android.",
      },
      role: "Full-stack developer",
      year: "2025",
      team: "Alvista Maula Zahra (PM) · Daffa Abiyyu Dzulfikar (frontend) · Rizki Nur Ikhsan (UI/UX)",
      stack: ["Laravel", "MySQL", "Kotlin", "Express", "Prisma", "PostgreSQL"],
      glyph: "chat",
      cover: cover("inofa", "Innofa"),
      galleryTile: true,
      repoUrl: "https://github.com/DimasJatiS/inofa-backend-mobile",
      problem: rich(
        ["Clients who want an app built usually find a developer in one place, then move to WhatsApp to negotiate and pay by direct transfer. Nothing records the agreement, and both sides carry the risk: the developer may not get paid, the client may be left halfway."],
        ["Klien yang ingin membuat aplikasi biasanya mencari developer di satu tempat, lalu berpindah ke WhatsApp untuk negosiasi dan transfer langsung untuk membayar. Tidak ada catatan kesepakatan, dan kedua pihak sama-sama menanggung risiko: developer bisa tidak dibayar, klien bisa ditinggal di tengah jalan."],
      ),
      process: rich(
        [
          "Innofa matches developers with clients like similar platforms, but the whole deal happens inside the app. Clients post projects and search developers by skill; developers show their portfolio. Both talk in an in-app chat that can send documents and photo proof, then approve the contract right in the app. Anyone who still prefers WhatsApp gets a generated link.",
          "Innofa runs as two apps. The web app is built with Laravel and MySQL, using Chatify for live chat, Laravel Breeze for authentication and Laravel Scout for search. The Android app (Kotlin) has its own backend, which I built with Express, TypeScript, Prisma and PostgreSQL: JWT authentication, developer/client roles, profiles, portfolios, projects and developer search, deployed as Vercel Serverless Functions.",
        ],
        [
          "Innofa mempertemukan developer dan klien seperti platform serupa, tetapi seluruh alurnya terjadi di dalam aplikasi. Klien memposting proyek dan mencari developer berdasarkan skill; developer menampilkan portofolio. Keduanya mengobrol lewat chat in-app yang bisa mengirim dokumen dan foto bukti, lalu menyetujui kontrak langsung di aplikasi. Bila tetap ingin memakai WhatsApp, aplikasi membuat tautannya otomatis.",
          "Innofa berjalan sebagai dua aplikasi. Versi web dibangun dengan Laravel dan MySQL, memakai Chatify untuk chat langsung, Laravel Breeze untuk autentikasi, dan Laravel Scout untuk pencarian. Aplikasi Android (Kotlin) punya backend sendiri yang saya bangun dengan Express, TypeScript, Prisma, dan PostgreSQL: autentikasi JWT, role developer/klien, profil, portofolio, proyek, dan pencarian developer, dideploy sebagai Vercel Serverless Functions.",
        ],
      ),
      decisions: [
        decision(
          ["Payment is held until both sides agree", "The client's money only reaches the developer once the app is accepted. The developer updates progress and the client can follow it, so nobody can walk away with the money."],
          ["Pembayaran ditahan sampai kedua pihak sepakat", "Dana klien baru diteruskan ke developer setelah aplikasi diterima. Developer memperbarui progres dan klien bisa memantaunya, sehingga tidak ada yang bisa kabur membawa uang."],
        ),
      ],
      results: rich(
        ["Both the web app and the Android app run the full flow: search, chat, contract and held payment.", "Tested by friends playing both developer and client."],
        ["Aplikasi web dan Android sama-sama menjalankan alur lengkap: pencarian, chat, kontrak, dan pembayaran tertahan.", "Diuji oleh teman yang mencoba peran developer dan klien."],
      ),
      gallery: gallery("inofa", "Innofa"),
    },
    {
      title: "Bloomarie Store",
      slug: "bloomarie-store",
      order: 7,
      summary: {
        en: "Flower bouquet store where buyers design their own bouquet and pay through a payment gateway.",
        id: "Toko buket bunga tempat pembeli merancang buketnya sendiri dan membayar lewat payment gateway.",
      },
      role: "Full-stack developer",
      year: "2025",
      duration: "3 months",
      team: "Solo",
      stack: ["PHP", "MySQL", "Bootstrap"],
      glyph: "flower",
      cover: cover("bloomarie-store", "Bloomarie Store"),
      galleryTile: true,
      repoUrl: "https://github.com/DimasJatiS/Bloomarie_WebApp",
      problem: rich(
        ["Small flower shops usually take orders through WhatsApp or a marketplace. Bouquet details go back and forth in chat, and the owner matches payments one by one. I wanted buyers to order and design their bouquet right in the shop, with no third party in between."],
        ["Toko bunga kecil biasanya menerima pesanan lewat WhatsApp atau marketplace. Detail buket harus ditanyakan bolak-balik lewat chat, dan pemilik toko mencocokkan pembayaran satu per satu. Saya ingin pembeli bisa memesan dan merancang buketnya sendiri langsung di toko, tanpa perantara pihak ketiga."],
      ),
      process: rich(
        [
          "Buyers pick flowers from the catalogue, then adjust the bouquet through the available options or design one from scratch. The pages are made to be pleasant to browse so buyers take their time choosing.",
          "Payment goes through a payment gateway, so buyers pay without leaving the shop. The admin still checks the payment result in the dashboard before an order is processed.",
        ],
        [
          "Pembeli memilih bunga dari katalog, lalu menyesuaikan buket lewat kolom pilihan yang tersedia, atau merancangnya dari awal. Tampilannya dibuat nyaman dijelajahi agar pembeli betah memilih.",
          "Pembayaran berjalan lewat payment gateway, jadi pembeli bisa membayar tanpa keluar dari toko. Admin tetap memeriksa hasil pembayaran di dashboard sebelum pesanan diproses.",
        ],
      ),
      decisions: [
        decision(
          ["Customisation through structured options, not chat", "Every order arrives complete, so the owner never has to ask again."],
          ["Kustomisasi lewat kolom terstruktur, bukan chat", "Setiap pesanan masuk dengan detail lengkap, jadi pemilik toko tidak perlu bertanya ulang."],
        ),
        decision(
          ["A payment gateway to pay, an admin to confirm", "Buyers pay in the shop without a manual transfer, while the admin checks the payment status before the bouquet is made, so no order is processed without the money in."],
          ["Payment gateway untuk membayar, admin untuk memastikan", "Pembeli membayar langsung di toko tanpa transfer manual, sementara admin tetap mengecek status pembayaran sebelum buket dirangkai, sehingga tidak ada pesanan yang diproses tanpa dana masuk."],
        ),
      ],
      results: rich(
        ["The full flow works: choose flowers, customise the bouquet, pay through the gateway, admin confirms.", "Tested by friends as buyers."],
        ["Alur lengkap berjalan: pilih bunga, kustomisasi buket, bayar lewat gateway, admin memastikan pembayaran.", "Diuji oleh teman sebagai pembeli."],
      ),
      gallery: gallery("bloomarie-store", "Bloomarie Store"),
    },
    {
      title: "SIAKAD",
      slug: "siakad",
      order: 4,
      summary: {
        en: "Academic information system for Universitas Global Nusantara: library, tuition, letters and thesis supervision.",
        id: "Sistem informasi akademik Universitas Global Nusantara: perpustakaan, pembayaran UKT, persuratan, dan bimbingan TA.",
      },
      role: "Frontend developer",
      year: "2026",
      team: "Alvista Maula Zahra (lead) · Daffa Abiyyu Dzulfikar (backend) · Rizki Nur Ikhsan (UI/UX)",
      stack: ["Next.js"],
      glyph: "grid",
      cover: cover("siakad", "SIAKAD"),
      galleryTile: true,
      liveUrl: "https://fe-sia-ugn-ten.vercel.app/",
      problem: rich(
        ["Academic errands were scattered: book loans written down by hand, tuition payments checked one by one, letters passed around on paper, and thesis supervision arranged over chat. Students, lecturers and admins had no single place to see the status of anything."],
        ["Urusan akademik tersebar di banyak tempat: peminjaman buku dicatat manual, pembayaran kuliah dicek satu per satu, surat berpindah tangan lewat kertas, dan bimbingan tugas akhir diatur lewat chat. Mahasiswa, dosen, dan admin tidak punya satu tempat untuk melihat statusnya."],
      ),
      process: rich(
        [
          "We brought four services into one system with three roles: student, lecturer and admin. In the library, students and lecturers borrow books and an admin approves the loan. Tuition payments go through an escrow that forwards the money to the destination bank. Letters move between students, lecturers and admins, and thesis supervision connects students with their supervisors.",
          "I built the frontend: the pages for each role in Next.js, wired to the backend API.",
        ],
        [
          "Kami menyatukan empat layanan dalam satu sistem dengan tiga peran: mahasiswa, dosen, dan admin. Di perpustakaan, mahasiswa dan dosen bisa meminjam buku, lalu admin menyetujui peminjaman itu. Pembayaran uang kuliah memakai escrow yang meneruskan dana ke bank tujuan. Persuratan berjalan antara mahasiswa, dosen, dan admin, dan bimbingan tugas akhir menghubungkan mahasiswa dengan dosen pembimbingnya.",
          "Saya mengerjakan frontend: membangun halaman tiap peran di Next.js dan menghubungkannya ke API backend.",
        ],
      ),
      decisions: [
        decision(
          ["Every important transaction goes through an approval", "Book loans wait for an admin and payments are held in escrow before they reach the bank, so every step has a status that can be tracked."],
          ["Setiap transaksi penting melewati persetujuan", "Peminjaman buku menunggu admin, dan pembayaran ditahan escrow sebelum sampai ke bank, sehingga setiap langkah punya status yang bisa dilacak."],
        ),
      ],
      results: rich(
        ["The frontend is live on Vercel with separate flows for students, lecturers and admins.", "Four services (library, payments, letters, thesis supervision) in one system."],
        ["Frontend live di Vercel dengan alur terpisah untuk mahasiswa, dosen, dan admin.", "Empat layanan (perpustakaan, pembayaran, persuratan, bimbingan TA) dalam satu sistem."],
      ),
      gallery: gallery("siakad", "SIAKAD"),
    },
    {
      title: "Shardfall",
      slug: "shardfall",
      order: 2,
      summary: {
        en: "A 5-minute browser battle royale where a Monad smart contract, not the organiser, holds the tickets and pays the prizes.",
        id: "Battle royale 5 menit di browser; tiket dan hadiah turnamen dipegang smart contract di Monad, bukan panitia.",
      },
      role: "Smart contract & Web3 developer",
      year: "2026",
      team: "Delviano Khayru Attahira (backend) · Prihastomo Budi Satrio (frontend)",
      stack: ["Solidity", "Hardhat", "Monad", "Colyseus", "React", "Three.js"],
      glyph: "console",
      cover: cover("shardfall", "Shardfall"),
      galleryTile: true,
      repoUrl: "https://github.com/DimasJatiS/SHARDFALL-WEB3Game",
      problem: rich(
        ["At community and campus game tournaments the organiser holds the prize money. Prizes arrive late, get cut or never arrive, and players cannot check any of it. Players also cannot prove that loot, chests and the zone were not rigged, and one match usually takes too long to fit between other things."],
        ["Di turnamen game komunitas dan kampus, hadiah dipegang panitia. Hadiah bisa telat, dipotong, atau tidak sampai, dan pemain tidak bisa memeriksanya. Pemain juga tidak bisa membuktikan loot, isi peti, dan zona tidak diatur. Satu sesi game pun biasanya panjang, sehingga sulit diikuti di sela kegiatan."],
      ),
      process: rich(
        [
          "We built Shardfall at Monad Blitz Jogja (24 October 2026): an isometric battle royale for 3 to 10 players that ends in 5 minutes. Players explore, clear monster camps, open chests and collect coins; anyone below the coin quota at the end of a zone phase is out.",
          "Gameplay runs on a normal real-time server (Colyseus, 20 ticks per second). My part was the on-chain side, and the chain only does the three things that need trust: holding the ticket money, proving the map was not changed, and paying the winners. A 0.1 MON ticket goes from the player's wallet straight into the MatchEscrow contract, so the server never touches player funds.",
          "Communities and venues can also run tournaments, with vouchers to redeem as an extra reward. The feature works; in the demo the vouchers are a mock redeemed with testnet MON.",
        ],
        [
          "Kami membangun Shardfall di Monad Blitz Jogja (24 Oktober 2026): battle royale isometrik untuk 3–10 pemain yang selesai dalam 5 menit. Pemain menjelajah, membersihkan kamp monster, membuka peti, dan mengumpulkan koin; yang di bawah kuota koin pada akhir tiap fase zona tereliminasi.",
          "Gameplay berjalan di server real-time biasa (Colyseus, 20 tick per detik). Bagian saya adalah sisi on-chain, dan blockchain hanya dipakai untuk tiga hal yang memang butuh kepercayaan: memegang uang tiket, membuktikan peta tidak diubah, dan membayar pemenang. Tiket 0,1 MON masuk dari dompet pemain langsung ke kontrak MatchEscrow, jadi server tidak pernah memegang dana pemain.",
          "Komunitas dan venue juga bisa menjadi penyelenggara turnamen, dengan penukaran voucher sebagai imbalan tambahan. Fitur ini sudah jadi; di versi demo, voucher masih berupa mock yang ditebus dengan MON di testnet.",
        ],
      ),
      decisions: [
        decision(
          ["Commit–reveal for the map seed", "When a match is created the server stores keccak256(seed) on-chain before anyone joins, then reveals the seed at the end. The contract rejects settlement if the hash does not match, and the results screen shows a Verified badge."],
          ["Commit–reveal untuk seed peta", "Saat match dibuat, server menyimpan keccak256(seed) on-chain sebelum ada pemain yang masuk, lalu membuka seed di akhir. Kontrak menolak settlement bila hash tidak cocok, dan layar hasil menampilkan badge Verified."],
        ),
        decision(
          ["The contract pays out in one transaction", "settleMatch sends 5% to the treasury and splits the rest 60/25/15 between the top three, with no organiser involved."],
          ["Hadiah dibayar kontrak dalam satu transaksi", "settleMatch mengirim 5% ke treasury dan membagi sisanya 60/25/15 untuk tiga besar, tanpa campur tangan panitia."],
        ),
        decision(
          ["Player money always has a way back", "If a lobby has fewer than 3 players after 2 minutes, or a match is not settled within 15 minutes, every player can call refund. Skins are cosmetic ERC-1155 tokens (0.05 MON), so there is no pay-to-win."],
          ["Uang pemain selalu bisa kembali", "Bila lobi tidak terisi minimal 3 pemain dalam 2 menit, atau match tidak diselesaikan dalam 15 menit, tiap pemain bisa memanggil refund. Skin dijual sebagai token ERC-1155 kosmetik (0,05 MON), jadi tidak ada pay-to-win."],
        ),
      ],
      results: rich(
        ["9 Hardhat tests for the contracts: invalid transactions rejected, payouts for 10 and 4 players, refunds and skin purchases.", "One match uses 3 kinds of on-chain transaction: createMatch, joinMatch from each player's wallet (live in the demo) and settleMatch."],
        ["9 tes Hardhat untuk kontrak: transaksi tidak sah ditolak, pembayaran untuk 10 dan 4 pemain, refund, dan pembelian skin.", "Satu match memakai 3 jenis transaksi on-chain: createMatch, joinMatch dari dompet tiap pemain (live saat demo), dan settleMatch."],
      ),
      gallery: gallery("shardfall", "Shardfall"),
    },
    {
      title: "ChainFolio",
      slug: "chainfolio",
      order: 1,
      summary: {
        en: "Crypto portfolio tracker that values your coins with CoinGecko prices, shipped through a full CI/CD pipeline.",
        id: "Pencatat portofolio kripto yang menghitung nilai koin dari harga CoinGecko, dengan pipeline CI/CD penuh.",
      },
      role: "Solo developer",
      year: "2026",
      team: "Solo",
      stack: ["Laravel 13", "Vue 3", "MySQL", "Docker", "GitHub Actions"],
      glyph: "portfolio",
      cover: cover("chainfolio", "ChainFolio"),
      gallery: gallery("chainfolio", "ChainFolio"),
      galleryTile: true,
      repoUrl: "https://github.com/DimasJatiS/uts-pl-24-541641-SV-24935",
      problem: rich(
        ["Coins kept in a hardware wallet are safe, but their value is not visible at a glance. To know the portfolio total and the profit or loss, the owner has to look up the price of every coin."],
        ["Koin yang disimpan di hardware wallet aman, tetapi nilainya tidak terlihat sekilas. Untuk tahu total portofolio dan untung/rugi, pemiliknya harus mengecek harga tiap koin satu per satu."],
      ),
      process: rich(
        [
          "Users sign up and enter the coins they hold, and ChainFolio works out the portfolio value and profit or loss from the latest CoinGecko prices. Holdings are entered by hand for now, because the app cannot read a hardware wallet directly yet; that is the next step.",
          "I build it alone and it is still in progress. The focus is not the number of features but how the app is built and shipped: every change is built and packaged automatically before it can run.",
        ],
        [
          "Pengguna mendaftar, mencatat koin yang dimiliki, lalu ChainFolio menghitung nilai portofolio dan untung/rugi dari harga terbaru CoinGecko. Koin masih diinput manual karena aplikasi belum tersambung langsung ke hardware wallet; membaca saldo langsung dari wallet adalah tahap berikutnya.",
          "Saya mengerjakannya sendiri dan masih dikembangkan. Fokus utamanya bukan banyaknya fitur, tetapi cara aplikasi dibangun dan dikirim: setiap perubahan dibangun dan dikemas otomatis sebelum bisa dijalankan.",
        ],
      ),
      decisions: [
        decision(
          ["CI/CD before features", "GitHub Actions builds a multi-stage Docker image and pushes it to the GitHub Container Registry, so what runs is always what passed the pipeline."],
          ["CI/CD lebih dulu daripada fitur", "GitHub Actions membangun image Docker multi-stage dan mendorongnya ke GitHub Container Registry, sehingga versi yang berjalan selalu sama dengan yang lolos pipeline."],
        ),
        decision(
          ["Prices cached for 60 seconds", "The backend does not call CoinGecko on every request, so the app stays fast and stays under the API rate limit."],
          ["Harga di-cache 60 detik", "Backend tidak memanggil CoinGecko di setiap permintaan, sehingga aplikasi tetap cepat dan tidak terkena batas rate API."],
        ),
        decision(
          ["One command to run everything", "Docker Compose starts the frontend (nginx), the backend (FrankenPHP + Laravel) and MySQL together."],
          ["Satu perintah untuk menjalankan semuanya", "Docker Compose menyalakan frontend (nginx), backend (FrankenPHP + Laravel), dan MySQL sekaligus."],
        ),
      ],
      results: rich(
        ["The whole stack starts with one Docker Compose command.", "Every push builds an image automatically with GitHub Actions and stores it in the GitHub Container Registry."],
        ["Seluruh stack menyala dengan satu perintah Docker Compose.", "Setiap push membangun image secara otomatis lewat GitHub Actions dan menyimpannya di GitHub Container Registry."],
      ),
    },
  ],
  activities: [
    {
      slug: "pimnas-39",
      glyph: "chicken",
      title: { en: "PIMNAS 39 — National finalist, PKM-RE", id: "PIMNAS 39 — Finalis nasional, PKM-RE" },
      org: "Belmawa · Kemdiktisaintek",
      type: "competition",
      // shortcut: only the year is shown; set the exact date in Sanity.
      startDate: "2026-11-01",
      summary: {
        en: "Finalist at Indonesia's national student science week with Chromozorb, a natural feed additive for broiler chickens.",
        id: "Finalis Pekan Ilmiah Mahasiswa Nasional bersama Chromozorb, pakan tambahan alami untuk ayam broiler.",
      },
      body: {
        en: blocks(
          "Chromozorb: feed additive nanoparticles based on Chromolaena odorata (Siam weed) leaves as a natural microplastic adsorbent to reduce oxidative stress in broiler chickens.",
          "The product is a natural feed additive for broilers that uses chitosan nanoparticles as the carrier for Chromolaena odorata leaf extract. It is designed to bind microplastics in the digestive tract as a natural adsorbent, and to supply natural antioxidant compounds at the same time.",
          "PIMNAS in the PKM-RE track (exact-science research) is the top national science competition for Indonesian university students: teams compete with experimental or modelling research, judged on the final report, a scientific poster and a presentation to the jury.",
          "Team: Fauzan Akbar Nugroho (lead, Faculty of Animal Science), Dhiaz Larasati (Faculty of Animal Science), Dimas Jati Satria (Applied Software Engineering), M. Fazli Makatita (Faculty of Biology) and Nabila Saver (Faculty of Pharmacy). Supervisor: Dr. Ir. Moh. Sofi'ul Anam, S.Pt., M.Sc.",
          "Held at Universitas Diponegoro, Semarang. Organised by Belmawa and Kemdiktisaintek.",
        ),
        id: blocks(
          "Chromozorb: nanopartikel feed additive berbasis daun kirinyuh (Chromolaena odorata) sebagai adsorben alami mikroplastik untuk reduksi stres oksidatif pada ayam broiler.",
          "Produk yang dikembangkan berupa inovasi pakan tambahan (feed additive) alami untuk ayam broiler berbasis nanopartikel kitosan sebagai media pembungkus yang dilengkapi ekstrak daun kirinyuh (Chromolaena odorata). Produk ini dirancang sebagai adsorben alami untuk mengikat mikroplastik di saluran pencernaan sekaligus sebagai sumber senyawa antioksidan alami.",
          "PIMNAS bidang PKM-RE (Riset Eksakta) adalah kompetisi ilmiah nasional tingkat puncak bagi mahasiswa Indonesia untuk memperlombakan temuan riset eksperimental maupun pemodelan di bidang sains dan teknologi, melalui penilaian laporan akhir, poster ilmiah, dan presentasi di hadapan dewan juri.",
          "Tim: Fauzan Akbar Nugroho (ketua, Fakultas Peternakan), Dhiaz Larasati (Fakultas Peternakan), Dimas Jati Satria (TRPL), M. Fazli Makatita (Fakultas Biologi), dan Nabila Saver (Fakultas Farmasi). Dosen pembina: Dr. Ir. Moh. Sofi'ul Anam, S.Pt., M.Sc.",
          "Lokasi: Universitas Diponegoro, Semarang. Penyelenggara: Belmawa dan Kemdiktisaintek.",
        ),
      },
      cover: activityPhoto("pimnas-39", 1, { en: "The Chromozorb team at PIMNAS 39, Universitas Diponegoro", id: "Tim Chromozorb di PIMNAS 39, Universitas Diponegoro" }),
      gallery: [
        activityPhoto("pimnas-39", 0, { en: "The team with their supervisor at PIMNAS 39", id: "Tim bersama dosen pembina di PIMNAS 39" }),
        activityPhoto("pimnas-39", 3, { en: "Preparing the Chromozorb extract in the lab", id: "Menyiapkan ekstrak Chromozorb di laboratorium" }),
        activityPhoto("pimnas-39", 2, { en: "Broiler trial pens for the feed additive", id: "Kandang uji ayam broiler untuk pakan tambahan" }),
      ],
      featured: true,
      order: 1,
    },
    {
      slug: "gelex-ugm-2025",
      glyph: "pulse",
      title: { en: "Medical team, Gelanggang Expo (GELEX) UGM 2025", id: "Tim medis Gelanggang Expo (GELEX) UGM 2025" },
      org: "Gelanggang Expo UGM",
      type: "event",
      // shortcut: only the year is shown; set the exact date in Sanity.
      startDate: "2025-01-01",
      summary: {
        en: "Medical team member at a 3-day campus expo; gave first aid to more than 10 people.",
        id: "Anggota tim medis di acara 3 hari; memberi pertolongan pertama kepada lebih dari 10 orang.",
      },
      body: {
        en: blocks(
          "For the three days of Gelanggang Expo I served on the medical team on standby for participants and visitors. We looked after more than 10 people who needed first aid and referred those who needed further care.",
          "The role taught me to stay calm and decide quickly in the middle of a crowd.",
        ),
        id: blocks(
          "Selama tiga hari Gelanggang Expo, saya bertugas di tim medis yang siaga untuk peserta dan pengunjung. Kami menangani lebih dari 10 orang yang membutuhkan pertolongan pertama dan merujuk yang perlu penanganan lanjut.",
          "Peran ini mengajarkan saya untuk tetap tenang dan cepat mengambil keputusan di tengah keramaian.",
        ),
      },
      cover: activityPhoto("gelex-ugm-2025", 2, { en: "The GELEX UGM 2025 medical team", id: "Tim medis GELEX UGM 2025" }),
      gallery: [
        activityPhoto("gelex-ugm-2025", 0, { en: "Medical team group photo at GELEX UGM 2025", id: "Foto bersama tim medis GELEX UGM 2025" }),
        activityPhoto("gelex-ugm-2025", 1, { en: "Photo strip of the GELEX medical team", id: "Photo strip tim medis GELEX" }),
      ],
      featured: true,
      order: 2,
    },
    {
      slug: "long-distance-running",
      glyph: "stopwatch",
      title: { en: "Long-distance running: two half marathons and a full marathon", id: "Lari jarak jauh: dua half marathon dan satu full marathon" },
      type: "event",
      startDate: "2026-01-01",
      summary: {
        en: "Finished Mandiri Jogja Marathon (half), Pocari Sweat Run Bandung (half) and Borobudur Marathon (full).",
        id: "Menyelesaikan Mandiri Jogja Marathon (HM), Pocari Sweat Run Bandung (HM), dan Borobudur Marathon (FM).",
      },
      body: {
        en: blocks(
          "Outside classes and projects I run regularly and have taken part in several large races: Mandiri Jogja Marathon 2026 (half marathon), Pocari Sweat Run Bandung 2026 (half marathon) and Borobudur Marathon (full marathon).",
          "Running gives me a break from work, keeps body and mind healthy, and has widened my circle of friends beyond campus.",
        ),
        id: blocks(
          "Di luar kuliah dan proyek, saya rutin berlari dan mengikuti beberapa lomba besar: Mandiri Jogja Marathon 2026 kategori half marathon, Pocari Sweat Run Bandung 2026 kategori half marathon, dan Borobudur Marathon kategori full marathon.",
          "Berlari memberi saya jeda dari pekerjaan, menjaga badan dan pikiran tetap sehat, sekaligus memperluas jejaring pertemanan di luar kampus.",
        ),
      },
      featured: true,
      order: 3,
    },
    {
      slug: "revogy-2026",
      glyph: "podium",
      title: { en: "IT operator, REVOGY 2026", id: "Operator IT, REVOGY 2026" },
      org: "Society of Renewable Energy UGM",
      type: "competition",
      startDate: "2026-03-08",
      summary: {
        en: "Ran the OBS broadcast and designed event visuals for REVOGY 2026, SRE UGM's international energy case competition with 300+ teams from Indonesia, Japan, Australia and the US.",
        id: "Mengoperasikan siaran OBS dan membuat desain acara untuk REVOGY 2026, kompetisi studi kasus energi internasional SRE UGM dengan 300+ tim dari Indonesia, Jepang, Australia, dan Amerika Serikat.",
      },
      body: {
        en: blocks(
          "REVOGY 2026 is the international energy competition of the Society of Renewable Energy UGM, with a business case and a mini case track. More than 300 teams and individuals took part, from Indonesia and from countries such as Japan, Australia and the United States.",
          "As IT operator I ran the OBS broadcast for the sessions and made several of the designs the event needed.",
        ),
        id: blocks(
          "REVOGY 2026 adalah kompetisi energi internasional Society of Renewable Energy UGM, dengan kategori business case dan mini case. Lebih dari 300 tim dan peserta individu ikut serta, dari Indonesia dan negara lain seperti Jepang, Australia, dan Amerika Serikat.",
          "Sebagai operator IT, saya mengoperasikan siaran OBS untuk sesi acara dan membuat beberapa desain yang dibutuhkan acara.",
        ),
      },
      cover: activityPhoto("revogy-2026", 0, { en: "Running the REVOGY 2026 talk show broadcast", id: "Menjalankan siaran talk show REVOGY 2026" }),
      featured: true,
      order: 4,
    },
    {
      slug: "sre-ugm",
      glyph: "bolt",
      title: { en: "Research & Innovation, Society of Renewable Energy UGM", id: "Research & Innovation, Society of Renewable Energy UGM" },
      org: "Society of Renewable Energy UGM",
      type: "organization",
      // shortcut: only the year is shown; set the exact start and end dates in Sanity.
      startDate: "2025-09-01",
      endDate: "2026-08-31",
      summary: {
        en: "Solar & electronics team in the Research and Innovation division.",
        id: "Tim solar & elektronika di divisi Research and Innovation.",
      },
      body: {
        en: blocks("Member of the solar and electronics team in the Research and Innovation division of the Society of Renewable Energy UGM, for the 2025–2026 term."),
        id: blocks("Anggota tim solar dan elektronika di divisi Research and Innovation Society of Renewable Energy UGM, periode 2025–2026."),
      },
      cover: activityPhoto("sre-ugm", 0, { en: "The SRE UGM Research and Innovation division", id: "Divisi Research and Innovation SRE UGM" }),
      featured: true,
      order: 5,
    },
    {
      slug: "dbl-yogyakarta-2025",
      glyph: "basketball",
      title: { en: "Medical support team, DBL Yogyakarta 2025", id: "Tim medis, DBL Yogyakarta 2025" },
      org: "DBL Indonesia",
      type: "event",
      startDate: "2025-10-17",
      endDate: "2025-10-31",
      summary: {
        en: "Medical support for players and spectators over two weeks of Indonesia's high-school basketball league at GOR UNY, with 45 teams competing.",
        id: "Dukungan medis untuk pemain dan penonton selama dua pekan liga basket pelajar DBL di GOR UNY, diikuti 45 tim.",
      },
      body: {
        en: blocks(
          "DBL Yogyakarta 2025 ran from 17 to 31 October 2025 at GOR UNY, with 27 boys' and 18 girls' high-school teams.",
          "I was part of the medical support team on standby for players and spectators throughout the series.",
        ),
        id: blocks(
          "DBL Yogyakarta 2025 berlangsung 17–31 Oktober 2025 di GOR UNY, diikuti 27 tim putra dan 18 tim putri SMA.",
          "Saya tergabung di tim medis yang siaga untuk pemain dan penonton selama rangkaian seri berlangsung.",
        ),
      },
      featured: true,
      order: 6,
    },
  ],
  skills: [
    { title: { en: "Frontend & Creative", id: "Frontend & Kreatif" }, items: ["React", "Next.js", "TypeScript", "Tailwind CSS", "GSAP", "three.js / R3F"] },
    { title: { en: "Backend & Data", id: "Backend & Data" }, items: ["Node.js", "PHP / Laravel", "Python / FastAPI", "PostgreSQL", "MongoDB", "Prisma"] },
    { title: { en: "Mobile & AI", id: "Mobile & AI" }, items: ["Flutter", "Kotlin", "Java", "Gemini API", "Audio classification (DNN)"] },
    { title: { en: "Design & Collaboration", id: "Desain & Kolaborasi" }, items: ["Figma", "Illustrator", "Git", "Event management"] },
  ],
};
