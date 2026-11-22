import { Capacitor } from "@capacitor/core";
import type { EQuranDoaItem } from "../types/emoeslife";
import { fetchWithSwr, fetchWithTimeout, readSwrCache } from "./fastCache";

export interface SanusiDoaCategory {
  id: number;
  nama: string;
  slug: string;
  groupName: string;
  total: number;
}

interface SanusiDoaRawItem {
  id?: number;
  kategori_id?: number;
  judul?: string;
  arab?: string;
  latin?: string;
  terjemah?: string;
  fawaid?: string;
  catatan?: string;
  sumber?: string;
}

const DOA_ENDPOINT = Capacitor.isNativePlatform()
  ? "https://e-moeslife.vercel.app/api/doa"
  : "/api/doa";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
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

async function requestSanusiDoa(
  params: Record<string, string>,
  signal?: AbortSignal
): Promise<Record<string, unknown>> {
  const query = new URLSearchParams(params);
  const res = await fetchWithTimeout(
    `${DOA_ENDPOINT}?${query.toString()}`,
    {
      headers: { Accept: "application/json" },
      signal,
    },
    12000
  );
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || json.status === "error") {
    throw new Error(
      asText(json.message) || asText(json.detail) || `Layanan Do'a belum tersedia (${res.status}).`
    );
  }
  return json;
}

function normalizeSanusiDoaItem(
  raw: SanusiDoaRawItem,
  category?: { nama: string; slug: string }
): EQuranDoaItem {
  const fawaid = asText(raw.fawaid);
  const catatan = asText(raw.catatan);
  const sumber = asText(raw.sumber);
  const tentangParts = [
    fawaid,
    catatan,
    sumber ? `Sumber: ${sumber}` : "",
  ].filter(Boolean);

  const numericId = asNumber(raw.id, 0);

  return {
    id: numericId > 0 ? 100000 + numericId : undefined,
    nama: asText(raw.judul) || "Do'a Harian",
    grup: category?.nama || "Do'a & Dzikir",
    kategoriSlug: category?.slug,
    ar: asText(raw.arab),
    tr: asText(raw.latin),
    idn: asText(raw.terjemah),
    fawaid: fawaid || undefined,
    catatan: catatan || undefined,
    sumber: sumber || undefined,
    tentang: tentangParts.join("\n\n") || undefined,
    tag: category?.slug ? [category.slug] : undefined,
  };
}

export function getCachedSanusiDoaAndDzikir(): {
  categories: SanusiDoaCategory[];
  items: EQuranDoaItem[];
} | null {
  return readSwrCache<{ categories: SanusiDoaCategory[]; items: EQuranDoaItem[] }>("doa:sanusi:all", true)?.value || null;
}

export async function fetchSanusiDoaCategories(
  signal?: AbortSignal
): Promise<SanusiDoaCategory[]> {
  return fetchWithSwr<SanusiDoaCategory[]>({
    key: "doa:sanusi:categories",
    freshTtlMs: ONE_DAY_MS,
    staleTtlMs: SEVEN_DAYS_MS,
    signal,
    fetcher: async () => {
      const json = await requestSanusiDoa({ action: "categories" });
      const rawList = Array.isArray(json.data) ? json.data : [];

      return rawList
        .map((entry) => {
          const rec =
            entry && typeof entry === "object" ? (entry as Record<string, unknown>) : {};
          return {
            id: asNumber(rec.id, 0),
            nama: asText(rec.nama),
            slug: asText(rec.slug),
            groupName: asText(rec.group_name),
            total: asNumber(rec.total, 0),
          };
        })
        .filter((item) => item.slug.length > 0 && item.nama.length > 0);
    },
  });
}

