import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  CloudDownload,
  Compass,
  Download,
  ExternalLink,
  HardDriveDownload,
  Laptop,
  Moon,
  RefreshCw,
  Search,
  Share,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Volume2,
  Wifi,
  WifiOff,
} from "lucide-react";
import type { AppRoute, LocalBookMeta } from "../types/emoeslife";
import {
  countCachedLocalKitabs,
  prefetchAllLocalKitabs,
  useOnlineStatus,
  usePWAInstall,
  type DetectedPlatform,
} from "../hooks/usePWAInstall";
import { FooterDisclaimer } from "./FooterDisclaimer";

interface DownloadViewProps {
  localBooks: LocalBookMeta[];
  onNavigate: (route: AppRoute) => void;
}

const PLATFORM_GUIDES: Record<
  DetectedPlatform,
  {
    label: string;
    subtitle: string;
    steps: Array<{ title: string; desc: string }>;
  }
> = {
  android: {
    label: "Android (Chrome / Edge)",
    subtitle: "Pasang langsung ke layar utama tanpa perlu mengunduh file APK terpisah.",
    steps: [
      {
        title: "Tekan tombol Pasang Aplikasi (PWA)",
        desc: "Jika tombol hijau di atas aktif, ketuk untuk langsung memunculkan dialog pemasangan resmi browser.",
      },
      {
        title: "Atau melalui menu browser (⋮)",
        desc: "Ketuk ikon titik tiga di pojok kanan atas Chrome/Edge, lalu pilih \"Pasang aplikasi\" atau \"Tambahkan ke layar utama\".",
      },
      {
        title: "Buka seperti aplikasi biasa",
        desc: "Ikon e-Moeslife muncul di layar utama, berjalan penuh tanpa bilah browser, dan dapat membaca naskah secara offline.",
      },
    ],
  },
  ios: {
    label: "iPhone / iPad (Safari)",
    subtitle: "Gunakan browser Safari untuk menambahkan e-Moeslife ke Layar Utama (Home Screen).",
    steps: [
      {
        title: "Buka e-Moeslife di Safari",
        desc: "Pastikan halaman ini dibuka menggunakan Safari (bukan browser di dalam aplikasi chat).",
      },
      {
        title: "Ketuk tombol Bagikan (Share)",
        desc: "Ketuk ikon kotak dengan panah ke atas di bilah navigasi Safari.",
      },
      {
        title: "Pilih Tambah ke Layar Utama",
        desc: "Gulir ke bawah, pilih \"Tambah ke Layar Utama\" (Add to Home Screen), lalu ketuk \"Tambah\".",
      },
    ],
  },
  desktop: {
    label: "Laptop / PC (Chrome / Edge)",
    subtitle: "Pasang sebagai aplikasi desktop mandiri di Windows, macOS, atau Linux.",
    steps: [
      {
        title: "Klik tombol Pasang Aplikasi (PWA)",
        desc: "Gunakan tombol pasang di bagian atas halaman ini atau klik ikon instalasi di sisi kanan kolom alamat browser.",
      },
      {
        title: "Konfirmasi pemasangan",
        desc: "Klik \"Install\" pada jendela konfirmasi untuk membuat pintasan aplikasi e-Moeslife.",
      },
      {
        title: "Akses cepat & mode offline",
        desc: "Aplikasi terbuka di jendela tersendiri dengan pembaruan otomatis dan naskah tersimpan lokal.",
      },
    ],
  },
};

