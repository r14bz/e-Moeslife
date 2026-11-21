import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { requestStartupPermissionsOnLaunch } from "./locationService";
import { markNativeVersionNotified } from "./apkInstaller";
import { playNotificationSound } from "./notificationAudio";

export const RELEASES_LATEST_API_URL =
  "https://api.github.com/repos/r14bz/e-Moeslife/releases/latest";
export const RELEASES_LIST_API_URL =
  "https://api.github.com/repos/r14bz/e-Moeslife/releases?per_page=10";
export const RELEASES_TAG_API_URL =
  "https://api.github.com/repos/r14bz/e-Moeslife/releases/tags/v3.0-android";
export const RELEASES_LEGACY_TAG_API_URL =
  "https://api.github.com/repos/r14bz/e-Moeslife/releases/tags/v2.0-android";
export const DEFAULT_APK_DOWNLOAD_URL =
  "https://github.com/r14bz/e-Moeslife/releases/latest/download/e-moeslife.apk";

const DISMISSED_VERSION_SESSION_KEY = "emoeslife-apk-dismissed-version-session";
const NOTIFIED_VERSION_STORAGE_KEY = "emoeslife-apk-notified-version";
const LEGACY_UPDATE_CHANNEL_ID = "pembaruan-aplikasi";
const UPDATE_CHANNEL_ID = "pembaruan-aplikasi-v2";
const UPDATE_SOUND_RES = "notif_update.wav";
export const APK_UPDATE_NOTIFICATION_ID = 519901;

export const INSTALLED_APK_VERSION_CODE =
  Number.parseInt(import.meta.env.VITE_APK_VERSION_CODE || "0", 10) || 0;
export const INSTALLED_APK_VERSION_NAME =
  import.meta.env.VITE_APK_VERSION_NAME || "3.0.0";

export type ApkChangelogCategory = "fitur" | "keamanan" | "perbaikan" | "lainnya";

export interface ApkChangelogGroup {
  category: ApkChangelogCategory;
  label: string;
  items: string[];
}

export interface ApkReleaseInfo {
  versionCode: number;
  versionName: string;
  signed: "release" | "debug" | "unknown";
  downloadUrl: string;
  sizeBytes: number;
  publishedAt: string;
  changelog: ApkChangelogGroup[];
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
  draft?: boolean;
  prerelease?: boolean;
  published_at?: string;
  assets?: GitHubReleaseAsset[];
}

const CATEGORY_LABELS: Record<ApkChangelogCategory, string> = {
  fitur: "Fitur Baru",
  keamanan: "Keamanan",
  perbaikan: "Perbaikan & Peningkatan",
  lainnya: "Pembaruan Lainnya",
};

const CATEGORY_ORDER: ApkChangelogCategory[] = ["fitur", "keamanan", "perbaikan", "lainnya"];