async function fetchCategoryAllPages(
  cat: SanusiDoaCategory,
  signal?: AbortSignal
): Promise<EQuranDoaItem[]> {
  const limit = 100;
  return fetchWithSwr<EQuranDoaItem[]>({
    key: `doa:sanusi:cat:${cat.slug}`,
    freshTtlMs: ONE_DAY_MS,
    staleTtlMs: SEVEN_DAYS_MS,
    signal,
    fetcher: async () => {
      const firstJson = await requestSanusiDoa({
        action: "list",
        slug: cat.slug,
        page: "1",
        limit: String(limit),
      });
      const firstData = (firstJson.data ?? firstJson) as Record<string, unknown>;
      const firstRaw = Array.isArray(firstData.doa) ? (firstData.doa as SanusiDoaRawItem[]) : [];
      const items = firstRaw.map((raw) =>
        normalizeSanusiDoaItem(raw, { nama: cat.nama, slug: cat.slug })
      );

      const reportedTotal = asNumber(firstData.total ?? cat.total, items.length);
      const totalPages = Math.min(5, Math.ceil(reportedTotal / limit));
      if (totalPages > 1 && items.length >= limit) {
        const extraPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
        const extraResponses = await Promise.allSettled(
          extraPages.map((page) =>
            requestSanusiDoa({
              action: "list",
              slug: cat.slug,
              page: String(page),
              limit: String(limit),
            })
          )
        );
        for (const res of extraResponses) {
          if (res.status !== "fulfilled") continue;
          const data = (res.value.data ?? res.value) as Record<string, unknown>;
          const rawDoa = Array.isArray(data.doa) ? (data.doa as SanusiDoaRawItem[]) : [];
          for (const raw of rawDoa) {
            items.push(normalizeSanusiDoaItem(raw, { nama: cat.nama, slug: cat.slug }));
          }
        }
      }

      return items;
    },
  });
}

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let cursor = 0;

  const runner = async () => {
    while (cursor < items.length) {
      const idx = cursor++;
      try {
        const value = await worker(items[idx]);
        results[idx] = { status: "fulfilled", value };
      } catch (reason) {
        results[idx] = { status: "rejected", reason };
      }
    }
  };

  const poolSize = Math.min(limit, Math.max(1, items.length));
  await Promise.all(Array.from({ length: poolSize }, () => runner()));
  return results;
}

export async function fetchAllSanusiDoaAndDzikir(
  signal?: AbortSignal
): Promise<{ categories: SanusiDoaCategory[]; items: EQuranDoaItem[] }> {
  return fetchWithSwr<{ categories: SanusiDoaCategory[]; items: EQuranDoaItem[] }>({
    key: "doa:sanusi:all",
    freshTtlMs: ONE_DAY_MS,
    staleTtlMs: SEVEN_DAYS_MS,
    signal,
    fetcher: async () => {
      const categories = await fetchSanusiDoaCategories();
      const categoryResults = await runWithConcurrency(categories, 4, (cat) =>
        fetchCategoryAllPages(cat)
      );

      const items: EQuranDoaItem[] = [];
      for (const result of categoryResults) {
        if (result.status === "fulfilled") {
          items.push(...result.value);
        }
      }

      return { categories, items };
    },
  });
}

export async function searchSanusiDoa(
  queryText: string,
  categories?: SanusiDoaCategory[],
  signal?: AbortSignal
): Promise<EQuranDoaItem[]> {
  const q = queryText.trim();
  if (q.length < 2) return [];
  const knownCats = categories || readSwrCache<SanusiDoaCategory[]>("doa:sanusi:categories", true)?.value || [];
  return fetchWithSwr<EQuranDoaItem[]>({
    key: `doa:sanusi:search:${q.toLowerCase()}`,
    freshTtlMs: 6 * 60 * 60 * 1000,
    staleTtlMs: ONE_DAY_MS,
    signal,
    fetcher: async () => {
      const json = await requestSanusiDoa({ action: "search", q, limit: "40" });
      const rawList = Array.isArray(json.data) ? (json.data as SanusiDoaRawItem[]) : [];
      const catMap = new Map(knownCats.map((c) => [c.id, c]));

      return rawList.map((raw) => {
        const cat = raw.kategori_id ? catMap.get(raw.kategori_id) : undefined;
        return normalizeSanusiDoaItem(raw, cat ? { nama: cat.nama, slug: cat.slug } : undefined);
      });
    },
  });
}
