import { Capacitor } from "@capacitor/core";

export const RELEASES_TAG_API_URL =
  "https://api.github.com/repos/r14bz/e-Moeslife/releases/tags/v2.0-android";
export const RELEASES_LATEST_API_URL =
  "https://api.github.com/repos/r14bz/e-Moeslife/releases/latest";
export const DEFAULT_APK_DOWNLOAD_URL =
  "https://github.com/r14bz/e-Moeslife/releases/latest/download/e-moeslife.apk";

const DISMISSED_VERSION_KEY = "emoeslife-apk-dismissed-version";
const LAST_CHECK_AT_KEY = "emoeslife-apk-last-check-at";
const AUTO_CHECK_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours

export const INSTALLED_APK_VERSION_CODE =
  Number.parseInt(import.meta.env.VITE_APK_VERSION_CODE || "0", 10) || 0;
export const INSTALLED_APK_VERSION_NAME =
  import.meta.env.VITE_APK_VERSION_NAME || "2.0.0";

export interface ApkReleaseInfo {
  versionCode: number;
  versionName: string;
  signed: "release" | "debug" | "unknown";
  downloadUrl: string;
  sizeBytes: number;
  publishedAt: string;
}

interface GitHubReleaseAsset {
  name?: string;
  size?: number;
  browser_download_url?: string;
  updated_at?: string;
}

interface GitHubReleaseResponse {
  name?: string;
  tag_name?: string;
  body?: string;
  published_at?: string;
  assets?: GitHubReleaseAsset[];
}

export function isNativeAndroidApp(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

function parseReleaseMetadata(release: GitHubReleaseResponse): ApkReleaseInfo | null {
  const body = release.body || "";
  let versionCode = 0;
  let versionName = "";
  let signed: ApkReleaseInfo["signed"] = "unknown";

  const markerMatch = body.match(/<!--\s*emoeslife-release:(\{[^}]+\})\s*-->/);
  if (markerMatch) {
    try {
      const parsed = JSON.parse(markerMatch[1]) as {
        versionCode?: number;
        versionName?: string;
        signed?: string;
      };
      if (typeof parsed.versionCode === "number" && Number.isFinite(parsed.versionCode)) {
        versionCode = parsed.versionCode;
      }
      if (typeof parsed.versionName === "string" && parsed.versionName) {
        versionName = parsed.versionName;
      }
      if (parsed.signed === "release" || parsed.signed === "debug") {
        signed = parsed.signed;
      }
    } catch {
      // Ignore malformed marker and try fallback pattern
    }
  }

  if (!versionCode && release.name) {
    const titleMatch = release.name.match(/v(\d+\.\d+\.(\d+))/i);
    if (titleMatch) {
      versionName = titleMatch[1];
      versionCode = Number.parseInt(titleMatch[2], 10) || 0;
    }
  }

  if (!versionCode) return null;

  const apkAsset = (release.assets || []).find((a) =>
    (a.name || "").toLowerCase().endsWith(".apk")
  );

  return {
    versionCode,
    versionName: versionName || `2.0.${versionCode}`,
    signed,
    downloadUrl: apkAsset?.browser_download_url || DEFAULT_APK_DOWNLOAD_URL,
    sizeBytes: apkAsset?.size || 0,
    publishedAt: apkAsset?.updated_at || release.published_at || "",
  };
}

export function formatApkSize(bytes: number): string {
  if (!bytes || bytes <= 0) return "";
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getDismissedApkVersion(): number {
  try {
    return Number.parseInt(localStorage.getItem(DISMISSED_VERSION_KEY) || "0", 10) || 0;
  } catch {
    return 0;
  }
}

export function dismissApkVersion(versionCode: number): void {
  try {
    localStorage.setItem(DISMISSED_VERSION_KEY, String(versionCode));
  } catch {
    // Ignore storage failures
  }
}

export async function fetchLatestApkRelease(): Promise<ApkReleaseInfo | null> {
  const endpoints = [RELEASES_TAG_API_URL, RELEASES_LATEST_API_URL];
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        cache: "no-store",
        headers: { Accept: "application/vnd.github+json" },
      });
      if (!res.ok) continue;
      const data = (await res.json()) as GitHubReleaseResponse;
      const info = parseReleaseMetadata(data);
      if (info) return info;
    } catch {
      // Try next endpoint or silent fail offline
    }
  }
  return null;
}

export async function checkForApkUpdate(options?: {
  force?: boolean;
}): Promise<{ updateAvailable: ApkReleaseInfo | null; latest: ApkReleaseInfo | null }> {
  const force = Boolean(options?.force);
  if (!isNativeAndroidApp() && !force) {
    return { updateAvailable: null, latest: null };
  }
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { updateAvailable: null, latest: null };
  }

  if (!force) {
    try {
      const lastCheck = Number.parseInt(localStorage.getItem(LAST_CHECK_AT_KEY) || "0", 10) || 0;
      if (Date.now() - lastCheck < AUTO_CHECK_INTERVAL_MS) {
        return { updateAvailable: null, latest: null };
      }
      localStorage.setItem(LAST_CHECK_AT_KEY, String(Date.now()));
    } catch {
      // Continue without throttle persistence
    }
  }

  const latest = await fetchLatestApkRelease();
  if (!latest) return { updateAvailable: null, latest: null };

  const hasNewer =
    INSTALLED_APK_VERSION_CODE > 0 && latest.versionCode > INSTALLED_APK_VERSION_CODE;

  if (!hasNewer) {
    return { updateAvailable: null, latest };
  }

  if (!force && getDismissedApkVersion() >= latest.versionCode) {
    return { updateAvailable: null, latest };
  }

  return { updateAvailable: latest, latest };
}
