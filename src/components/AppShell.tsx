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
  Palette,
  RefreshCw,
  ScrollText,
  Smartphone,
  Sun,
  WifiOff,
  X,
} from "lucide-react";
import type { AppRoute, ColorThemeId, FontSizeScale, ThemeMode } from "../types/emoeslife";
import { COLOR_THEMES } from "../utils/colorThemes";
import { useOnlineStatus, usePWAInstall } from "../hooks/usePWAInstall";

interface AppShellProps {
  route: AppRoute;
  theme: ThemeMode;
  colorTheme: ColorThemeId;
  fontSize: FontSizeScale;
  focusMode: boolean;
  onNavigate: (route: AppRoute) => void;
  onOpenClassicToc: () => void;
  onChangeFontSize: (size: FontSizeScale) => void;
  onChangeColorTheme: (colorTheme: ColorThemeId) => void;
  onToggleTheme: () => void;
  onCheckApkUpdate?: () => void;
  children: React.ReactNode;
}

type NavTab = "hadis" | "quran" | "home" | "qibla" | "kitab";

function getActiveTab(route: AppRoute): NavTab | null {
  if (route.view === "home") return "home";
  if (route.view === "hadis") return "hadis";
  if (route.view === "quran-studio") return "quran";
  if (route.view === "qibla") return "qibla";
  if (
    route.view === "download" ||
    route.view === "nearby-mosques" ||
    route.view === "ecode-halal" ||
    route.view === "bacaan-hub" ||
    route.view === "classic" ||
    route.view === "wudhu-shalat"
  ) {
    return null;
  }
  return "kitab";
}

function isDedicatedReader(route: AppRoute): boolean {
  return (
    route.view === "classic" ||
    route.view === "local-kitab" ||
    route.view === "tashrif-kitab" ||
    route.view === "alfiyah-kitab" ||
    route.view === "imrithi-kitab" ||
    route.view === "jurumiyah-kitab" ||
    route.view === "aqidatul-awam-kitab" ||
    route.view === "baiquniyyah-kitab" ||
    route.view === "nashoihul-kitab" ||
    route.view === "bukhari-kitab" ||
    route.view === "uqudulujain-kitab" ||
    route.view === "turats-kitab" ||
    route.view === "qathrul-ghaits-kitab" ||
    route.view === "tijan-darori-kitab" ||
    route.view === "api-kitab" ||
    (route.view === "quran-studio" && Boolean(route.surahNumber))
  );
}

