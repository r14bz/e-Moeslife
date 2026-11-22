import type { AppRoute, LocalBookMeta } from "../types/emoeslife";

export const routeComponentLoaders = {
  bacaanHub: () => import("../components/BacaanHubView"),
  classicReader: () => import("../components/ClassicReaderView"),
  quranStudio: () => import("../components/QuranStudioView"),
  kitabHub: () => import("../components/KitabHubView"),
  localKitab: () => import("../components/LocalKitabView"),
  tashrifKitab: () => import("../components/TashrifKitabPage"),
  alfiyahKitab: () => import("../components/AlfiyahKitabPage"),
  imrithiKitab: () => import("../components/ImrithiKitabPage"),
  jurumiyahKitab: () => import("../components/JurumiyahKitabPage"),
  aqidatulAwamKitab: () => import("../components/AqidatulAwamKitabPage"),
  baiquniyyahKitab: () => import("../components/BaiquniyyahKitabPage"),
  nashoihulKitab: () => import("../components/NashoihulIbadKitabPage"),
  bukhariKitab: () => import("../components/BukhariKitabPage"),
  uqudulujainKitab: () => import("../components/UqudulujainKitabPage"),
  turatsKitab: () => import("../components/TuratsKitabPage"),
  qathrulGhaitsKitab: () => import("../components/QathrulGhaitsKitabPage"),
  tijanDaroriKitab: () => import("../components/TijanDaroriKitabPage"),
  apiKitab: () => import("../components/ApiKitabView"),
  nearbyMosques: () => import("../components/NearbyMosquesView"),
  download: () => import("../components/DownloadView"),
  wudhuShalat: () => import("../components/WudhuShalatView"),
  ecodeHalal: () => import("../components/EcodeHalalView"),
  hadis: () => import("../components/HadisView"),
  qibla: () => import("../components/QiblaView"),
  apkUpdatePrompt: () => import("../components/ApkUpdatePrompt"),
} as const;

let corePrefetched = false;
const prefetchedBooks = new Set<string>();

export function prefetchCoreRoutes(): void {
  if (corePrefetched || typeof window === "undefined") return;
  corePrefetched = true;

  const loaders: Array<() => Promise<unknown>> = [
    routeComponentLoaders.hadis,
    routeComponentLoaders.quranStudio,
    routeComponentLoaders.kitabHub,
    routeComponentLoaders.qibla,
    routeComponentLoaders.bacaanHub,
    routeComponentLoaders.wudhuShalat,
    routeComponentLoaders.classicReader,
    routeComponentLoaders.ecodeHalal,
  ];

  let idx = 0;
  const runNext = () => {
    if (idx >= loaders.length) return;
    const loader = loaders[idx++];
    void loader().catch(() => undefined).finally(() => {
      if (idx < loaders.length) {
        scheduleNext(runNext);
      }
    });
  };

  const scheduleNext = (cb: () => void) => {
    const win = window as Window & {
      requestIdleCallback?: (callback: () => void, opts?: { timeout: number }) => number;
    };
    if (typeof win.requestIdleCallback === "function") {
      win.requestIdleCallback(cb, { timeout: 900 });
    } else {
      window.setTimeout(cb, 80);
    }
  };

  window.setTimeout(() => scheduleNext(runNext), 250);
}

export function prefetchRouteView(view: AppRoute["view"]): void {
  switch (view) {
    case "hadis":
      void routeComponentLoaders.hadis().catch(() => undefined);
      break;
    case "quran-studio":
      void routeComponentLoaders.quranStudio().catch(() => undefined);
      break;
    case "kitab-hub":
      void routeComponentLoaders.kitabHub().catch(() => undefined);
      break;
    case "qibla":
      void routeComponentLoaders.qibla().catch(() => undefined);
      break;
    case "bacaan-hub":
      void routeComponentLoaders.bacaanHub().catch(() => undefined);
      break;
    case "classic":
      void routeComponentLoaders.classicReader().catch(() => undefined);
      break;
    case "wudhu-shalat":
      void routeComponentLoaders.wudhuShalat().catch(() => undefined);
      break;
    case "ecode-halal":
      void routeComponentLoaders.ecodeHalal().catch(() => undefined);
      break;
    case "nearby-mosques":
      void routeComponentLoaders.nearbyMosques().catch(() => undefined);
      break;
    case "download":
      void routeComponentLoaders.download().catch(() => undefined);
      break;
    default:
      break;
  }
}

export function prefetchBookIntent(book: LocalBookMeta): void {
  const key = `${book.source}:${book.slug}`;
  if (prefetchedBooks.has(key)) return;
  prefetchedBooks.add(key);

  if (book.format === "tashrif") {
    void routeComponentLoaders.tashrifKitab().catch(() => undefined);
    void import("../data/kitabTashrifData").catch(() => undefined);
    return;
  }
  if (book.format === "alfiyah") {
    void routeComponentLoaders.alfiyahKitab().catch(() => undefined);
    void import("../data/alfiyah").catch(() => undefined);
    return;
  }
  if (book.format === "imrithi") {
    void routeComponentLoaders.imrithiKitab().catch(() => undefined);
    void import("../data/imrithi").catch(() => undefined);
    return;
  }
  if (book.format === "jurumiyah") {
    void routeComponentLoaders.jurumiyahKitab().catch(() => undefined);
    void import("../data/jurumiyah").catch(() => undefined);
    return;
  }
  if (book.format === "aqidatul-awam") {
    void routeComponentLoaders.aqidatulAwamKitab().catch(() => undefined);
    void import("../data/aqidatulAwam").catch(() => undefined);
    return;
  }
  if (book.format === "baiquniyyah") {
    void routeComponentLoaders.baiquniyyahKitab().catch(() => undefined);
    void import("../data/baiquniyyah").catch(() => undefined);
    return;
  }
  if (book.format === "nashoihul-ibad") {
    void routeComponentLoaders.nashoihulKitab().catch(() => undefined);
    void import("../data/nashoihul-ibad").catch(() => undefined);
    return;
  }
  if (book.format === "bukhari") {
    void routeComponentLoaders.bukhariKitab().catch(() => undefined);
    void import("../data/bukhari").catch(() => undefined);
    return;
  }
  if (book.format === "uqudulujain") {
    void routeComponentLoaders.uqudulujainKitab().catch(() => undefined);
    void import("../data/uqudulujain").catch(() => undefined);
    return;
  }
  if (book.format === "qathrul-ghaits") {
    void routeComponentLoaders.qathrulGhaitsKitab().catch(() => undefined);
    return;
  }
  if (book.format === "tijan-darori") {
    void routeComponentLoaders.tijanDaroriKitab().catch(() => undefined);
    void import("../data/tijan-darori").catch(() => undefined);
    return;
  }
  if (book.format === "turats") {
    void routeComponentLoaders.turatsKitab().catch(() => undefined);
    switch (book.slug) {
      case "qarib":
        void import("../data/fathulQarib").catch(() => undefined);
        break;
      case "fathul-muin":
        void import("../data/fathulMuin").catch(() => undefined);
        break;
      case "kasyifatus-saja":
        void import("../data/kasyifatusSaja").catch(() => undefined);
        break;
      case "bahjatul-wasail":
        void import("../data/bahjatulWasail").catch(() => undefined);
        break;
      case "alhikam":
        void import("../data/alHikam").catch(() => undefined);
        break;
    }
    return;
  }
  if (book.source === "local") {
    void routeComponentLoaders.localKitab().catch(() => undefined);
    return;
  }
  void routeComponentLoaders.apiKitab().catch(() => undefined);
}
