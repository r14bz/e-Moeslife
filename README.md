# e-Moeslife — Ruang Baca Islami Digital (`v3.0.0`)

**e-Moeslife** adalah aplikasi web, Progressive Web App (PWA), dan Android native (`com.emoeslife.app`) untuk menemani ibadah harian dan kajian kitab kuning pesantren. Dirancang responsif dengan mode baca yang nyaman, tema terang dan gelap, serta dukungan pembacaan kitab kuning **100% offline**.

---

## Apa yang Baru di Versi `3.0.0`

- **Transisi Halaman & Tampilan Aplikasi yang Halus**: Animasi perpindahan halaman bacaan berarah (maju/mundur pada Al-Qur'an, Tahlil, Do'a, Pencarian Hadis, dan seluruh pembaca Kitab Kuning), pergantian layar aplikasi, tab internal, serta dialog modal yang tetap menghormati pengaturan aksesibilitas `prefers-reduced-motion`.
- **Pencarian Hadis (10 Kitab Otentik)**: Akses hadis harian, pencarian kata kunci, filter per kitab, dan loncat nomor hadis langsung dari bilah navigasi bawah maupun koleksi ibadah sehari-hari.
- **Koleksi Do'a & Dzikir Harian**: Kategori lengkap do'a harian, dzikir pagi/petang, dan fawaid yang dapat dicari serta dinavigasi dengan cepat.
- **5 Pilihan Tema Warna (Terang & Gelap)**:
  1. **Zamrud Emas** (Bawaan)
  2. **Biru Nilam** (`sapphire`)
  3. **Toska Kubah** (`teal`)
  4. **Delima Turats** (`maroon`)
  5. **Perkamen Klasik** (`sepia`)
- **Jadwal Shalat & Notifikasi Bersuara Adzan**: Penyesuaian otomatis via GPS atau daftar kabupaten/kota Indonesia, kalender Hijriyah, serta notifikasi waktu shalat dengan audio Adzan (termasuk Adzan Subuh).
- **Kompas Arah Kiblat & Masjid Terdekat**: Meminta izin lokasi dan sensor kompas secara native di Android maupun browser untuk menghitung arah kiblat & jarak ke Ka'bah, serta pencarian masjid/mushala terdekat melalui Google Maps.
- **Pembaruan Aplikasi Android In-App**: Mengunduh dan memasang pembaruan APK resmi langsung dari dalam aplikasi tanpa keluar ke browser eksternal.

---

## Fitur Utama

