import { useEffect, useState } from "react";
import { LOCAL_BOOKS } from "../utils/kitabEngine";

export type DetectedPlatform = "ios" | "android" | "desktop";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

let sharedDeferredPrompt: BeforeInstallPromptEvent | null = null;
let sharedIsInstalled = false;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function checkStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function detectPlatform(): DetectedPlatform {
  if (typeof window === "undefined") return "desktop";
  const ua = window.navigator.userAgent.toLowerCase();
  const isIPadOS =
    window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1;
  if (/iphone|ipad|ipod/.test(ua) || isIPadOS) return "ios";
  if (/android/.test(ua)) return "android";
  return "desktop";
}

if (typeof window !== "undefined") {
  sharedIsInstalled = checkStandalone();

  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    sharedDeferredPrompt = e as BeforeInstallPromptEvent;
    notifyListeners();
  });

  window.addEventListener("appinstalled", () => {
    sharedIsInstalled = true;
    sharedDeferredPrompt = null;
    notifyListeners();
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => sharedDeferredPrompt
  );
  const [isInstalled, setIsInstalled] = useState<boolean>(() =>
    typeof window !== "undefined" ? sharedIsInstalled || checkStandalone() : false
  );
  const [platform] = useState<DetectedPlatform>(() => detectPlatform());
  const [swReady, setSwReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setDeferredPrompt(sharedDeferredPrompt);
      setIsInstalled(sharedIsInstalled || checkStandalone());
    };

    listeners.add(sync);
    sync();

    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) setSwReady(true);
      });
      navigator.serviceWorker.ready
        .then(() => setSwReady(true))
        .catch(() => {
          // ignore sw readiness error
        });
    }

    return () => {
      listeners.delete(sync);
    };
  }, []);

  const install = async () => {
    const promptEvent = sharedDeferredPrompt || deferredPrompt;
    if (!promptEvent) return false;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted") {
      sharedIsInstalled = true;
      sharedDeferredPrompt = null;
      notifyListeners();
      return true;
    }
    return false;
  };

  return {
    isInstallable: Boolean(deferredPrompt),
    isInstalled,
    isIOS: platform === "ios",
    platform,
    swReady,
    install,
  };
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

export async function countCachedLocalKitabs(): Promise<number> {
  const bundledCount = LOCAL_BOOKS.filter((book) => !book.file).length;
  if (typeof caches === "undefined") return bundledCount;
  try {
    const cache = await caches.open("kitab-local-json-cache");
    let count = bundledCount;
    for (const book of LOCAL_BOOKS) {
      if (!book.file) continue;
      const match = await cache.match(`/data/${book.file}`);
      if (match) count++;
    }
    return count;
  } catch {
    return bundledCount;
  }
}

export async function prefetchAllLocalKitabs(
  onProgress?: (done: number, total: number) => void
): Promise<number> {
  const total = LOCAL_BOOKS.length;
  let done = LOCAL_BOOKS.filter((book) => !book.file).length;
  if (typeof caches === "undefined") return done;
  const cache = await caches.open("kitab-local-json-cache");
  for (const book of LOCAL_BOOKS) {
    if (!book.file) continue;
    const url = `/data/${book.file}`;
    try {
      const existing = await cache.match(url);
      if (!existing) {
        const res = await fetch(url);
        if (res.ok) await cache.put(url, res);
      }
      done++;
      onProgress?.(done, total);
    } catch {
      // ignore failed individual download
    }
  }
  return done;
}
