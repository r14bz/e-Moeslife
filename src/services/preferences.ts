const STORAGE_KEYS: Record<string, string> = {
  page: "tahlil-page",
  pageLayout: "etahlil-page-layout-v1",
  theme: "etahlil-theme",
  colorTheme: "e-moeslife:color-theme-v1",
  fontSize: "etahlil-font-size",
  ttsVoice: "etahlil-tts-voice-v1",
  quranLastRead: "e-moeslife:quran-last-v1",
  doaBookmarks: "e-moeslife:doa-bookmarks-v1",
};

const memoryPreferences = new Map<string, string>();

export function readPreference(key: string, fallback: string | null = null): string | null {
  const storageKey = STORAGE_KEYS[key] || key;
  try {
    const value = localStorage.getItem(storageKey);
    if (value !== null) {
      memoryPreferences.set(storageKey, value);
      return value;
    }
  } catch {
    // Fallback to in-memory copy when storage is restricted.
  }
  return memoryPreferences.has(storageKey) ? memoryPreferences.get(storageKey)! : fallback;
}

export function writePreference(key: string, value: string | number): boolean {
  const storageKey = STORAGE_KEYS[key] || key;
  const serialized = String(value);
  memoryPreferences.set(storageKey, serialized);
  try {
    localStorage.setItem(storageKey, serialized);
    return true;
  } catch {
    return false;
  }
}

export function readJsonPreference<T>(key: string, fallback: T): T {
  try {
    const value = readPreference(key);
    return value === null ? fallback : (JSON.parse(value) as T);
  } catch {
    return fallback;
  }
}

export function writeJsonPreference(key: string, value: unknown): boolean {
  try {
    return writePreference(key, JSON.stringify(value));
  } catch {
    return false;
  }
}

export function readKitabLastChapter(slug: string): number {
  const raw = readPreference(`e-moeslife:kitab-last:v1:${slug}`, "0");
  const parsed = Number.parseInt(raw || "0", 10);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;
}

export function writeKitabLastChapter(slug: string, chapterIndex: number): boolean {
  return writePreference(`e-moeslife:kitab-last:v1:${slug}`, Math.max(0, chapterIndex));
}

export interface QuranLastReadBookmark {
  surahNumber: number;
  surahName: string;
  ayatNumber: number;
  savedAt: string;
}

export function readQuranLastRead(): QuranLastReadBookmark | null {
  return readJsonPreference<QuranLastReadBookmark | null>("quranLastRead", null);
}

export function writeQuranLastRead(bookmark: QuranLastReadBookmark): boolean {
  return writeJsonPreference("quranLastRead", bookmark);
}

export function readDoaBookmarks(): string[] {
  const list = readJsonPreference<unknown>("doaBookmarks", []);
  return Array.isArray(list) ? list.map(String) : [];
}

export function toggleDoaBookmark(idKey: string): string[] {
  const current = readDoaBookmarks();
  const exists = current.includes(idKey);
  const next = exists ? current.filter((item) => item !== idKey) : [idKey, ...current];
  writeJsonPreference("doaBookmarks", next);
  return next;
}