### 1. Ibadah & Kebutuhan Harian
- **Al-Qur'an, Murattal & Tafsir**: 30 Juz lengkap dengan teks Arab, transliterasi Latin, terjemahan bahasa Indonesia, tafsir Kemenag, penanda terakhir dibaca, salin ayat, dan pemutar murattal dari 6 qari pilihan.
- **Pencarian Hadis**: Penelusuran hadis harian dan pencarian dari 10 kitab hadis (Shahih Bukhari, Shahih Muslim, Sunan Abu Daud, Jami' Tirmidzi, Sunan Nasa'i, Sunan Ibnu Majah, Musnad Ahmad, Musnad Syafi'i, Riyadhus Shalihin, dan lainnya).
- **Tahlil, Do'a, Dzikir & Panduan Shalat**: Bacaan Tahlil & Dzikir ba'da shalat, do'a harian/dzikir pagi-petang, serta panduan wudhu dan 17 rukun shalat.
- **Cek Status Halal E-Code**: Pemeriksaan kode bahan tambahan pangan (`E100–E1521`) beserta status (*Halal*, *Doubtful/Syubhat*, *Haram*) dan penjelasan sumber bahannya.
- **Masjid Terdekat**: Peta interaktif Google Maps untuk menemukan masjid dan mushala di sekitar lokasi pengguna.

### 2. Perpustakaan Kitab Kuning Lokal (`100% Offline`)
Tersedia **29 kitab lokal** lintas disiplin ilmu dengan navigasi antar bab mengambang, pengaturan ukuran teks Arab, serta tampilan arti/syarah per bait atau pasal:
- **Aqidah**: *Aqidatul Awam*, *Tijan Daruri*, *Qathrul Ghaits*
- **Fiqih**: *Safinah An-Najah*, *Sullamut Taufiq*, *Kasyifatus Saja*, *Bahjatul Wasa'il*, *Fathul Qarib Al-Mujib*, *Fathul Mu’in*
- **Ilmu Alat (Nahwu & Sharaf)**: *Matan Al-Ajurumiyyah*, *Nadhom Imriti*, *Alfiyah Ibnu Malik*, *Al-Amtsilah at-Tashrifiyah* (Istilahi, Lughawi & Catatan I'lal)
- **Tasawuf & Adab**: *Al-Hikam Al-Atha'iyyah*, *Ta'lim Al-Muta'allim*, *Bidayatul Hidayah*, *Nashoihul Ibad*, *Futuhul Ghaib*
- **Hadis & Musthalah**: *Mandhumah Al-Baiquniyyah*, *Arba'in Nawawi*, *Bulughul Maram*, *Riyadhus Shalihin*, *Muwatta Imam Malik*, *Shahih Muslim*, *Shahih Bukhari*
- **Keluarga & Tafsir**: *Fathul Izar*, *Qurrotul Uyun*, *Uqudulujain*, *Tafsir Jalalain*

---

## Teknologi yang Digunakan

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons
- **Backend & Proxy API**: Node.js + Express (`server.ts`) dan Serverless Functions (`/api/*.js` untuk Vercel)
- **PWA**: `vite-plugin-pwa` (mendukung pemasangan layar utama dan cache aset offline)
- **Android Native**: Capacitor 8 (`@capacitor/android`, `@capacitor/geolocation`, `@capacitor/local-notifications`) dengan plugin native khusus kompas kiblat (`QiblaCompassPlugin`), penjadwalan notifikasi shalat, pemeriksa update latar belakang (`ApkUpdateChecker`), dan installer APK internal (`ApkInstallerPlugin`).

---

## Struktur Proyek Ringkas

```text
├── api/                         # Serverless API proxy (doa, ecode, hadits, kitab) untuk deployment
├── public/                      # Aset statis, audio notifikasi/adzan, ikon, dan halaman download.html
├── scripts/
│   ├── configure-android-build.mjs  # Konfigurasi Gradle, signing keystore, plugin native & notifikasi Android
│   ├── generate-android-icons.py    # Generator ikon launcher Android multi-densitas
│   └── generate-release-notes.mjs   # Generator catatan rilis & metadata versi APK
├── src/
│   ├── components/              # Komponen UI, hub bacaan, dan 13+ pembaca kitab kuning
│   ├── data/                    # Korpus data kitab kuning offline, tahlil, wudhu, dan shalat
│   ├── services/                # Layanan jadwal shalat, kiblat, hadis, doa, E-Code, audio & APK updater
│   ├── types/                   # Definisi tipe TypeScript
│   ├── utils/                   # Utilitas kitabEngine, tema, dan navigasi
│   ├── App.tsx                  # Router utama aplikasi & transisi layar
│   └── index.css                # Tema warna, tipografi Arab, dan animasi transisi
├── server.ts                    # Server Express + Vite middleware (port 3000)
├── capacitor.config.ts          # Konfigurasi Capacitor Android (com.emoeslife.app)
└── .github/workflows/build-apk.yml  # CI/CD build & rilis GitHub Release APK otomatis
```

---

## Variabel Lingkungan

Salin `.env.example` menjadi `.env` saat menjalankan secara lokal dan isi sesuai kebutuhan:

| Variabel | Keterangan |
| :--- | :--- |
| `AHMADSANUSI_API_KEY` | API key sisi server untuk layanan proxy `/api/kitab`, `/api/hadits`, `/api/doa`, dan `/api/ecode`. |
| `VITE_GOOGLE_MAPS_API_KEY` | Kunci Google Maps Platform untuk fitur Pencarian Masjid Terdekat. |
| `APP_URL` | URL publik aplikasi saat di-hosting. |
| `GEMINI_API_KEY` | Variabel lingkungan tambahan untuk integrasi API Gemini di sisi server bila diperlukan. |

---

## Endpoint API Backend

Server (`server.ts`) maupun folder `/api` menyediakan rute berikut:

- `GET /api/maps-config` — Mengembalikan konfigurasi kunci Google Maps untuk peta masjid terdekat.
- `GET /api/kitab?action=list|detail|chapter|search` — Proxy daftar, detail, bab, dan pencarian kitab eksternal.
- `GET /api/hadits?action=daily|books|list|search|detail` — Proxy hadis harian, daftar 10 kitab hadis, pencarian, dan detail hadis.
- `GET /api/doa?action=categories|list|search|detail` — Proxy kategori, daftar, pencarian, dan detail do'a & dzikir harian.
- `GET /api/ecode?action=summary|list|search|detail` — Proxy ringkasan, daftar, filter status/jenis, dan detail status halal E-Code.

---

## Menjalankan Secara Lokal

Pastikan **Node.js 20+** (disarankan Node.js 22) sudah terpasang.

```bash
# 1. Instal dependensi
npm install

# 2. Jalankan server pengembangan (Express + Vite pada port 3000)
npm run dev

# 3. Pemeriksaan tipe TypeScript
npm run lint

# 4. Build aset produksi
npm run build

# 5. Jalankan build produksi
npm start
```

---

## Build & Rilis Android APK

### Build Lokal (Capacitor + Gradle)

```bash
# 1. Bangun aset web produksi
npm run build

# 2. Tambahkan / sinkronkan proyek Android
npm run cap:add     # hanya saat pertama kali folder android belum ada
npm run cap:sync

# 3. Terapkan ikon dan konfigurasi plugin native Android
python3 scripts/generate-android-icons.py
APK_VERSION_CODE=1 APK_VERSION_NAME=3.0.0 node scripts/configure-android-build.mjs

# 4. Buka di Android Studio atau build melalui Gradle
npm run cap:open
```

### Otomatisasi GitHub Actions (`v3.0-android`)

Workflow `.github/workflows/build-apk.yml` membangun `e-moeslife.apk` setiap ada push ke `main` (kecuali perubahan `*.md`) atau melalui pemicu manual `workflow_dispatch`, lalu menerbitkannya ke GitHub Releases (`v3.0-android`).

Untuk menandatangani APK dengan **Release Keystore** resmi agar pengguna dapat memperbarui aplikasi tanpa menghapus data tersimpan, atur *Repository Secrets* berikut di GitHub:

- `ANDROID_KEYSTORE_BASE64` — File `.jks`/`.keystore` yang di-encode ke Base64
- `ANDROID_KEYSTORE_PASSWORD` — Kata sandi keystore
- `ANDROID_KEY_ALIAS` — Alias kunci rilis
- `ANDROID_KEY_PASSWORD` — Kata sandi alias kunci
- `VITE_GOOGLE_MAPS_API_KEY` — Kunci Google Maps untuk fitur peta di dalam build web/APK