export function isNativeAndroidApp(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

function mapHeadingToCategory(heading: string): ApkChangelogCategory | "ignore" | null {
  const normalized = heading.trim().toLowerCase();
  if (/informasi\s+rilis|release\s+info|metadata/.test(normalized)) return "ignore";
  if (/keamanan|security|proteksi|izin|permission/.test(normalized)) return "keamanan";
  if (/fitur|feature|penambahan|baru/.test(normalized)) return "fitur";
  if (/perbaikan|peningkatan|fix|bug|stabil|performa|optimasi/.test(normalized)) {
    return "perbaikan";
  }
  if (/lainnya|other|catatan|perubahan|changelog/.test(normalized)) return "lainnya";
  return null;
}

function classifyBulletText(text: string): ApkChangelogCategory {
  const lower = text.toLowerCase();
  if (
    /\b(keamanan|security|keystore|signature|signed|signing|permission|izin|auth|token|enkripsi|privasi)\b/.test(
      lower
    )
  ) {
    return "keamanan";
  }
  if (
    /\b(fitur|feature|tambah|menambahkan|notifikasi|jadwal|changelog|pencarian|audio|tema|mode|doa|kitab)\b/.test(
      lower
    )
  ) {
    return "fitur";
  }
  if (/\b(perbaik|fix|bug|optimal|stabil|offline|rapi|sinkron|kecepatan|kinerja)\b/.test(lower)) {
    return "perbaikan";
  }
  return "lainnya";
}

function isBoilerplateLine(line: string): boolean {
  const clean = line.trim().toLowerCase();
  if (!clean) return true;
  if (clean.startsWith("build otomatis aplikasi android e-moeslife")) return true;
  if (clean.startsWith("ringkasan pembaruan aplikasi android")) return true;
  if (/^(versi|tipe signature|package id)\s*:/.test(clean)) return true;
  return false;
}

function parseChangelogFromBody(
  body: string,
  signed: ApkReleaseInfo["signed"]
): ApkChangelogGroup[] {
  const cleanedBody = body.replace(/<!--\s*emoeslife-release:[\s\S]*?-->/g, "").trim();
  const buckets: Record<ApkChangelogCategory, string[]> = {
    fitur: [],
    keamanan: [],
    perbaikan: [],
    lainnya: [],
  };

  let currentSection: ApkChangelogCategory | "ignore" | null = null;

  for (const rawLine of cleanedBody.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const headingMatch = line.match(/^#{1,4}\s+(.+)$/);
    if (headingMatch) {
      currentSection = mapHeadingToCategory(headingMatch[1]);
      continue;
    }

    if (currentSection === "ignore") continue;

    const bulletMatch = line.match(/^[-*•]\s+(.+)$/);
    const content = (bulletMatch ? bulletMatch[1] : line).replace(/\*\*(.+?)\*\*/g, "$1").trim();

    if (!content || isBoilerplateLine(content)) continue;
    if (!bulletMatch && currentSection === null && cleanedBody.includes("###")) continue;

    const targetCategory: ApkChangelogCategory =
      currentSection ?? classifyBulletText(content);

    if (!buckets[targetCategory].includes(content)) {
      buckets[targetCategory].push(content);
    }
  }

  if (signed === "release" && buckets.keamanan.length === 0) {
    buckets.keamanan.push(
      "Rilis ditandatangani dengan Release Keystore resmi agar pembaruan menjaga data tersimpan."
    );
  }

  return CATEGORY_ORDER.filter((cat) => buckets[cat].length > 0).map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    items: buckets[cat],
  }));
}

function parseReleaseMetadata(release: GitHubReleaseResponse): ApkReleaseInfo | null {
  const body = release.body || "";
  let versionCode = 0;
  let versionName = "";
  let signed: ApkReleaseInfo["signed"] = "unknown";

  const markerMatch = body.match(/<!--\s*emoeslife-release:(\{[\s\S]*?\})\s*-->/);
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

  if (!versionCode && body) {
    const buildMatch = body.match(/\(Build\s+(\d+)\)/i);
    if (buildMatch) {
      versionCode = Number.parseInt(buildMatch[1], 10) || 0;
    }
  }

  if (!versionName && release.name) {
    const titleMatch = release.name.match(/v(\d+\.\d+\.\d+)/i);
    if (titleMatch) {
      versionName = titleMatch[1];
    }
  }

  if (!versionCode && release.name) {
    const titleMatch = release.name.match(/v(\d+\.\d+\.(\d+))/i);
    if (titleMatch) {
      versionName = versionName || titleMatch[1];
      versionCode = Number.parseInt(titleMatch[2], 10) || 0;
    }
  }

  if (!versionCode) return null;

  const apkAsset = (release.assets || []).find((a) =>
    (a.name || "").toLowerCase().endsWith(".apk")
  );

  return {
    versionCode,
    versionName: versionName || `3.0.${versionCode}`,
    signed,
    downloadUrl: apkAsset?.browser_download_url || DEFAULT_APK_DOWNLOAD_URL,
    sizeBytes: apkAsset?.size || 0,
    publishedAt: apkAsset?.updated_at || release.published_at || "",
    changelog: parseChangelogFromBody(body, signed),
  };
}

