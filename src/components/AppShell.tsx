import React, { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  BookMarked,
  Check,
  ChevronDown,
  Compass,
  Download,
  Home,
  Library,
  Moon,
  Smartphone,
  Sun,
  WifiOff,
  X,
} from "lucide-react";
import type { AppRoute, FontSizeScale, ThemeMode } from "../types/emoeslife";
import { useOnlineStatus, usePWAInstall } from "../hooks/usePWAInstall";

interface AppShellProps {
  route: AppRoute;
  theme: ThemeMode;
  fontSize: FontSizeScale;
  focusMode: boolean;
  onNavigate: (route: AppRoute) => void;
  onOpenClassicToc: () => void;
  onChangeFontSize: (size: FontSizeScale) => void;
  onToggleTheme: () => void;
  onCheckApkUpdate?: () => void;
  children: React.ReactNode;
}

type NavTab = "home" | "bacaan" | "quran" | "kitab";

function getActiveTab(route: AppRoute): NavTab | null {
  if (route.view === "home") return "home";
  if (route.view === "bacaan-hub" || route.view === "classic" || route.view === "wudhu-shalat") {
    return "bacaan";
  }
  if (route.view === "quran-studio") return "quran";
  if (route.view === "download" || route.view === "nearby-mosques") return null;
  return "kitab";
}

function isDedicatedReader(route: AppRoute): boolean {
  return (
    route.view === "classic" ||
    route.view === "local-kitab" ||
    route.view === "tashrif-kitab" ||
    route.view === "api-kitab" ||
    (route.view === "quran-studio" && Boolean(route.surahNumber))
  );
}

