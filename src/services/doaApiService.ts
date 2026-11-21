import { Capacitor } from "@capacitor/core";
import type { EQuranDoaItem } from "../types/emoeslife";

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

let cachedCategories: SanusiDoaCategory[] | null = null;
let cachedAllDoaItems: EQuranDoaItem[] | null = null;
const categoryListCache = new Map<string, EQuranDoaItem[]>();

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
  const res = await fetch(`${DOA_ENDPOINT}?${query.toString()}`, {
    headers: { Accept: "application/json" },
    signal,
  });
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

export async function fetchSanusiDoaCategories(
  signal?: AbortSignal
): Promise<SanusiDoaCategory[]> {
  if (cachedCategories) return cachedCategories;
  const json = await requestSanusiDoa({ action: "categories" }, signal);
  const rawList = Array.isArray(json.data) ? json.data : [];

  const parsed: SanusiDoaCategory[] = rawList
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

  cachedCategories = parsed;
  return parsed;
}

async function fetchCategoryAllPages(
  cat: SanusiDoaCategory,
  signal?: AbortSignal
): Promise<EQuranDoaItem[]> {
  const cached = categoryListCache.get(cat.slug);
  if (cached) return cached;

  const limit = 100;
  const estimatedPages = Math.max(1, Math.min(5, Math.ceil((cat.total || limit) / limit)));
  const pageNumbers = Array.from({ length: estimatedPages }, (_, i) => i + 1);

  const responses = await Promise.allSettled(
    pageNumbers.map((page) =>
      requestSanusiDoa(
        { action: "list", slug: cat.slug, page: String(page), limit: String(limit) },
        signal
      )
    )
  );

  const items: EQuranDoaItem[] = [];
  for (const res of responses) {
    if (res.status !== "fulfilled") continue;
    const data = (res.value.data ?? res.value) as Record<string, unknown>;
    const rawDoa = Array.isArray(data.doa) ? (data.doa as SanusiDoaRawItem[]) : [];
    for (const raw of rawDoa) {
      items.push(normalizeSanusiDoaItem(raw, { nama: cat.nama, slug: cat.slug }));
    }
  }

  if (items.length > 0) {
    categoryListCache.set(cat.slug, items);
  }
  return items;
}

export async function fetchAllSanusiDoaAndDzikir(
  signal?: AbortSignal
): Promise<{ categories: SanusiDoaCategory[]; items: EQuranDoaItem[] }> {
  if (cachedCategories && cachedAllDoaItems) {
    return { categories: cachedCategories, items: cachedAllDoaItems };
  }

  const categories = await fetchSanusiDoaCategories(signal);
  const categoryResults = await Promise.allSettled(
    categories.map((cat) => fetchCategoryAllPages(cat, signal))
  );

  const items: EQuranDoaItem[] = [];
  for (const result of categoryResults) {
    if (result.status === "fulfilled") {
      items.push(...result.value);
    }
  }

  if (items.length > 0) {
    cachedAllDoaItems = items;
  }
  return { categories, items };
}

export async function searchSanusiDoa(
  queryText: string,
  categories?: SanusiDoaCategory[],
  signal?: AbortSignal
): Promise<EQuranDoaItem[]> {
  const q = queryText.trim();
  if (q.length < 2) return [];
  const json = await requestSanusiDoa({ action: "search", q, limit: "40" }, signal);
  const rawList = Array.isArray(json.data) ? (json.data as SanusiDoaRawItem[]) : [];
  const catMap = new Map((categories || cachedCategories || []).map((c) => [c.id, c]));

  return rawList.map((raw) => {
    const cat = raw.kategori_id ? catMap.get(raw.kategori_id) : undefined;
    return normalizeSanusiDoaItem(raw, cat ? { nama: cat.nama, slug: cat.slug } : undefined);
  });
}
