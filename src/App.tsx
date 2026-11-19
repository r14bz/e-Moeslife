import { useCallback, useEffect, useMemo, useState } from "react";
import { buildClassicSections, type ClassicSection } from "./data/sections";
import type {
  AppRoute,
  ClassicPage,
  CollectionKind,
  FontSizeScale,
  LocalBookMeta,
  ThemeMode,
} from "./types/emoeslife";
import { readJsonPreference, readPreference, writeJsonPreference, writePreference } from "./services/preferences";
import {
  applyDzikirOverrides,
  findCollectionStart,
  isValidManualDzikirLayout,
} from "./utils/readerEngine";
import { LOCAL_BOOKS } from "./utils/kitabEngine";
import { AppShell } from "./components/AppShell";
import { HomeView } from "./components/HomeView";
import { BacaanHubView } from "./components/BacaanHubView";
import { ClassicReaderView } from "./components/ClassicReaderView";
import { QuranStudioView } from "./components/QuranStudioView";
import { KitabHubView } from "./components/KitabHubView";
import { LocalKitabView } from "./components/LocalKitabView";
import { TashrifKitabPage } from "./components/TashrifKitabPage";
import { AlfiyahKitabPage } from "./components/AlfiyahKitabPage";
import { ImrithiKitabPage } from "./components/ImrithiKitabPage";
import { JurumiyahKitabPage } from "./components/JurumiyahKitabPage";
import { AqidatulAwamKitabPage } from "./components/AqidatulAwamKitabPage";
import { BaiquniyyahKitabPage } from "./components/BaiquniyyahKitabPage";
import { NashoihulIbadKitabPage } from "./components/NashoihulIbadKitabPage";
import { ApiKitabView } from "./components/ApiKitabView";
import { NearbyMosquesView } from "./components/NearbyMosquesView";
import { DownloadView } from "./components/DownloadView";
import { WudhuShalatView } from "./components/WudhuShalatView";
import { ApkUpdatePrompt } from "./components/ApkUpdatePrompt";
import { KITAB_TASHRIF_DATA } from "./data/kitabTashrifData";
import { ALFIYAH_DATA } from "./data/alfiyah";
import { imrithiBabs } from "./data/imrithi";
import { semuaBabJurumiyah } from "./data/jurumiyah";
import { aqidatulAwamBabs } from "./data/aqidatulAwam";
import { baiquniyyahBabs } from "./data/baiquniyyah";
import { kitabNashoihulIbad } from "./data/nashoihul-ibad";
import { LocalNotifications } from "@capacitor/local-notifications";
import { consumePendingNativeUpdateOpen } from "./services/apkInstaller";
import {
  checkForApkUpdate,
  dismissApkVersion,
  INSTALLED_APK_VERSION_NAME,
  isNativeAndroidApp,
  notifyApkUpdateAvailable,
  type ApkReleaseInfo,
} from "./services/apkUpdater";
import { requestStartupPermissionsOnLaunch } from "./services/locationService";

const FONT_SIZES: FontSizeScale[] = ["small", "normal", "large"];