export const DownloadView: React.FC<DownloadViewProps> = ({ localBooks, onNavigate }) => {
  const { isInstallable, isInstalled, platform, swReady, install } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [selectedGuide, setSelectedGuide] = useState<DetectedPlatform>(platform);
  const [cachedCount, setCachedCount] = useState(0);
  const [prefetching, setPrefetching] = useState(false);
  const [installFeedback, setInstallFeedback] = useState<string | null>(null);

  useEffect(() => {
    setSelectedGuide(platform);
  }, [platform]);

  useEffect(() => {
    countCachedLocalKitabs().then(setCachedCount);
  }, []);

  const handleInstallClick = async () => {
    setInstallFeedback(null);
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        setInstallFeedback("Alhamdulillah, e-Moeslife berhasil dipasang di perangkat.");
      } else {
        setInstallFeedback("Pemasangan dibatalkan. Anda dapat mengulanginya kapan saja atau mengikuti panduan di bawah.");
      }
      return;
    }

    const guideEl = document.getElementById("pwa-platform-guide");
    guideEl?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (platform === "ios") {
      setInstallFeedback("Di iPhone/iPad, silakan pasang melalui menu Bagikan (Share) → Tambah ke Layar Utama di Safari.");
    } else {
      setInstallFeedback("Jika dialog otomatis belum muncul di tampilan ini, gunakan menu browser (⋮ → Pasang aplikasi) atau buka /download.html di tab baru.");
    }
  };

  const handlePrefetchAll = async () => {
    if (prefetching) return;
    setPrefetching(true);
    try {
      const saved = await prefetchAllLocalKitabs((done) => setCachedCount(done));
      setCachedCount(saved);
    } finally {
      setPrefetching(false);
    }
  };

  const features = [
    {
      icon: <Compass className="h-5 w-5" />,
      title: "Jadwal Shalat Otomatis",
      desc: "Menyesuaikan wilayah kabupaten/kota di Indonesia lengkap dengan hitung mundur menuju waktu shalat berikutnya.",
    },
    {
      icon: <Sparkles className="h-5 w-5" />,
      title: "Tahlil, Dzikir & Yasin",
      desc: "Susunan tawasul, kalimat tahlil, dzikir ba'da shalat, Surah Yasin, Surah Ar-Rahman, dan doa penutup.",
    },
    {
      icon: <BookOpen className="h-5 w-5" />,
      title: "Al-Qur’an 30 Juz & Tafsir",
      desc: "Teks Arab, latin, terjemahan bahasa Indonesia, tafsir ayat, dan kumpulan doa harian dalam satu studio.",
    },
    {
      icon: <HardDriveDownload className="h-5 w-5" />,
      title: `${localBooks.length} Kitab Kuning Lokal`,
      desc: "Termasuk Sullamut Taufiq, Safinah An-Najah, Fathul Qarib, Ta'lim Muta'allim, Al-Hikam, dan lainnya.",
    },
    {
      icon: <Volume2 className="h-5 w-5" />,
      title: "Audio Murattal Qari",
      desc: "Putar lantunan ayat Al-Qur'an langsung dari halaman bacaan sesuai surah yang dipilih.",
    },
    {
      icon: <Search className="h-5 w-5" />,
      title: "Pencarian Cepat & Lipat Terjemah",
      desc: "Cari bacaan atau bab kitab dengan instan, serta atur mode tampilan Arab saja, terjemah saja, atau berpasangan.",
    },
    {
      icon: <RefreshCw className="h-5 w-5" />,
      title: "Pembaruan Otomatis (PWA)",
      desc: "Tidak perlu mengunduh ulang file APK setiap ada perbaikan naskah atau kitab baru — aplikasi otomatis diperbarui.",
    },
    {
      icon: <Moon className="h-5 w-5" />,
      title: "Nyaman di Semua Layar",
      desc: "Mendukung mode gelap, pilihan ukuran tulisan (A− / A / A+), serta tampilan buku yang tenang di ponsel maupun desktop.",
    },
  ];

  const activeGuide = PLATFORM_GUIDES[selectedGuide];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pt-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onNavigate({ view: "home" })}
          className="inline-flex min-h-[38px] items-center gap-2 rounded-xl border border-[#e2e8e4] bg-white px-3 text-xs font-semibold text-[#103d2c] shadow-xs transition-colors hover:bg-[#f4f7f5] dark:border-slate-800 dark:bg-[#111A27] dark:text-slate-200 dark:hover:bg-[#192638]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Beranda</span>
        </button>

        <a
          href="/download.html"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[#e2e8e4] bg-white px-3 text-xs font-semibold text-[#5e6a62] shadow-xs transition-colors hover:border-[#134a35] hover:text-[#103d2c] dark:border-slate-800 dark:bg-[#111A27] dark:text-slate-300 dark:hover:border-[#E2B354] dark:hover:text-[#E2B354]"
        >
          <span>Buka versi tautan publik</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-[#0f3b2a] bg-gradient-to-br from-[#0d3025] via-[#144734] to-[#1e5c45] p-6 text-white shadow-sm sm:p-8 dark:border-slate-800 dark:from-[#0C1522] dark:via-[#122033] dark:to-[#182B42]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-20 mix-blend-luminosity"
          style={{
            backgroundImage: "url('/assets/mosque-banner.webp')",
            backgroundPosition: "center 60%",
            backgroundSize: "cover",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full border border-[#e2b354]/25"
        />

        <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
          <div className="space-y-4 lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-lg border border-[#e2b354]/35 bg-[#e2b354]/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-[#f3d99d] uppercase">
              <Smartphone className="h-3.5 w-3.5" />
              <span>Aplikasi Web Progresif (PWA)</span>
            </div>

            <h1 className="font-display text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
              Pasang e-Moeslife langsung di perangkatmu.
            </h1>

            <p className="max-w-2xl text-sm leading-relaxed text-[#e3ebe5] sm:text-base dark:text-slate-300">
              Untuk saat ini, distribusi aplikasi e-Moeslife menggunakan <strong>file PWA</strong>{" "}
              sebagai pengganti file APK sementara. Lebih ringan, aman tanpa perlu izin sumber tidak
              dikenal, pembaruan kitab otomatis, dan tetap dapat dibuka saat offline.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {isInstalled ? (
                <div className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-[#e6c98e] px-4 text-sm font-bold text-[#1d2d22]">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Sudah Terpasang sebagai Aplikasi</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-[#e6c98e] px-5 text-sm font-bold text-[#1d2d22] shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-[#edd49f]"
                >
                  <Download className="h-4 w-4" />
                  <span>
                    {isInstallable
                      ? "Pasang Aplikasi e-Moeslife (PWA)"
                      : platform === "ios"
                      ? "Cara Pasang di iPhone / iPad"
                      : "Pasang e-Moeslife (PWA)"}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={handlePrefetchAll}
                disabled={prefetching || cachedCount >= localBooks.length}
                className="inline-flex min-h-[46px] items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/20 disabled:opacity-75"
              >
                {cachedCount >= localBooks.length ? (
                  <CheckCircle2 className="h-4 w-4 text-[#e6c98e]" />
                ) : (
                  <CloudDownload className="h-4 w-4" />
                )}
                <span>
                  {prefetching
                    ? `Menyimpan Naskah (${cachedCount}/${localBooks.length})…`
                    : cachedCount >= localBooks.length
                    ? `${localBooks.length} Kitab Siap Offline`
                    : `Simpan ${localBooks.length} Kitab Offline`}
                </span>
              </button>
            </div>

            {installFeedback && (
              <p className="rounded-xl border border-[#e2b354]/40 bg-black/20 px-3.5 py-2.5 text-xs leading-relaxed text-[#f7e7be]">
                {installFeedback}
              </p>
            )}
          </div>

          {/* Live PWA Package Status Card */}
          <div className="rounded-2xl border border-white/15 bg-black/20 p-5 backdrop-blur-xs lg:col-span-5">
            <div className="flex items-center gap-3 border-b border-white/15 pb-4">
              <img
                src="/assets/app-icon/icon.png"
                alt="Ikon Aplikasi e-Moeslife"
                className="h-14 w-14 rounded-2xl border border-white/20 bg-white object-contain p-1"
              />
              <div className="min-w-0">
                <p className="font-display text-lg font-semibold text-white">e-Moeslife</p>
                <p className="text-xs text-[#d6e4da]">Paket Aplikasi PWA · Versi 2.0</p>
              </div>
            </div>

            <dl className="mt-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[#cde0d3]">Format Distribusi</dt>
                <dd className="font-semibold text-white">PWA (Web App Standar)</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[#cde0d3]">Service Worker Offline</dt>
                <dd className="inline-flex items-center gap-1.5 font-semibold text-[#f3d99d]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>{swReady ? "Aktif & Siap" : "Menyiapkan…"}</span>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[#cde0d3]">Status Koneksi</dt>
                <dd className="inline-flex items-center gap-1.5 font-semibold text-white">
                  {isOnline ? (
                    <>
                      <Wifi className="h-3.5 w-3.5 text-emerald-300" />
                      <span>Online</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3.5 w-3.5 text-amber-300" />
                      <span>Offline (Cache Lokal)</span>
                    </>
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[#cde0d3]">Naskah Kitab Tersimpan</dt>
                <dd className="font-mono-tabular font-semibold text-white">
                  {cachedCount} / {localBooks.length} kitab
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[#cde0d3]">Kompatibilitas</dt>
                <dd className="font-semibold text-white">Android · iOS · Desktop</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Platform Installation Steps */}
      <section
        id="pwa-platform-guide"
        className="rounded-3xl border border-[#e2e8e4] bg-white p-5 shadow-xs sm:p-6 dark:border-slate-800 dark:bg-[#111A27]"
      >
        <div className="flex flex-col justify-between gap-3 border-b border-[#e8eeea] pb-4 sm:flex-row sm:items-end dark:border-slate-800">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-[#9c7d3c] uppercase dark:text-[#E2B354]">
              Panduan Pemasangan PWA
            </p>
            <h2 className="font-display mt-0.5 text-xl font-semibold text-[#103d2c] sm:text-2xl dark:text-white">
              {activeGuide.label}
            </h2>
            <p className="mt-1 text-xs text-[#5e6a62] dark:text-slate-300">{activeGuide.subtitle}</p>
          </div>

          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Pilih perangkat">
            {(
              [
                { id: "android", label: "Android", icon: <Smartphone className="h-3.5 w-3.5" /> },
                { id: "ios", label: "iPhone / iPad", icon: <Share className="h-3.5 w-3.5" /> },
                { id: "desktop", label: "Desktop", icon: <Laptop className="h-3.5 w-3.5" /> },
              ] as const
            ).map((tab) => {
              const active = selectedGuide === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedGuide(tab.id)}
                  className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition-colors ${
                    active
                      ? "bg-[#134a35] text-white dark:bg-[#E2B354] dark:text-[#0B111A]"
                      : "border border-[#dce4df] bg-white text-[#354c3e] hover:bg-[#f4f7f5] dark:border-slate-700 dark:bg-[#162131] dark:text-slate-300"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          {activeGuide.steps.map((step, idx) => (
            <div
              key={step.title}
              className="flex items-start gap-3 rounded-2xl border border-[#e8eeea] bg-[#f8faf9] p-4 dark:border-slate-800 dark:bg-[#152030]"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e3efe8] text-xs font-bold text-[#134a35] dark:bg-[#1D3557] dark:text-[#E2B354]">
                {idx + 1}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-[#103d2c] dark:text-white">{step.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-[#5e6a62] dark:text-slate-300">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Updated Features Grid */}
      <section aria-labelledby="heading-pwa-features">
        <div className="mb-3">
          <p className="text-[11px] font-semibold tracking-wider text-[#9c7d3c] uppercase dark:text-[#E2B354]">
            Kelengkapan Ruang Baca
          </p>
          <h2
            id="heading-pwa-features"
            className="font-display mt-0.5 text-xl font-semibold text-[#103d2c] sm:text-2xl dark:text-white"
          >
            Semua bacaan & kitab dalam satu aplikasi
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-[#e2e8e4] bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#111A27]"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6efe9] text-[#134a35] dark:bg-[#182942] dark:text-[#E2B354]">
                {item.icon}
              </div>
              <h3 className="text-sm font-semibold text-[#103d2c] dark:text-white">{item.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-[#5e6a62] dark:text-slate-300">
                {item.desc}
              </p>
            </article>
          ))}
        </div>
      </section>

      <FooterDisclaimer />
    </div>
  );
};