export function formatApkSize(bytes: number): string {
  if (!bytes || bytes <= 0) return "";
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getDismissedApkVersion(): number {
  try {
    return (
      Number.parseInt(sessionStorage.getItem(DISMISSED_VERSION_SESSION_KEY) || "0", 10) || 0
    );
  } catch {
    return 0;
  }
}

export function dismissApkVersion(versionCode: number): void {
  try {
    sessionStorage.setItem(DISMISSED_VERSION_SESSION_KEY, String(versionCode));
  } catch {
    // Ignore storage failures
  }
}

export async function fetchLatestApkRelease(): Promise<ApkReleaseInfo | null> {
  const endpoints = [
    RELEASES_LATEST_API_URL,
    RELEASES_LIST_API_URL,
    RELEASES_TAG_API_URL,
    RELEASES_LEGACY_TAG_API_URL,
  ];
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        cache: "no-store",
        headers: { Accept: "application/vnd.github+json" },
      });
      if (!res.ok) continue;
      const data = (await res.json()) as GitHubReleaseResponse | GitHubReleaseResponse[];
      if (Array.isArray(data)) {
        const parsedList = data
          .filter((rel) => !rel.draft && !rel.prerelease)
          .map((rel) => parseReleaseMetadata(rel))
          .filter((item): item is ApkReleaseInfo => item !== null)
          .sort((a, b) => b.versionCode - a.versionCode);
        if (parsedList.length > 0) return parsedList[0];
        continue;
      }
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

function buildNotificationSummary(release: ApkReleaseInfo): string {
  const highlights = release.changelog.flatMap((group) => group.items).slice(0, 2);
  if (highlights.length > 0) {
    return `${highlights.join(" • ")} — Ketuk untuk melihat detail & memperbarui.`;
  }
  return `Versi terbaru v${release.versionName} tersedia. Ketuk untuk mengunduh pembaruan.`;
}

export async function notifyApkUpdateAvailable(release: ApkReleaseInfo): Promise<void> {
  if (!isNativeAndroidApp()) return;

  try {
    const alreadyNotified =
      Number.parseInt(localStorage.getItem(NOTIFIED_VERSION_STORAGE_KEY) || "0", 10) || 0;
    if (alreadyNotified >= release.versionCode) return;

    await requestStartupPermissionsOnLaunch().catch(() => undefined);

    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== "granted") return;

    try {
      await LocalNotifications.deleteChannel({ id: LEGACY_UPDATE_CHANNEL_ID }).catch(() => undefined);
      await LocalNotifications.createChannel({
        id: UPDATE_CHANNEL_ID,
        name: "Pembaruan Aplikasi",
        description: "Pemberitahuan otomatis bersuara saat versi terbaru e-Moeslife tersedia",
        importance: 4,
        visibility: 1,
        sound: UPDATE_SOUND_RES,
        vibration: true,
      });
    } catch {
      // Channel may already exist on Android
    }

    const summary = buildNotificationSummary(release);
    const largeLines = release.changelog
      .flatMap((group) => group.items.slice(0, 2).map((item) => `• [${group.label}] ${item}`))
      .slice(0, 5);

    await LocalNotifications.schedule({
      notifications: [
        {
          id: APK_UPDATE_NOTIFICATION_ID,
          title: `Pembaruan e-Moeslife v${release.versionName}`,
          body: summary,
          largeBody: largeLines.length > 0 ? largeLines.join("\n") : summary,
          summaryText: `Versi v${release.versionName}`,
          channelId: UPDATE_CHANNEL_ID,
          sound: UPDATE_SOUND_RES,
          extra: {
            type: "apk-update",
            versionCode: release.versionCode,
          },
        },
      ],
    });

    playNotificationSound("update");

    localStorage.setItem(NOTIFIED_VERSION_STORAGE_KEY, String(release.versionCode));
    void markNativeVersionNotified(release.versionCode);
  } catch {
    // Silent fallback if notification scheduling fails
  }
}