export const AppShell: React.FC<AppShellProps> = ({
  route,
  theme,
  colorTheme,
  fontSize,
  focusMode,
  onNavigate,
  onOpenClassicToc,
  onChangeFontSize,
  onChangeColorTheme,
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
  const [paletteMenuOpen, setPaletteMenuOpen] = useState(false);
  const fontMenuRef = useRef<HTMLDivElement>(null);
  const paletteMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!fontMenuOpen && !paletteMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (fontMenuOpen && fontMenuRef.current && !fontMenuRef.current.contains(target)) {
        setFontMenuOpen(false);
      }
      if (paletteMenuOpen && paletteMenuRef.current && !paletteMenuRef.current.contains(target)) {
        setPaletteMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [fontMenuOpen, paletteMenuOpen]);

  const navItems: Array<{
    id: NavTab;
    label: string;
    mobileLabel: string;
    icon: React.ReactNode;
    onClick: () => void;
  }> = [
    {
      id: "hadis",
      label: "Pencarian Hadis",
      mobileLabel: "Hadis",
      icon: <ScrollText className="h-[18px] w-[18px] shrink-0" />,
      onClick: () => onNavigate({ view: "hadis" }),
    },
    {
      id: "quran",
      label: "Al-Qur'an",
      mobileLabel: "Al-Qur'an",
      icon: <BookOpen className="h-[18px] w-[18px] shrink-0" />,
      onClick: () => onNavigate({ view: "quran-studio", tab: "quran" }),
    },
    {
      id: "home",
      label: "Beranda",
      mobileLabel: "Beranda",
      icon: <Home className="h-[18px] w-[18px] shrink-0" />,
      onClick: () => onNavigate({ view: "home" }),
    },
    {
      id: "qibla",
      label: "Arah Kiblat",
      mobileLabel: "Kiblat",
      icon: <Compass className="h-[18px] w-[18px] shrink-0" />,
      onClick: () => onNavigate({ view: "qibla" }),
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
    "bacaan-hub": "Bacaan, Yasin & Zikir",
    classic: "Ruang Baca Klasik",
    "quran-studio": "Al-Qur'an & Ibadah",
    "wudhu-shalat": "Panduan Wudhu & Shalat",
    "kitab-hub": "Perpustakaan Kitab Kuning",
    "local-kitab": "Pembaca Kitab Kuning",
    "tashrif-kitab": "Al-Amtsilah at-Tashrifiyah",
    "alfiyah-kitab": "Alfiyah Ibnu Malik",
    "imrithi-kitab": "Nadhom Imriti",
    "jurumiyah-kitab": "Matan Al-Ajurumiyyah",
    "aqidatul-awam-kitab": "Aqidatul Awam",
    "baiquniyyah-kitab": "Mandhumah Al-Baiquniyyah",
    "nashoihul-kitab": "Nashoihul Ibad",
    "bukhari-kitab": "Shahih Bukhari",
    "uqudulujain-kitab": "Uqudulujain",
    "turats-kitab": "Kitab Kuning Syarah",
    "qathrul-ghaits-kitab": "Qathrul Ghaits",
    "tijan-darori-kitab": "Tijan Daruri",
    "api-kitab": "Pembaca Kitab Kuning",
    "nearby-mosques": "Masjid & Mushala Terdekat",
    qibla: "Arah Kiblat",
    "ecode-halal": "Cek Status Halal E-Code",
    hadis: "Pencarian Hadis",
    download: "Unduh & Pasang Aplikasi (PWA)",
  };

  const fontOptions: ReadonlyArray<{ id: FontSizeScale; code: string; label: string }> = [
    { id: "small", code: "A−", label: "Kecil" },
    { id: "normal", code: "A", label: "Sedang" },
    { id: "large", code: "A+", label: "Besar" },
  ];

  return (
    <div className="flex min-h-screen bg-[var(--theme-canvas)] text-[var(--theme-ink)] transition-colors duration-200">
      {/* Desktop Left Navigation Rail (hidden in Focus Mode) */}
      {!focusMode && (
        <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-[var(--theme-border)] bg-[var(--theme-sidebar-bg)] px-4 py-5 lg:sticky lg:top-0 lg:flex lg:h-screen">
          <div>
            <button
              type="button"
              onClick={() => onNavigate({ view: "home" })}
              style={{ backgroundColor: "var(--theme-header-bg)" }}
              className="flex min-h-[62px] w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-opacity hover:opacity-95"
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
                    style={
                      isActive
                        ? {
                            backgroundColor: "var(--theme-sidebar-active)",
                            color: "var(--theme-sidebar-active-text)",
                          }
                        : undefined
                    }
                    className={`flex min-h-[42px] w-full items-center gap-3 rounded-xl px-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? "shadow-xs"
                        : "text-[var(--theme-nav-muted)] hover:bg-[var(--theme-tint-bg)] hover:text-[var(--theme-heading)]"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-6 border-t border-[var(--theme-border-soft)] pt-4">
              <p className="px-3 text-[11px] font-semibold tracking-wider text-[var(--theme-accent)] uppercase">
                Pintasan Cepat
              </p>
              <button
                type="button"
                onClick={() => onNavigate({ view: "bacaan-hub" })}
                className="mt-2 flex min-h-[42px] w-full items-center gap-3 rounded-xl px-3.5 text-sm font-medium text-[var(--theme-nav-muted)] transition-colors hover:bg-[var(--theme-tint-bg)] hover:text-[var(--theme-heading)]"
              >
                <BookOpen className="h-[18px] w-[18px] shrink-0" />
                <span>Yasin, Tahlil &amp; Zikir</span>
              </button>
              <button
                type="button"
                onClick={onOpenClassicToc}
                className="mt-1 flex min-h-[42px] w-full items-center gap-3 rounded-xl px-3.5 text-sm font-medium text-[var(--theme-nav-muted)] transition-colors hover:bg-[var(--theme-tint-bg)] hover:text-[var(--theme-heading)]"
              >
                <BookMarked className="h-[18px] w-[18px] shrink-0" />
                <span>Pindah bacaan</span>
              </button>
            </div>
          </div>

          <div className="space-y-3 border-t border-[var(--theme-border-soft)] pt-4">
            {/* Quick Color Theme Swatches in Desktop Sidebar */}
            <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card-alt)] px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-[var(--theme-muted)]">
                  Tema Warna
                </span>
                <span className="text-[11px] font-semibold text-[var(--theme-heading)]">
                  {COLOR_THEMES.find((t) => t.id === colorTheme)?.name}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-1.5" role="radiogroup" aria-label="Pilih tema warna">
                {COLOR_THEMES.map((item) => {
                  const selected = colorTheme === item.id;
                  const primarySwatch = theme === "dark" ? item.swatchDarkSurface : item.swatchPrimary;
                  const accentSwatch = theme === "dark" ? item.swatchDarkAccent : item.swatchAccent;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={`Tema ${item.name}`}
                      title={`${item.name} — ${item.subtitle}`}
                      onClick={() => onChangeColorTheme(item.id)}
                      className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-transform hover:scale-105 ${
                        selected
                          ? "border-[var(--theme-primary)] ring-2 ring-[var(--theme-primary)]/25"
                          : "border-[var(--theme-border-strong)] opacity-85 hover:opacity-100"
                      }`}
                      style={{
                        background: `linear-gradient(135deg, ${primarySwatch} 55%, ${accentSwatch} 55%)`,
                      }}
                    >
                      {selected && (
                        <Check className="h-3.5 w-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {!isInstalled && isInstallable && (
              <button
                type="button"
                onClick={() => install()}
                className="flex min-h-[40px] w-full items-center justify-between rounded-xl bg-[var(--theme-primary)] px-3.5 text-xs font-semibold text-[var(--theme-primary-text)] transition-colors hover:bg-[var(--theme-primary-hover)]"
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
                className="flex min-h-[40px] w-full items-center gap-2 rounded-xl border border-[var(--theme-border-strong)] bg-[var(--theme-card-alt)] px-3.5 text-xs font-semibold text-[var(--theme-heading)]"
              >
                <Smartphone className="h-4 w-4" />
                <span>Pasang di iPhone / iPad</span>
              </button>
            )}
            {onCheckApkUpdate ? (
              <button
                type="button"
                onClick={onCheckApkUpdate}
                className="flex min-h-[40px] w-full items-center justify-between rounded-xl border border-[var(--theme-border-strong)] bg-[var(--theme-card-alt)] px-3.5 text-xs font-semibold text-[var(--theme-heading)] transition-colors hover:bg-[var(--theme-tint-bg)]"
              >
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-[var(--theme-accent)]" />
                  <span>Cek Pembaruan APK</span>
                </span>
              </button>
            ) : (
              <a
                href="/download.html"
                className="flex min-h-[40px] w-full items-center justify-between rounded-xl border border-[var(--theme-border-strong)] bg-[var(--theme-card-alt)] px-3.5 text-xs font-semibold text-[var(--theme-heading)] transition-colors hover:bg-[var(--theme-tint-bg)]"
              >
                <span className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-[var(--theme-accent)]" />
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
        {/* Themed Header (hidden in Focus Mode on all viewports) */}
        {!focusMode && (
          <header
            style={{
              backgroundColor: "var(--theme-header-bg)",
              borderColor: "var(--theme-header-border)",
              transform: "translate3d(0, 0, 0)",
              contain: "layout style",
            }}
            className="sticky top-0 z-30 border-b text-white shadow-xs"
          >
            <div className="mx-auto flex min-h-[60px] max-w-6xl items-center justify-between gap-2 px-3.5 py-1.5 sm:min-h-[68px] sm:px-6">
              <div className="flex min-w-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate({ view: "home" })}
                  className="flex min-h-[44px] shrink-0 items-center gap-2 sm:gap-3 lg:hidden"
                  aria-label="e-Moeslife Beranda"
                >
                  <img
                    src="/assets/logo-mark.webp"
                    alt=""
                    aria-hidden="true"
                    className="h-[40px] w-[40px] shrink-0 object-contain sm:h-[48px] sm:w-[48px]"
                  />
                  <img
                    src="/assets/logo-text.webp"
                    alt="e-Moeslife"
                    className="h-[23px] w-auto max-w-[108px] shrink-0 object-contain sm:h-[30px] sm:max-w-[165px]"
                  />
                </button>
                <span className="hidden truncate text-sm font-semibold text-white/95 lg:inline">
                  {pageLabel[route.view]}
                </span>
              </div>

              {/* Right Controls: Download/Update, Color Theme Picker, Font Scale, Light/Dark Toggle */}
              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                {onCheckApkUpdate ? (
                  <button
                    type="button"
                    onClick={onCheckApkUpdate}
                    aria-label="Cek pembaruan APK e-Moeslife"
                    title="Cek pembaruan APK"
                    className="inline-flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/20 sm:h-[38px] sm:w-[38px]"
                  >
                    <RefreshCw className="h-4 w-4 shrink-0" />
                  </button>
                ) : (
                  <a
                    href="/download.html"
                    aria-label="Unduh aplikasi e-Moeslife Android"
                    title="Unduh e-Moeslife Android (Capacitor)"
                    className="inline-flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/20 sm:h-[38px] sm:w-[38px]"
                  >
                    <Download className="h-4 w-4 shrink-0" />
                  </a>
                )}

                {/* Color Theme Palette Picker */}
                <div className="relative" ref={paletteMenuRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setPaletteMenuOpen((v) => !v);
                      setFontMenuOpen(false);
                    }}
                    aria-expanded={paletteMenuOpen}
                    aria-haspopup="menu"
                    aria-label="Pilih tema warna"
                    title="Pilih tema warna"
                    className="inline-flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/20 sm:h-[38px] sm:w-[38px]"
                  >
                    <Palette className="h-4 w-4 shrink-0" />
                  </button>

                  {paletteMenuOpen && (
                    <div
                      role="menu"
                      aria-label="Pilih tema warna e-Moeslife"
                      style={{
                        backgroundColor: "var(--tashrif-paper)",
                        border: "1.5px solid var(--tashrif-border-strong)",
                        boxShadow: "var(--tashrif-dropdown-shadow)",
                        color: "var(--tashrif-text)",
                      }}
                      className="absolute right-0 z-50 mt-1.5 w-60 overflow-hidden rounded-xl"
                    >
                      <div
                        style={{
                          backgroundColor: "var(--tashrif-wazan-bg)",
                          borderBottom: "1px solid var(--tashrif-border-cell)",
                          color: "var(--tashrif-accent)",
                        }}
                        className="px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase"
                      >
                        Tema Warna Aplikasi
                      </div>
                      <div className="space-y-0.5 p-1.5">
                        {COLOR_THEMES.map((item) => {
                          const active = colorTheme === item.id;
                          const swPrimary = theme === "dark" ? item.swatchDarkSurface : item.swatchPrimary;
                          const swAccent = theme === "dark" ? item.swatchDarkAccent : item.swatchAccent;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              role="menuitemradio"
                              aria-checked={active}
                              onClick={() => {
                                onChangeColorTheme(item.id);
                                setPaletteMenuOpen(false);
                              }}
                              style={
                                active
                                  ? {
                                      backgroundColor: "var(--tashrif-btn-bg)",
                                      color: "var(--tashrif-btn-text)",
                                    }
                                  : { color: "var(--tashrif-text)" }
                              }
                              className={`flex min-h-[42px] w-full items-center justify-between gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-colors ${
                                active
                                  ? "font-bold"
                                  : "hover:bg-[var(--tashrif-dropdown-hover)]"
                              }`}
                            >
                              <div className="flex min-w-0 items-center gap-2.5">
                                <span
                                  aria-hidden="true"
                                  className="h-5 w-5 shrink-0 rounded-full border border-white/50 shadow-xs"
                                  style={{
                                    background: `linear-gradient(135deg, ${swPrimary} 55%, ${swAccent} 55%)`,
                                  }}
                                />
                                <div className="min-w-0">
                                  <span className="block truncate text-xs leading-tight">
                                    {item.name}
                                  </span>
                                  <span
                                    className={`block truncate text-[10px] leading-tight ${
                                      active ? "opacity-85" : "text-[var(--tashrif-muted)]"
                                    }`}
                                  >
                                    {item.subtitle}
                                  </span>
                                </div>
                              </div>
                              {active && <Check className="h-3.5 w-3.5 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Compact Font Size Dropdown ("A ⌄") */}
                <div className="relative" ref={fontMenuRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setFontMenuOpen((v) => !v);
                      setPaletteMenuOpen(false);
                    }}
                    aria-expanded={fontMenuOpen}
                    aria-haspopup="menu"
                    aria-label="Ukuran tulisan"
                    title="Ukuran tulisan"
                    className="inline-flex min-h-[36px] shrink-0 items-center gap-1 rounded-xl border border-white/25 bg-white/10 px-2 text-xs font-bold text-white transition-colors hover:bg-white/20 sm:min-h-[38px] sm:px-2.5"
                  >
                    <span>{fontOptions.find((o) => o.id === fontSize)?.code || "A"}</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 opacity-80 transition-transform duration-150 ${
                        fontMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {fontMenuOpen && (
                    <div
                      role="menu"
                      aria-label="Pilih ukuran tulisan"
                      style={{
                        backgroundColor: "var(--tashrif-paper)",
                        border: "1.5px solid var(--tashrif-border-strong)",
                        boxShadow: "var(--tashrif-dropdown-shadow)",
                        color: "var(--tashrif-text)",
                      }}
                      className="absolute right-0 z-50 mt-1.5 w-40 overflow-hidden rounded-xl"
                    >
                      <div
                        style={{
                          backgroundColor: "var(--tashrif-wazan-bg)",
                          borderBottom: "1px solid var(--tashrif-border-cell)",
                          color: "var(--tashrif-accent)",
                        }}
                        className="px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase"
                      >
                        Ukuran Teks
                      </div>
                      <div className="space-y-0.5 p-1.5">
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
                              style={
                                active
                                  ? {
                                      backgroundColor: "var(--tashrif-btn-bg)",
                                      color: "var(--tashrif-btn-text)",
                                    }
                                  : { color: "var(--tashrif-text)" }
                              }
                              className={`flex min-h-[38px] w-full items-center justify-between rounded-lg px-2.5 text-xs font-semibold transition-colors ${
                                active
                                  ? "font-bold"
                                  : "hover:bg-[var(--tashrif-dropdown-hover)]"
                              }`}
                            >
                              <span>
                                {opt.code} · {opt.label}
                              </span>
                              {active && <Check className="h-3.5 w-3.5 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onToggleTheme}
                  aria-label={theme === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
                  title={theme === "dark" ? "Mode terang" : "Mode gelap"}
                  className="inline-flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/20 sm:h-[38px] sm:w-[38px] dark:text-[var(--theme-accent)]"
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </header>
        )}

        {/* Page Body */}
        <main className={`flex-1 overflow-x-clip ${!hideMobileDock && !focusMode ? "pb-24 lg:pb-8" : "pb-8"}`}>
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
            className="w-full max-w-sm rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-5 text-[var(--theme-ink)] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-[var(--theme-heading)]">
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
            <p className="mt-2 text-xs leading-relaxed text-[var(--theme-muted)]">
              1. Ketuk tombol <strong>Bagikan (Share)</strong> di bilah bawah Safari.
              <br />
              2. Gulir lalu pilih <strong>Tambah ke Layar Utama (Add to Home Screen)</strong>.
            </p>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 min-h-[40px] w-full rounded-xl bg-[var(--theme-primary)] text-xs font-semibold text-[var(--theme-primary-text)] hover:bg-[var(--theme-primary-hover)]"
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
            style={{ backgroundColor: "var(--theme-dock-fade)" }}
            className="pointer-events-none fixed inset-x-0 bottom-0 z-30 h-24 backdrop-blur-md [mask-image:linear-gradient(to_top,black_64%,transparent)] lg:hidden"
          />
          <nav
            aria-label="Navigasi bawah"
            style={{
              backgroundColor: "var(--theme-dock-bg)",
              boxShadow: "var(--theme-dock-shadow)",
              transform: "translate3d(0, 0, 0)",
            }}
            className="fixed inset-x-3 bottom-2.5 z-40 mx-auto max-w-[404px] rounded-2xl border border-[var(--theme-border-strong)] p-1 backdrop-blur-xl lg:hidden"
          >
            <div className="grid grid-cols-5 gap-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.onClick}
                    aria-current={isActive ? "page" : undefined}
                    style={
                      isActive
                        ? {
                            backgroundColor: "var(--theme-primary)",
                            color: "var(--theme-primary-text)",
                          }
                        : undefined
                    }
                    className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 transition-all duration-200 [&_svg]:h-4 [&_svg]:w-4 ${
                      isActive
                        ? "font-semibold shadow-xs"
                        : "font-medium text-[var(--theme-muted)] hover:bg-[var(--theme-tint-bg)] hover:text-[var(--theme-heading)]"
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