export function App() {
  const [theme, setTheme] = useState<ThemeMode>(() =>
    readPreference("theme") === "dark" ? "dark" : "light"
  );
  const [fontSize, setFontSize] = useState<FontSizeScale>(() => {
    const saved = readPreference("fontSize", "normal") as FontSizeScale;
    return FONT_SIZES.includes(saved) ? saved : "normal";
  });

  const [sections, setSections] = useState<ClassicSection[]>(() => buildClassicSections());
  const [pageLayout, setPageLayout] = useState<Record<number, string>>(() =>
    readJsonPreference<Record<number, string>>("pageLayout", {})
  );

  const [savedPageIndex, setSavedPageIndex] = useState<number>(() => {
    const parsed = Number.parseInt(readPreference("page", "0") || "0", 10);
    return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;
  });
  const [lastReadTitle, setLastReadTitle] = useState<string>("");

  const [route, setRoute] = useState<AppRoute>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("view") === "download" || window.location.pathname === "/download") {
        return { view: "download" };
      }
    }
    return { view: "home" };
  });
  const [tocOpen, setTocOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const apiBooks: LocalBookMeta[] = [];
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);
  const [apkUpdateRelease, setApkUpdateRelease] = useState<ApkReleaseInfo | null>(null);
  const [apkUpdateStatus, setApkUpdateStatus] = useState<string | null>(null);

  useEffect(() => {
    const onQuota = () => setMapsQuotaExceeded(true);
    window.addEventListener("gmp-quota-exceeded", onQuota);
    return () => window.removeEventListener("gmp-quota-exceeded", onQuota);
  }, []);

  useEffect(() => {
    void requestStartupPermissionsOnLaunch();
  }, []);

  useEffect(() => {
    if (!isNativeAndroidApp()) return;
    let active = true;
    let checking = false;

    const runAutoUpdateCheck = (forcePrompt = false) => {
      if (checking) return;
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      checking = true;
      checkForApkUpdate(forcePrompt ? { force: true } : undefined)
        .then(({ updateAvailable }) => {
          if (!active || !updateAvailable) return;
          setApkUpdateRelease(updateAvailable);
          void notifyApkUpdateAvailable(updateAvailable);
        })
        .catch(() => {
          // Silent fallback when offline
        })
        .finally(() => {
          checking = false;
        });
    };

    const syncAndCheckUpdate = () => {
      void consumePendingNativeUpdateOpen()
        .catch(() => false)
        .then((pending) => {
          if (!active) return;
          runAutoUpdateCheck(Boolean(pending));
        });
    };

    const onVisibilityOrFocus = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      syncAndCheckUpdate();
    };

    const onOnline = () => syncAndCheckUpdate();

    syncAndCheckUpdate();
    window.addEventListener("online", onOnline);
    window.addEventListener("focus", onVisibilityOrFocus);
    document.addEventListener("visibilitychange", onVisibilityOrFocus);

    let removeNotifListener: (() => Promise<void>) | null = null;
    LocalNotifications.addListener("localNotificationActionPerformed", (action) => {
      const extra = action.notification?.extra as { type?: string } | undefined;
      if (extra?.type === "apk-update") {
        void checkForApkUpdate({ force: true }).then(({ updateAvailable }) => {
          if (active && updateAvailable) {
            setApkUpdateRelease(updateAvailable);
          }
        });
      }
    })
      .then((handle) => {
        if (active) {
          removeNotifListener = () => handle.remove();
        } else {
          void handle.remove();
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
      window.removeEventListener("online", onOnline);
      window.removeEventListener("focus", onVisibilityOrFocus);
      document.removeEventListener("visibilitychange", onVisibilityOrFocus);
      if (removeNotifListener) {
        void removeNotifListener();
      }
    };
  }, []);

  const handleManualApkUpdateCheck = useCallback(async () => {
    setApkUpdateStatus("Memeriksa pembaruan aplikasi…");
    const { updateAvailable, latest } = await checkForApkUpdate({ force: true });
    if (updateAvailable) {
      setApkUpdateStatus(null);
      setApkUpdateRelease(updateAvailable);
      return;
    }
    if (latest) {
      setApkUpdateStatus(
        `Aplikasi sudah menggunakan versi terbaru (v${INSTALLED_APK_VERSION_NAME}).`
      );
    } else {
      setApkUpdateStatus("Tidak dapat memeriksa pembaruan saat ini. Periksa koneksi internet.");
    }
    window.setTimeout(() => {
      setApkUpdateStatus(null);
    }, 4500);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    writePreference("theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.fontSize = fontSize;
    writePreference("fontSize", fontSize);
  }, [fontSize]);

  useEffect(() => {
    let active = true;
    const baseSections = buildClassicSections();

    const overridesTask = fetch("/dzikir-overrides.json")
      .then((res) => {
        if (!res.ok) throw new Error("Overrides unavailable");
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        const cloned = baseSections.map((s) => ({ ...s }));
        applyDzikirOverrides(cloned, data);
        setSections(cloned);
      });

    const layoutTask = fetch("/etahlil-pembagian-halaman-dzikir.json", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("Manual page layout unavailable");
        return res.json();
      })
      .then((layout) => {
        if (!active || !isValidManualDzikirLayout(layout)) return;
        const sectionIdx = Number(layout.sectionIndex);
        if (!baseSections[sectionIdx] || baseSections[sectionIdx].collection !== "dzikir") return;
        setPageLayout((prev) => {
          const next = { ...prev, [sectionIdx]: String(layout.text) };
          writeJsonPreference("pageLayout", next);
          return next;
        });
      });

    Promise.allSettled([overridesTask, layoutTask]);
    return () => {
      active = false;
    };
  }, []);

  const continueLabel = useMemo(() => {
    if (lastReadTitle) return lastReadTitle;
    if (savedPageIndex > 0 && sections.length) {
      return sections[Math.min(savedPageIndex, sections.length - 1)]?.title || "Lanjutkan dari halaman terakhir";
    }
    return "Mulai dari halaman pertama";
  }, [lastReadTitle, savedPageIndex, sections]);

  const navigate = useCallback((nextRoute: AppRoute) => {
    setTocOpen(false);
    if (
      nextRoute.view !== "classic" &&
      nextRoute.view !== "local-kitab" &&
      nextRoute.view !== "tashrif-kitab" &&
      nextRoute.view !== "alfiyah-kitab" &&
      nextRoute.view !== "imrithi-kitab" &&
      nextRoute.view !== "jurumiyah-kitab" &&
      nextRoute.view !== "aqidatul-awam-kitab" &&
      nextRoute.view !== "baiquniyyah-kitab" &&
      nextRoute.view !== "nashoihul-kitab" &&
      nextRoute.view !== "api-kitab"
    ) {
      setFocusMode(false);
    }
    setRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const openCollection = useCallback(
    (kind: CollectionKind) => {
      const startIdx = findCollectionStart(sections, kind);
      if (startIdx < 0) return;
      navigate({ view: "classic", sectionIndex: startIdx, collection: kind });
    },
    [sections, navigate]
  );

  const openSectionIndex = useCallback(
    (sectionIndex: number) => {
      navigate({ view: "classic", sectionIndex });
    },
    [navigate]
  );

  const continueReading = useCallback(() => {
    const saved = Number.parseInt(readPreference("page", "0") || "0", 10);
    setSavedPageIndex(Number.isSafeInteger(saved) && saved >= 0 ? saved : 0);
    navigate({ view: "classic" });
  }, [navigate]);

  const handleOpenClassicToc = useCallback(() => {
    if (route.view !== "classic") {
      setFocusMode(false);
      setRoute({ view: "classic" });
      setTocOpen(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setTocOpen((prev) => !prev);
    }
  }, [route.view]);

  const handlePageChanged = useCallback((page: ClassicPage | undefined) => {
    if (page?.title) setLastReadTitle(page.title);
  }, []);

  const openBook = useCallback(
    (book: LocalBookMeta, chapterIndex?: number) => {
      if (book.format === "tashrif") {
        const tab =
          typeof chapterIndex === "number" && chapterIndex >= KITAB_TASHRIF_DATA.length
            ? "lughawi"
            : "istilahi";
        navigate({ view: "tashrif-kitab", tab });
        return;
      }
      if (book.format === "alfiyah") {
        let juz = 1;
        let babIndex = 0;
        if (typeof chapterIndex === "number" && chapterIndex >= 0) {
          let offset = chapterIndex;
          for (const item of ALFIYAH_DATA) {
            if (offset < item.babList.length) {
              juz = item.juz;
              babIndex = offset;
              break;
            }
            offset -= item.babList.length;
          }
        }
        navigate({ view: "alfiyah-kitab", juz, babIndex });
        return;
      }
      if (book.format === "imrithi") {
        const babId =
          typeof chapterIndex === "number" && imrithiBabs[chapterIndex]
            ? imrithiBabs[chapterIndex].id
            : undefined;
        navigate({ view: "imrithi-kitab", babId });
        return;
      }
      if (book.format === "jurumiyah") {
        const babId =
          typeof chapterIndex === "number" && semuaBabJurumiyah[chapterIndex]
            ? semuaBabJurumiyah[chapterIndex].id
            : undefined;
        navigate({ view: "jurumiyah-kitab", babId });
        return;
      }
      if (book.format === "aqidatul-awam") {
        const babId =
          typeof chapterIndex === "number" && aqidatulAwamBabs[chapterIndex]
            ? aqidatulAwamBabs[chapterIndex].id
            : undefined;
        navigate({ view: "aqidatul-awam-kitab", babId });
        return;
      }
      if (book.format === "baiquniyyah") {
        const babId =
          typeof chapterIndex === "number" && baiquniyyahBabs[chapterIndex]
            ? baiquniyyahBabs[chapterIndex].id
            : undefined;
        navigate({ view: "baiquniyyah-kitab", babId });
        return;
      }
      if (book.format === "nashoihul-ibad") {
        const babId =
          typeof chapterIndex === "number" && kitabNashoihulIbad[chapterIndex]
            ? kitabNashoihulIbad[chapterIndex].id
            : undefined;
        navigate({ view: "nashoihul-kitab", babId });
        return;
      }
      if (book.source === "local") {
        navigate({ view: "local-kitab", slug: book.slug, chapterIndex });
      } else {
        navigate({ view: "api-kitab", slug: book.slug, title: book.title });
      }
    },
    [navigate]
  );

  const activeLocalBook =
    route.view === "local-kitab" ? LOCAL_BOOKS.find((b) => b.slug === route.slug) || null : null;

  return (
    <>
      {mapsQuotaExceeded && (
        <div
          role="alert"
          className="sticky top-0 z-50 border-b border-amber-300 bg-amber-50 px-4 py-2.5 text-center text-xs font-medium text-amber-950 shadow-sm dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
        >
          <span>
            Batas kuota demo Google Maps sementara tercapai.{" "}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline"
            >
              Pelajari cara meningkatkan kuota
            </a>
          </span>
        </div>
      )}
      <AppShell
        route={route}
        theme={theme}
        fontSize={fontSize}
        focusMode={focusMode}
        onNavigate={navigate}
        onOpenClassicToc={handleOpenClassicToc}
        onChangeFontSize={setFontSize}
        onToggleTheme={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
        onCheckApkUpdate={isNativeAndroidApp() ? handleManualApkUpdateCheck : undefined}
      >
      {route.view === "home" && (
        <HomeView
          sections={sections}
          continueLabel={continueLabel}
          localBooks={LOCAL_BOOKS}
          apiBooks={apiBooks}
          onContinueReading={continueReading}
          onOpenCollection={openCollection}
          onOpenSectionIndex={openSectionIndex}
          onNavigate={navigate}
          onOpenBook={openBook}
        />
      )}

      {route.view === "bacaan-hub" && (
        <BacaanHubView
          sections={sections}
          onOpenCollection={openCollection}
          onOpenSectionIndex={openSectionIndex}
          onOpenWudhuShalat={() => navigate({ view: "wudhu-shalat", tab: "wudhu" })}
        />
      )}

      {route.view === "wudhu-shalat" && (
        <WudhuShalatView
          initialTab={route.tab}
          onBackHome={() => navigate({ view: "home" })}
        />
      )}

      {route.view === "classic" && (
        <ClassicReaderView
          sections={sections}
          pageLayout={pageLayout}
          fontSize={fontSize}
          initialSectionIndex={route.sectionIndex ?? null}
          initialPageIndex={savedPageIndex}
          tocOpen={tocOpen}
          focusMode={focusMode}
          onToggleFocus={() => setFocusMode((f) => !f)}
          onOpenToc={() => setTocOpen(true)}
          onCloseToc={() => setTocOpen(false)}
          onGoHome={() => navigate({ view: "home" })}
          onPageChanged={handlePageChanged}
        />
      )}

      {route.view === "quran-studio" && (
        <QuranStudioView
          activeTab={route.tab}
          selectedSurah={route.surahNumber}
          initialAyatNumber={route.ayatNumber}
          initialDoaTitle={route.doaTitle}
          sections={sections}
          pageLayout={pageLayout}
          onChangeTab={(tab, surahNumber) =>
            navigate({ view: "quran-studio", tab, surahNumber })
          }
          onOpenClassicCollection={openCollection}
        />
      )}

      {route.view === "kitab-hub" && (
        <KitabHubView localBooks={LOCAL_BOOKS} apiBooks={apiBooks} onOpenBook={openBook} />
      )}

      {route.view === "local-kitab" && activeLocalBook && (
        <LocalKitabView
          book={activeLocalBook}
          initialChapterIndex={route.chapterIndex}
          focusMode={focusMode}
          onToggleFocus={() => setFocusMode((f) => !f)}
          onBackToLibrary={() => navigate({ view: "kitab-hub" })}
        />
      )}

      {route.view === "tashrif-kitab" && (
        <TashrifKitabPage
          initialTab={route.tab}
          focusMode={focusMode}
          onToggleFocus={() => setFocusMode((f) => !f)}
          onBackToLibrary={() => navigate({ view: "kitab-hub" })}
        />
      )}

      {route.view === "alfiyah-kitab" && (
        <AlfiyahKitabPage
          initialJuz={route.juz}
          initialBabIndex={route.babIndex}
          focusMode={focusMode}
          onToggleFocus={() => setFocusMode((f) => !f)}
          onBackToLibrary={() => navigate({ view: "kitab-hub" })}
        />
      )}

      {route.view === "imrithi-kitab" && (
        <ImrithiKitabPage
          initialBabId={route.babId}
          focusMode={focusMode}
          onToggleFocus={() => setFocusMode((f) => !f)}
          onBackToLibrary={() => navigate({ view: "kitab-hub" })}
        />
      )}

      {route.view === "jurumiyah-kitab" && (
        <JurumiyahKitabPage
          initialBabId={route.babId}
          focusMode={focusMode}
          onToggleFocus={() => setFocusMode((f) => !f)}
          onBackToLibrary={() => navigate({ view: "kitab-hub" })}
        />
      )}

      {route.view === "aqidatul-awam-kitab" && (
        <AqidatulAwamKitabPage
          initialBabId={route.babId}
          focusMode={focusMode}
          onToggleFocus={() => setFocusMode((f) => !f)}
          onBackToLibrary={() => navigate({ view: "kitab-hub" })}
        />
      )}

      {route.view === "baiquniyyah-kitab" && (
        <BaiquniyyahKitabPage
          initialBabId={route.babId}
          focusMode={focusMode}
          onToggleFocus={() => setFocusMode((f) => !f)}
          onBackToLibrary={() => navigate({ view: "kitab-hub" })}
        />
      )}

      {route.view === "nashoihul-kitab" && (
        <NashoihulIbadKitabPage
          initialBabId={route.babId}
          focusMode={focusMode}
          onToggleFocus={() => setFocusMode((f) => !f)}
          onBackToLibrary={() => navigate({ view: "kitab-hub" })}
        />
      )}

      {route.view === "api-kitab" && (
        <ApiKitabView
          slug={route.slug}
          title={route.title}
          focusMode={focusMode}
          onToggleFocus={() => setFocusMode((f) => !f)}
          onBackToLibrary={() => navigate({ view: "kitab-hub" })}
        />
      )}

      {route.view === "nearby-mosques" && (
        <NearbyMosquesView onBackHome={() => navigate({ view: "home" })} />
      )}

      {route.view === "download" && (
        <DownloadView localBooks={LOCAL_BOOKS} onNavigate={navigate} />
      )}
    </AppShell>
      <ApkUpdatePrompt
        release={apkUpdateRelease}
        statusMessage={apkUpdateStatus}
        onDismiss={() => {
          if (apkUpdateRelease) {
            dismissApkVersion(apkUpdateRelease.versionCode);
            setApkUpdateRelease(null);
          }
          setApkUpdateStatus(null);
        }}
      />
    </>
  );
}

export default App;