export const AppShell: React.FC<AppShellProps> = ({
  route,
  theme,
  fontSize,
  focusMode,
  onNavigate,
  onOpenClassicToc,
  onChangeFontSize,
  onToggleTheme,
  onCheckApkUpdate,
  children,
}) => {
  const activeTab = getActiveTab(route);
  const hideMobileDock = isDedicatedReader(route);
  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [fontMenuOpen, setFontMenuOpen] = useState(false);
  const fontMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!fontMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (fontMenuRef.current && !fontMenuRef.current.contains(e.target as Node)) {
        setFontMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [fontMenuOpen]);

  const navItems: Array<{
    id: NavTab;
    label: string;
    mobileLabel: string;
    icon: React.ReactNode;
    onClick: () => void;
  }> = [
    {
      id: "home",
      label: "Beranda",
      mobileLabel: "Beranda",
      icon: <Home className="h-[18px] w-[18px] shrink-0" />,
      onClick: () => onNavigate({ view: "home" }),
    },
    {
      id: "bacaan",
      label: "Bacaan & Zikir",
      mobileLabel: "Zikir",
      icon: <Compass className="h-[18px] w-[18px] shrink-0" />,
      onClick: () => onNavigate({ view: "bacaan-hub" }),
    },
    {
      id: "quran",
      label: "Studio Ibadah",
      mobileLabel: "Ibadah",
      icon: <BookOpen className="h-[18px] w-[18px] shrink-0" />,
      onClick: () => onNavigate({ view: "quran-studio", tab: "quran" }),
    },
    {
      id: "kitab",
      label: "Kitab Kuning",
      mobileLabel: "Kitab",
      icon: <Library className="h-[18px] w-[18px] shrink-0" />,
      onClick: () => onNavigate({ view: "kitab-hub" }),
    },
  ];

  const pageLabel: Record<AppRoute["view"], string> = {
    home: "Beranda Utama",
    "bacaan-hub": "Bacaan & Zikir",
    classic: "Ruang Baca Klasik",
    "quran-studio": "Studio Ibadah",
    "wudhu-shalat": "Panduan Wudhu & Shalat",
    "kitab-hub": "Perpustakaan Kitab Kuning",
    "local-kitab": "Pembaca Kitab Kuning",
    "tashrif-kitab": "Al-Amtsilah at-Tashrifiyah",
    "api-kitab": "Pembaca Kitab Kuning",
    "nearby-mosques": "Masjid & Mushala Terdekat",
    download: "Unduh & Pasang Aplikasi (PWA)",
  };

  const fontOptions: ReadonlyArray<{ id: FontSizeScale; code: string; label: string }> = [
    { id: "small", code: "A−", label: "Kecil" },
    { id: "normal", code: "A", label: "Sedang" },
    { id: "large", code: "A+", label: "Besar" },
  ];

  return (
    <div className="flex min-h-screen bg-white text-[#1d2c24] dark:bg-[#0A1018] dark:text-[#E9EEF5]">
      {/* Desktop Left Navigation Rail (hidden in Focus Mode) */}
      {!focusMode && (
        <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-[#e4eae6] bg-white px-4 py-5 lg:sticky lg:top-0 lg:flex lg:h-screen dark:border-slate-800/80 dark:bg-[#0F1722]">
          <div>
            <button
              type="button"
              onClick={() => onNavigate({ view: "home" })}
              className="flex min-h-[62px] w-full items-center gap-2.5 rounded-xl bg-[#134a35] px-3 py-2 text-left transition-opacity hover:opacity-95 dark:bg-[#132238]"
              aria-label="e-Moeslife Beranda"
            >
              <img
                src="/assets/logo-mark.webp"
                alt=""
                aria-hidden="true"
                className="h-[42px] w-[42px] shrink-0 object-contain"
              />
              <img
                src="/assets/logo-text.webp"
                alt="e-Moeslife"
                className="h-[24px] w-auto shrink-0 object-contain"
              />
            </button>

            <nav className="mt-6 space-y-1.5" aria-label="Menu utama">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.onClick}
                    className={`flex min-h-[42px] w-full items-center gap-3 rounded-xl px-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? "bg-[#134a35] text-white dark:bg-[#1D3557] dark:text-white"
                        : "text-[#354c3e] hover:bg-[#f2f6f4] hover:text-[#103d2c] dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-6 border-t border-[#e8eeea] pt-4 dark:border-slate-800/80">
              <p className="px-3 text-[11px] font-semibold tracking-wider text-[#9c7d3c] uppercase dark:text-slate-400">
                Pintasan Cepat
              </p>
              <button
                type="button"
                onClick={onOpenClassicToc}
                className="mt-2 flex min-h-[42px] w-full items-center gap-3 rounded-xl px-3.5 text-sm font-medium text-[#354c3e] transition-colors hover:bg-[#f2f6f4] hover:text-[#103d2c] dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white"
              >
                <BookMarked className="h-[18px] w-[18px] shrink-0" />
                <span>Pindah bacaan</span>
              </button>
            </div>
          </div>

          <div className="space-y-2 border-t border-[#e8eeea] pt-4 dark:border-slate-800/80">
            {!isInstalled && isInstallable && (
              <button
                type="button"
                onClick={() => install()}
                className="flex min-h-[40px] w-full items-center justify-between rounded-xl bg-[#134a35] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[#0e3928] dark:bg-[#E2B354] dark:text-[#0B111A]"
              >
                <span className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  <span>Pasang Aplikasi (PWA)</span>
                </span>
              </button>
            )}
            {!isInstalled && !isInstallable && isIOS && (
              <button
                type="button"
                onClick={() => setShowIOSGuide(true)}
                className="flex min-h-[40px] w-full items-center gap-2 rounded-xl border border-[#dce4df] bg-[#f5f8f6] px-3.5 text-xs font-semibold text-[#174231] dark:border-slate-800 dark:bg-[#152030] dark:text-slate-200"
              >
                <Smartphone className="h-4 w-4" />
                <span>Pasang di iPhone / iPad</span>
              </button>
            )}
            {onCheckApkUpdate ? (
              <button
                type="button"
                onClick={onCheckApkUpdate}
                className="flex min-h-[40px] w-full items-center justify-between rounded-xl border border-[#dce4df] bg-[#f5f8f6] px-3.5 text-xs font-semibold text-[#174231] transition-colors hover:bg-[#eaf1ed] dark:border-slate-800 dark:bg-[#152030] dark:text-slate-200 dark:hover:bg-[#1B293C]"
              >
                <span className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-[#9c7d3c] dark:text-[#E2B354]" />
                  <span>Cek Pembaruan APK</span>
                </span>
                <span aria-hidden="true">↻</span>
              </button>
            ) : (
              <a
                href="/download.html"
                className="flex min-h-[40px] w-full items-center justify-between rounded-xl border border-[#dce4df] bg-[#f5f8f6] px-3.5 text-xs font-semibold text-[#174231] transition-colors hover:bg-[#eaf1ed] dark:border-slate-800 dark:bg-[#152030] dark:text-slate-200 dark:hover:bg-[#1B293C]"
              >
                <span className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-[#9c7d3c] dark:text-[#E2B354]" />
                  <span>Unduh Aplikasi (Android)</span>
                </span>
                <span aria-hidden="true">→</span>
              </a>
            )}
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Deep Emerald Header matching screenshot (hidden in Focus Mode on all viewports) */}
        {!focusMode && (
          <header className="sticky top-0 z-30 border-b border-[#0d3525] bg-[#134a35] text-white shadow-xs dark:border-slate-800/80 dark:bg-[#0F1722]/95 dark:backdrop-blur-md">
            <div className="mx-auto flex min-h-[64px] max-w-6xl items-center justify-between gap-2.5 px-4 py-1.5 sm:min-h-[68px] sm:px-6">
              <div className="flex min-w-0 items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onNavigate({ view: "home" })}
                  className="flex min-h-[48px] shrink-0 items-center gap-2.5 sm:gap-3 lg:hidden"
                  aria-label="e-Moeslife Beranda"
                >
                  <img
                    src="/assets/logo-mark.webp"
                    alt=""
                    aria-hidden="true"
                    className="h-[44px] w-[44px] shrink-0 object-contain sm:h-[50px] sm:w-[50px]"
                  />
                  <img
                    src="/assets/logo-text.webp"
                    alt="e-Moeslife"
                    className="h-[26px] w-auto max-w-[140px] shrink-0 object-contain sm:h-[30px] sm:max-w-[165px]"
                  />
                </button>
                <span className="hidden text-sm font-semibold text-white/95 truncate lg:inline dark:text-slate-100">
                  {pageLabel[route.view]}
                </span>
              </div>

              {/* Right Controls: Direct link to /download.html (or update check in APK), Compact Font Dropdown, Theme Toggle */}
              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                {onCheckApkUpdate ? (
                  <button
                    type="button"
                    onClick={onCheckApkUpdate}
                    aria-label="Cek pembaruan APK e-Moeslife"
                    title="Cek pembaruan APK"
                    className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/20 dark:border-slate-700 dark:bg-[#162131] dark:text-slate-200 dark:hover:bg-[#1E2C40]"
                  >
                    <Download className="h-4 w-4 shrink-0" />
                  </button>
                ) : (
                  <a
                    href="/download.html"
                    aria-label="Unduh aplikasi e-Moeslife Android"
                    title="Unduh e-Moeslife Android (Capacitor)"
                    className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/20 dark:border-slate-700 dark:bg-[#162131] dark:text-slate-200 dark:hover:bg-[#1E2C40]"
                  >
                    <Download className="h-4 w-4 shrink-0" />
                  </a>
                )}

                {/* Compact Font Size Dropdown ("A ⌄") matching reference header */}
                <div className="relative" ref={fontMenuRef}>
                  <button
                    type="button"
                    onClick={() => setFontMenuOpen((v) => !v)}
                    aria-expanded={fontMenuOpen}
                    aria-haspopup="menu"
                    aria-label="Ukuran tulisan"
                    title="Ukuran tulisan"
                    className="inline-flex min-h-[38px] shrink-0 items-center gap-1 rounded-xl border border-white/25 bg-white/10 px-2.5 text-xs font-bold text-white transition-colors hover:bg-white/20 dark:border-slate-700 dark:bg-[#162131] dark:text-slate-200 dark:hover:bg-[#1E2C40]"
                  >
                    <span>{fontOptions.find((o) => o.id === fontSize)?.code || "A"}</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-80" />
                  </button>

                  {fontMenuOpen && (
                    <div
                      role="menu"
                      aria-label="Pilih ukuran tulisan"
                      className="absolute right-0 mt-1.5 w-36 overflow-hidden rounded-xl border border-[#e2e8e4] bg-white p-1 text-[#1d2c24] shadow-xl dark:border-slate-700 dark:bg-[#111A27] dark:text-slate-100"
                    >
                      {fontOptions.map((opt) => {
                        const active = fontSize === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            role="menuitemradio"
                            aria-checked={active}
                            onClick={() => {
                              onChangeFontSize(opt.id);
                              setFontMenuOpen(false);
                            }}
                            className={`flex min-h-[36px] w-full items-center justify-between rounded-lg px-2.5 text-xs font-semibold transition-colors ${
                              active
                                ? "bg-[#134a35] text-white dark:bg-[#E2B354] dark:text-[#0B111A]"
                                : "hover:bg-[#f4f7f5] dark:hover:bg-slate-800"
                            }`}
                          >
                            <span>
                              {opt.code} · {opt.label}
                            </span>
                            {active && <Check className="h-3.5 w-3.5" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onToggleTheme}
                  aria-label={theme === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
                  title={theme === "dark" ? "Mode terang" : "Mode gelap"}
                  className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/20 dark:border-slate-700 dark:bg-[#162131] dark:text-[#E2B354] dark:hover:bg-[#1E2C40]"
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </header>
        )}

        {/* Page Body */}
        <main className={`flex-1 ${!hideMobileDock && !focusMode ? "pb-24 lg:pb-8" : "pb-8"}`}>
          {children}
        </main>
      </div>

      {/* Offline Banner */}
      {!isOnline && (
        <div
          role="status"
          className="fixed bottom-20 left-4 z-50 flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 shadow-lg lg:bottom-4 dark:border-amber-700/60 dark:bg-amber-950/90 dark:text-amber-200"
        >
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
          <span>Mode Offline — Menggunakan naskah tersimpan</span>
        </div>
      )}

      {/* iOS PWA Install Instructions */}
      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[#e2e8e4] bg-white p-5 text-[#1d2c24] shadow-xl dark:border-slate-800 dark:bg-[#111A27] dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-[#103d2c] dark:text-white">
                Pasang di iPhone / iPad
              </h3>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                aria-label="Tutup panduan"
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#5e6a62] dark:text-slate-300">
              1. Ketuk tombol <strong>Bagikan (Share)</strong> di bilah bawah Safari.
              <br />
              2. Gulir lalu pilih <strong>Tambah ke Layar Utama (Add to Home Screen)</strong>.
            </p>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 min-h-[40px] w-full rounded-xl bg-[#134a35] text-xs font-semibold text-white dark:bg-[#E2B354] dark:text-[#0B111A]"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Dock with frosted blur backdrop over covered page content */}
      {!hideMobileDock && !focusMode && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-x-0 bottom-0 z-30 h-24 bg-white/60 backdrop-blur-md [mask-image:linear-gradient(to_top,black_64%,transparent)] lg:hidden dark:bg-[#0A1018]/70"
          />
          <nav
            aria-label="Navigasi bawah"
            className="fixed inset-x-4 bottom-2.5 z-40 mx-auto max-w-[356px] rounded-2xl border border-[#dce4df]/85 bg-white/80 p-1 shadow-[0_8px_24px_rgba(16,61,44,0.12)] backdrop-blur-xl lg:hidden dark:border-slate-700/80 dark:bg-[#0F1722]/80 dark:shadow-2xl"
          >
            <div className="grid grid-cols-4 gap-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.onClick}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 transition-all duration-200 [&_svg]:h-4 [&_svg]:w-4 ${
                      isActive
                        ? "bg-[#134a35] font-semibold text-white shadow-xs dark:bg-[#E2B354] dark:text-[#0B111A]"
                        : "font-medium text-[#52655a] hover:bg-[#f2f6f4] hover:text-[#103d2c] dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-200"
                    }`}
                  >
                    {item.icon}
                    <span className="text-[10px] leading-none whitespace-nowrap">{item.mobileLabel}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </>
      )}
    </div>
  );
};
