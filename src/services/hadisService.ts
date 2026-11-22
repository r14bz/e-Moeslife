import { Capacitor } from "@capacitor/core";
import { fetchWithSwr, fetchWithTimeout, readSwrCache } from "./fastCache";

export interface HadisBookMeta {
  slug: string;
  nama: string;
  jumlah: number;
}

export interface HadisItem {
  nomor: number;
  kitab: string;
  kitabNama: string;
  arab: string;
  terjemah: string;
  hasTerjemah: boolean;
}

export interface HadisListResult {
  items: HadisItem[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  kitab?: string;
  kitabNama?: string;
  query?: string;
}

export class HadisApiError extends Error {
  unconfigured: boolean;
  statusCode: number;

  constructor(message: string, options?: { unconfigured?: boolean; statusCode?: number }) {
    super(message);
    this.name = "HadisApiError";
    this.unconfigured = Boolean(options?.unconfigured);
    this.statusCode = options?.statusCode ?? 500;
  }
}

const HADITS_ENDPOINT = Capacitor.isNativePlatform()
  ? "https://e-moeslife.vercel.app/api/hadits"
  : "/api/hadits";

const FALLBACK_KITAB_NAMES: Record<string, string> = {
  shahih_bukhari: "Shahih Bukhari",
  shahih_muslim: "Shahih Muslim",
  sunan_abu_daud: "Sunan Abu Daud",
  sunan_tirmidzi: "Sunan Tirmidzi",
  sunan_nasai: "Sunan Nasa'i",
  sunan_ibnu_majah: "Sunan Ibnu Majah",
  musnad_ahmad: "Musnad Ahmad",
  musnad_syafii: "Musnad Syafi'i",
  riyadhus_shalihin: "Riyadhus Shalihin",
  riyadhus_shalihin_arab: "Riyadhus Shalihin (Arab)",
};

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;
const SEVEN_DAYS_MS = 7 * ONE_DAY_MS;

function asText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function formatHadisKitabName(slug: string, books?: HadisBookMeta[]): string {
  const cleanSlug = slug.trim();
  const matched = books?.find((b) => b.slug === cleanSlug);
  if (matched?.nama) return matched.nama;
  if (FALLBACK_KITAB_NAMES[cleanSlug]) return FALLBACK_KITAB_NAMES[cleanSlug];
  return cleanSlug
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeHadisItem(rawValue: unknown, books?: HadisBookMeta[]): HadisItem {
  const obj =
    rawValue && typeof rawValue === "object" && !Array.isArray(rawValue)
      ? (rawValue as Record<string, unknown>)
      : {};

  const kitab = asText(obj.kitab || obj.book || obj.slug);
  const nomor = asNumber(obj.nomor ?? obj.number ?? obj.id, 0);
  const arab = asText(obj.arab || obj.arabic || obj.teks_arab);
  const terjemah = asText(obj.terjemah || obj.terjemahan || obj.translation || obj.idn);
  const hasTerjemah =
    typeof obj.has_terjemah === "boolean" ? obj.has_terjemah : terjemah.length > 0;

  return {
    nomor,
    kitab,
    kitabNama: formatHadisKitabName(kitab, books),
    arab,
    terjemah,
    hasTerjemah,
  };
}

async function requestHadis(
  params: Record<string, string>,
  signal?: AbortSignal
): Promise<Record<string, unknown>> {
  const query = new URLSearchParams(params);
  const res = await fetchWithTimeout(
    `${HADITS_ENDPOINT}?${query.toString()}`,
    {
      headers: { Accept: "application/json" },
      signal,
    },
    12000
  );
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || json.status === "error") {
    throw new HadisApiError(
      asText(json.message) || asText(json.detail) || `Gagal memuat data hadis (${res.status}).`,
      {
        unconfigured: Boolean(json.unconfigured),
        statusCode: res.status,
      }
    );
  }
  return json;
}

export function getCachedHadisBooks(): HadisBookMeta[] | null {
  return readSwrCache<HadisBookMeta[]>("hadis:books", true)?.value || null;
}

export function getCachedDailyHadis(): HadisItem | null {
  return readSwrCache<HadisItem>("hadis:daily", true)?.value || null;
}

export function getCachedHadisList(kitab: string, page = 1, limit = 15): HadisListResult | null {
  const key = `hadis:list:${kitab}:${page}:${limit}`;
  return readSwrCache<HadisListResult>(key, true)?.value || null;
}

export async function fetchHadisBooks(signal?: AbortSignal): Promise<HadisBookMeta[]> {
  return fetchWithSwr<HadisBookMeta[]>({
    key: "hadis:books",
    freshTtlMs: SEVEN_DAYS_MS,
    staleTtlMs: 30 * ONE_DAY_MS,
    signal,
    fetcher: async () => {
      const json = await requestHadis({ action: "books" });
      const data = (json.data ?? json) as Record<string, unknown>;
      const rawList = Array.isArray(data.kitab)
        ? data.kitab
        : Array.isArray(data)
        ? data
        : [];

      return rawList
        .map((entry) => {
          const rec =
            entry && typeof entry === "object" ? (entry as Record<string, unknown>) : {};
          const slug = asText(rec.slug || rec.kitab);
          const nama = asText(rec.nama || rec.name) || formatHadisKitabName(slug);
          const jumlah = asNumber(rec.jumlah ?? rec.total ?? rec.count, 0);
          return { slug, nama, jumlah };
        })
        .filter((item) => item.slug.length > 0);
    },
  });
}

export async function fetchDailyHadis(
  books?: HadisBookMeta[],
  signal?: AbortSignal
): Promise<HadisItem> {
  const knownBooks = books?.length ? books : getCachedHadisBooks() || undefined;
  return fetchWithSwr<HadisItem>({
    key: "hadis:daily",
    freshTtlMs: 2 * ONE_HOUR_MS,
    staleTtlMs: ONE_DAY_MS,
    signal,
    fetcher: async () => {
      const json = await requestHadis({ action: "daily" });
      const data = json.data ?? json;
      return normalizeHadisItem(data, knownBooks);
    },
  });
}

export async function fetchHadisList(
  options: {
    kitab: string;
    page?: number;
    limit?: number;
    books?: HadisBookMeta[];
  },
  signal?: AbortSignal
): Promise<HadisListResult> {
  const page = options.page ?? 1;
  const limit = options.limit ?? 20;
  const cacheKey = `hadis:list:${options.kitab}:${page}:${limit}`;
  const knownBooks = options.books?.length ? options.books : getCachedHadisBooks() || undefined;

  return fetchWithSwr<HadisListResult>({
    key: cacheKey,
    freshTtlMs: ONE_DAY_MS,
    staleTtlMs: SEVEN_DAYS_MS,
    signal,
    fetcher: async () => {
      const json = await requestHadis({
        action: "list",
        kitab: options.kitab,
        page: String(page),
        limit: String(limit),
      });
      const data = (json.data ?? json) as Record<string, unknown>;
      const rawItems = Array.isArray(data.hadiths)
        ? data.hadiths
        : Array.isArray(data.results)
        ? data.results
        : Array.isArray(data.items)
        ? data.items
        : [];

      const items = rawItems.map((entry) => normalizeHadisItem(entry, knownBooks));
      const total = asNumber(data.total, items.length);
      const perPage = asNumber(data.per_page ?? data.limit, limit);
      const totalPages = asNumber(
        data.total_pages,
        perPage > 0 ? Math.max(1, Math.ceil(total / perPage)) : 1
      );

      return {
        items,
        page: Math.max(1, asNumber(data.page, page)),
        perPage: Math.max(1, perPage),
        total,
        totalPages: Math.max(1, totalPages),
        kitab: asText(data.kitab) || options.kitab,
        kitabNama: asText(data.nama) || formatHadisKitabName(options.kitab, knownBooks),
      };
    },
  });
}

export async function searchHadis(
  queryText: string,
  options: {
    kitab?: string;
    page?: number;
    limit?: number;
    books?: HadisBookMeta[];
  } = {},
  signal?: AbortSignal
): Promise<HadisListResult> {
  const q = queryText.trim();
  const page = options.page ?? 1;
  const limit = options.limit ?? 20;
  const cacheKey = `hadis:search:${options.kitab || "all"}:${q.toLowerCase()}:${page}:${limit}`;
  const knownBooks = options.books?.length ? options.books : getCachedHadisBooks() || undefined;

  return fetchWithSwr<HadisListResult>({
    key: cacheKey,
    freshTtlMs: 6 * ONE_HOUR_MS,
    staleTtlMs: 3 * ONE_DAY_MS,
    signal,
    fetcher: async () => {
      const params: Record<string, string> = {
        action: "search",
        q,
        page: String(page),
        limit: String(limit),
      };
      if (options.kitab) params.kitab = options.kitab;

      const json = await requestHadis(params);
      const data = (json.data ?? json) as Record<string, unknown>;
      const rawItems = Array.isArray(data.results)
        ? data.results
        : Array.isArray(data.hadiths)
        ? data.hadiths
        : [];

      const items = rawItems.map((entry) => normalizeHadisItem(entry, knownBooks));
      const total = asNumber(data.total, items.length);
      const perPage = asNumber(data.per_page ?? data.limit, limit);
      const totalPages = asNumber(
        data.total_pages,
        perPage > 0 ? Math.max(1, Math.ceil(total / perPage)) : 1
      );

      return {
        items,
        page: Math.max(1, asNumber(data.page, page)),
        perPage: Math.max(1, perPage),
        total,
        totalPages: Math.max(1, totalPages),
        kitab: options.kitab || undefined,
        query: q,
      };
    },
  });
}

export async function fetchHadisDetail(
  kitab: string,
  nomor: number,
  books?: HadisBookMeta[],
  signal?: AbortSignal
): Promise<HadisItem> {
  const cacheKey = `hadis:detail:${kitab}:${nomor}`;
  const knownBooks = books?.length ? books : getCachedHadisBooks() || undefined;

  return fetchWithSwr<HadisItem>({
    key: cacheKey,
    freshTtlMs: SEVEN_DAYS_MS,
    staleTtlMs: 30 * ONE_DAY_MS,
    signal,
    fetcher: async () => {
      const json = await requestHadis({
        action: "detail",
        kitab,
        nomor: String(nomor),
      });
      const data = json.data ?? json;
      return normalizeHadisItem(data, knownBooks);
    },
  });
}
