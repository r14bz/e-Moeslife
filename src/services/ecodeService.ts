import { Capacitor } from "@capacitor/core";
import { fetchWithSwr, fetchWithTimeout, readSwrCache } from "./fastCache";

export type EcodeHalalStatus = "halal" | "doubtful" | "haram" | "unknown";

export interface EcodeItem {
  code: string;
  name: string;
  type: string;
  rawStatus: string;
  halalStatus: EcodeHalalStatus;
  description: string;
  halalReason?: string;
  source?: string;
  note?: string;
  raw: Record<string, unknown>;
}

export interface EcodeTypeStat {
  type: string;
  count: number;
}

export interface EcodeSummary {
  total: number;
  halal: number;
  doubtful: number;
  haram: number;
  types: EcodeTypeStat[];
}

export interface EcodeListMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface EcodeListResult {
  items: EcodeItem[];
  meta: EcodeListMeta;
}

export class EcodeApiError extends Error {
  unconfigured: boolean;
  statusCode: number;

  constructor(message: string, options?: { unconfigured?: boolean; statusCode?: number }) {
    super(message);
    this.name = "EcodeApiError";
    this.unconfigured = Boolean(options?.unconfigured);
    this.statusCode = options?.statusCode ?? 500;
  }
}

const ECODE_ENDPOINT = Capacitor.isNativePlatform()
  ? "https://e-moeslife.vercel.app/api/ecode"
  : "/api/ecode";

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

function pickString(obj: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const val = asText(obj[key]);
    if (val) return val;
  }
  return "";
}

export function normalizeHalalStatus(raw: string): EcodeHalalStatus {
  const lower = raw.trim().toLowerCase();
  if (!lower) return "unknown";
  if (lower.includes("haram")) return "haram";
  if (
    lower.includes("doubt") ||
    lower.includes("syubhat") ||
    lower.includes("mushbooh") ||
    lower.includes("masbooh") ||
    lower.includes("ragu")
  ) {
    return "doubtful";
  }
  if (lower.includes("halal")) return "halal";
  return "unknown";
}

function normalizeEcodeItem(rawValue: unknown): EcodeItem {
  const obj =
    rawValue && typeof rawValue === "object" && !Array.isArray(rawValue)
      ? (rawValue as Record<string, unknown>)
      : {};

  const code = pickString(obj, ["e_code", "ecode", "code", "kode", "number", "e_number"]);
  const name = pickString(obj, ["e_name", "name", "nama", "title", "ingredient", "substance"]);
  const type = pickString(obj, ["e_type", "type", "category", "kategori", "jenis", "function"]);
  const rawStatus = pickString(obj, ["halal_status", "status_halal", "status", "hukum"]);
  const description = pickString(obj, [
    "description",
    "e_description",
    "deskripsi",
    "keterangan",
    "info",
    "detail",
    "uses",
  ]);
  const halalReason = pickString(obj, ["halal_reason", "reason", "alasan_halal", "alasan"]);
  const source = pickString(obj, ["source", "sumber", "origin", "asal"]);
  const note = pickString(obj, ["note", "notes", "catatan", "warning", "halal_note"]);

  return {
    code: code || "E-Code",
    name: name || "Bahan Tambahan Pangan",
    type: type || "Lainnya",
    rawStatus: rawStatus || "Tidak diketahui",
    halalStatus: normalizeHalalStatus(rawStatus),
    description,
    halalReason: halalReason || undefined,
    source: source || undefined,
    note: note || undefined,
    raw: obj,
  };
}

function extractPayload(json: Record<string, unknown>): unknown {
  return json.data !== undefined ? json.data : json;
}

function extractItemsArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const obj = payload as Record<string, unknown>;
  for (const key of ["items", "ecodes", "e_codes", "results", "list", "rows", "data"]) {
    if (Array.isArray(obj[key])) return obj[key] as unknown[];
  }
  return [];
}

function extractMeta(json: Record<string, unknown>, payload: unknown, itemCount: number, fallbackPage: number, fallbackLimit: number): EcodeListMeta {
  const candidates = [
    json.meta,
    json.pagination,
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>).meta
      : undefined,
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>).pagination
      : undefined,
    payload && typeof payload === "object" && !Array.isArray(payload) ? payload : undefined,
  ];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;
    const m = candidate as Record<string, unknown>;
    const total = asNumber(m.total ?? m.total_items ?? m.count, -1);
    const perPage = asNumber(m.per_page ?? m.limit ?? m.page_size, fallbackLimit);
    const page = asNumber(m.page ?? m.current_page, fallbackPage);
    const totalPages = asNumber(
      m.total_pages ?? m.pages,
      total >= 0 && perPage > 0 ? Math.max(1, Math.ceil(total / perPage)) : 1
    );
    if (total >= 0 || m.total_pages !== undefined || m.per_page !== undefined) {
      return {
        page: Math.max(1, page),
        perPage: Math.max(1, perPage),
        total: Math.max(itemCount, total),
        totalPages: Math.max(1, totalPages),
      };
    }
  }

  return {
    page: fallbackPage,
    perPage: fallbackLimit,
    total: itemCount,
    totalPages: 1,
  };
}

async function requestEcode(params: Record<string, string>, signal?: AbortSignal): Promise<Record<string, unknown>> {
  const query = new URLSearchParams(params);
  const res = await fetchWithTimeout(
    `${ECODE_ENDPOINT}?${query.toString()}`,
    {
      headers: { Accept: "application/json" },
      signal,
    },
    12000
  );
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || json.status === "error") {
    throw new EcodeApiError(
      asText(json.message) || asText(json.detail) || `Gagal memuat data E-Code (${res.status}).`,
      {
        unconfigured: Boolean(json.unconfigured),
        statusCode: res.status,
      }
    );
  }
  return json;
}

export function getCachedEcodeSummary(): EcodeSummary | null {
  return readSwrCache<EcodeSummary>("ecode:summary", true)?.value || null;
}

export function getCachedEcodeList(options: {
  status?: "Halal" | "Haram" | "Doubtful" | "";
  type?: string;
  page?: number;
  limit?: number;
} = {}): EcodeListResult | null {
  const page = options.page ?? 1;
  const limit = options.limit ?? 20;
  const cacheKey = `ecode:list:${options.status || "all"}:${options.type || "all"}:${page}:${limit}`;
  return readSwrCache<EcodeListResult>(cacheKey, true)?.value || null;
}

export async function fetchEcodeSummary(signal?: AbortSignal): Promise<EcodeSummary> {
  return fetchWithSwr<EcodeSummary>({
    key: "ecode:summary",
    freshTtlMs: SEVEN_DAYS_MS,
    staleTtlMs: 30 * ONE_DAY_MS,
    signal,
    fetcher: async () => {
      const json = await requestEcode({ action: "summary" });
      const payload = extractPayload(json);
      const obj =
        payload && typeof payload === "object" && !Array.isArray(payload)
          ? (payload as Record<string, unknown>)
          : {};

      const statusObj =
        (obj.by_status || obj.status_distribution || obj.statuses || obj.status_counts || obj) as Record<
          string,
          unknown
        >;

      const halal = asNumber(statusObj.Halal ?? statusObj.halal, 0);
      const doubtful = asNumber(
        statusObj.Doubtful ?? statusObj.doubtful ?? statusObj.Mushbooh ?? statusObj.mushbooh,
        0
      );
      const haram = asNumber(statusObj.Haram ?? statusObj.haram, 0);
      const total = asNumber(obj.total ?? obj.total_ecodes ?? obj.count, halal + doubtful + haram);

      const typesRaw = obj.by_type ?? obj.types ?? obj.categories ?? obj.e_types;
      const types: EcodeTypeStat[] = [];

      if (Array.isArray(typesRaw)) {
        for (const entry of typesRaw) {
          if (typeof entry === "string") {
            if (entry.trim()) types.push({ type: entry.trim(), count: 0 });
          } else if (entry && typeof entry === "object") {
            const rec = entry as Record<string, unknown>;
            const name = pickString(rec, ["type", "e_type", "name", "category", "label"]);
            const count = asNumber(rec.jumlah ?? rec.count ?? rec.total, 0);
            if (name) types.push({ type: name, count });
          }
        }
      } else if (typesRaw && typeof typesRaw === "object") {
        for (const [k, v] of Object.entries(typesRaw as Record<string, unknown>)) {
          if (k.trim()) {
            types.push({ type: k.trim(), count: asNumber(v, 0) });
          }
        }
      }

      return {
        total,
        halal,
        doubtful,
        haram,
        types: types.sort((a, b) => b.count - a.count || a.type.localeCompare(b.type)),
      };
    },
  });
}

export async function fetchEcodeList(
  options: {
    status?: "Halal" | "Haram" | "Doubtful" | "";
    type?: string;
    page?: number;
    limit?: number;
  } = {},
  signal?: AbortSignal
): Promise<EcodeListResult> {
  const page = options.page ?? 1;
  const limit = options.limit ?? 20;
  const cacheKey = `ecode:list:${options.status || "all"}:${options.type || "all"}:${page}:${limit}`;

  return fetchWithSwr<EcodeListResult>({
    key: cacheKey,
    freshTtlMs: ONE_DAY_MS,
    staleTtlMs: SEVEN_DAYS_MS,
    signal,
    fetcher: async () => {
      const params: Record<string, string> = {
        action: "list",
        page: String(page),
        limit: String(limit),
      };
      if (options.status) params.status = options.status;
      if (options.type) params.type = options.type;

      const json = await requestEcode(params);
      const payload = extractPayload(json);
      const items = extractItemsArray(payload).map(normalizeEcodeItem);
      const meta = extractMeta(json, payload, items.length, page, limit);
      return { items, meta };
    },
  });
}

export async function searchEcodes(
  queryText: string,
  options: { page?: number; limit?: number } = {},
  signal?: AbortSignal
): Promise<EcodeListResult> {
  const q = queryText.trim();
  const page = options.page ?? 1;
  const limit = options.limit ?? 20;
  const cacheKey = `ecode:search:${q.toLowerCase()}:${page}:${limit}`;

  return fetchWithSwr<EcodeListResult>({
    key: cacheKey,
    freshTtlMs: 6 * 60 * 60 * 1000,
    staleTtlMs: 3 * ONE_DAY_MS,
    signal,
    fetcher: async () => {
      const json = await requestEcode({
        action: "search",
        q,
        page: String(page),
        limit: String(limit),
      });
      const payload = extractPayload(json);
      const items = extractItemsArray(payload).map(normalizeEcodeItem);
      const meta = extractMeta(json, payload, items.length, page, limit);
      return { items, meta };
    },
  });
}

export async function fetchEcodeDetail(code: string, signal?: AbortSignal): Promise<EcodeItem> {
  const normalizedCode = code.trim().toUpperCase();
  return fetchWithSwr<EcodeItem>({
    key: `ecode:detail:${normalizedCode}`,
    freshTtlMs: SEVEN_DAYS_MS,
    staleTtlMs: 30 * ONE_DAY_MS,
    signal,
    fetcher: async () => {
      const json = await requestEcode({ action: "detail", code: normalizedCode });
      const payload = extractPayload(json);
      const rawObj = Array.isArray(payload) ? payload[0] : payload;
      return normalizeEcodeItem(rawObj);
    },
  });
}

export interface EcodeTranslation {
  description?: string;
  source?: string;
  note?: string;
  halalReason?: string;
}

const INDONESIAN_MARKERS = new Set([
  "yang",
  "dan",
  "atau",
  "dari",
  "untuk",
  "dalam",
  "pada",
  "dengan",
  "adalah",
  "bahan",
  "makanan",
  "minuman",
  "halal",
  "haram",
  "diragukan",
  "syubhat",
  "berasal",
  "sebagai",
  "dapat",
  "tidak",
  "bisa",
  "digunakan",
  "karena",
  "ini",
  "juga",
  "hewani",
  "nabati",
  "produk",
  "sertifikat",
]);

const ENGLISH_MARKERS = new Set([
  "the",
  "and",
  "or",
  "from",
  "for",
  "in",
  "with",
  "is",
  "are",
  "used",
  "as",
  "can",
  "also",
  "may",
  "found",
  "made",
  "food",
  "products",
  "by",
  "of",
  "its",
  "their",
  "obtained",
  "produced",
  "prepared",
  "natural",
  "synthetic",
  "derived",
  "source",
  "animal",
  "plant",
  "coloring",
  "agent",
  "agents",
  "acids",
  "which",
  "that",
  "these",
]);

export function needsIndonesianTranslation(text?: string): boolean {
  const clean = text?.trim() || "";
  if (!clean || clean.length < 3) return false;
  const words = clean.toLowerCase().match(/[a-z]{2,}/g) || [];
  if (words.length === 0) return false;

  let idHits = 0;
  let enHits = 0;
  for (const w of words) {
    if (INDONESIAN_MARKERS.has(w)) idHits += 1;
    if (ENGLISH_MARKERS.has(w)) enHits += 1;
  }

  if (idHits >= 2 && idHits > enHits) return false;
  if (enHits >= 1) return true;
  // Short noun phrases like "Plant / Animal" or "Synthetic" -> translate unless clearly Indonesian
  return idHits === 0;
}

function hashTranslationSource(parts: Array<string | undefined>): string {
  const input = parts.map((p) => (p || "").trim()).join("\u0000");
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

function getTranslationCacheKey(
  item: Pick<EcodeItem, "code" | "description" | "source" | "note" | "halalReason">
): string {
  const normalizedCode = (item.code || "ECODE").trim().toUpperCase();
  const digest = hashTranslationSource([
    item.description,
    item.source,
    item.note,
    item.halalReason,
  ]);
  return `ecode:tr:id:${normalizedCode}:${digest}`;
}

export function hasTranslatableEcodeFields(
  item: Pick<EcodeItem, "description" | "source" | "note" | "halalReason">
): boolean {
  return (
    needsIndonesianTranslation(item.description) ||
    needsIndonesianTranslation(item.source) ||
    needsIndonesianTranslation(item.note) ||
    needsIndonesianTranslation(item.halalReason)
  );
}

export function getCachedEcodeTranslation(
  item: Pick<EcodeItem, "code" | "description" | "source" | "note" | "halalReason">
): EcodeTranslation | null {
  return readSwrCache<EcodeTranslation>(getTranslationCacheKey(item), true)?.value || null;
}

function splitTranslationChunks(text: string, maxLen = 420): string[] {
  if (text.length <= maxLen) return [text];
  const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];
  const chunks: string[] = [];
  let current = "";
  for (const part of sentences) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (current && current.length + 1 + trimmed.length > maxLen) {
      chunks.push(current);
      current = trimmed;
    } else {
      current = current ? `${current} ${trimmed}` : trimmed;
    }
  }
  if (current) chunks.push(current);
  return chunks.length > 0 ? chunks : [text.slice(0, maxLen)];
}

async function translateSnippetDirect(text: string, signal?: AbortSignal): Promise<string> {
  const tryClients5 = async (): Promise<string> => {
    const url = new URL("https://clients5.google.com/translate_a/t");
    url.searchParams.set("client", "dict-chrome-ex");
    url.searchParams.set("sl", "en");
    url.searchParams.set("tl", "id");
    url.searchParams.set("q", text);
    const res = await fetchWithTimeout(
      url.toString(),
      { headers: { Accept: "application/json" }, signal },
      6500
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const parsed = (await res.json()) as unknown;
    if (Array.isArray(parsed)) {
      const joined = parsed
        .map((item) =>
          typeof item === "string"
            ? item
            : Array.isArray(item) && typeof item[0] === "string"
              ? item[0]
              : ""
        )
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (joined) return joined;
    }
    throw new Error("Format respons terjemahan tidak valid.");
  };

  const tryMyMemory = async (): Promise<string> => {
    const chunks = splitTranslationChunks(text, 420);
    const translatedChunks = await Promise.all(
      chunks.map(async (chunk) => {
        const url = new URL("https://api.mymemory.translated.net/get");
        url.searchParams.set("q", chunk);
        url.searchParams.set("langpair", "en|id");
        const res = await fetchWithTimeout(
          url.toString(),
          { headers: { Accept: "application/json" }, signal },
          7000
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const parsed = (await res.json()) as { responseData?: { translatedText?: string } };
        const out =
          typeof parsed?.responseData?.translatedText === "string"
            ? parsed.responseData.translatedText.trim()
            : "";
        if (!out || /QUERY LENGTH LIMIT EXCEEDED/i.test(out)) {
          throw new Error("Terjemahan MyMemory tidak valid.");
        }
        return out;
      })
    );
    return translatedChunks.join(" ").trim();
  };

  const tryGtx = async (): Promise<string> => {
    const url = new URL("https://translate.googleapis.com/translate_a/single");
    url.searchParams.set("client", "gtx");
    url.searchParams.set("sl", "en");
    url.searchParams.set("tl", "id");
    url.searchParams.set("dt", "t");
    url.searchParams.set("q", text);

    const res = await fetchWithTimeout(
      url.toString(),
      { headers: { Accept: "application/json" }, signal },
      6500
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const parsed = (await res.json()) as unknown;
    if (!Array.isArray(parsed) || !Array.isArray(parsed[0])) {
      throw new Error("Format respons terjemahan tidak valid.");
    }
    const translated = (parsed[0] as unknown[])
      .map((seg) => (Array.isArray(seg) && typeof seg[0] === "string" ? seg[0] : ""))
      .join("")
      .trim();
    if (!translated) throw new Error("Hasil terjemahan kosong.");
    return translated;
  };

  let lastErr: unknown;
  for (const fn of [tryClients5, tryMyMemory, tryGtx]) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    try {
      const result = await fn();
      if (result) return result;
    } catch (err) {
      if (signal?.aborted) throw err;
      lastErr = err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Gagal menerjemahkan teks.");
}

export async function translateEcodeItem(
  item: Pick<EcodeItem, "code" | "description" | "source" | "note" | "halalReason">,
  signal?: AbortSignal
): Promise<EcodeTranslation> {
  const fieldsToTranslate: Record<string, string> = {};
  if (needsIndonesianTranslation(item.description)) {
    fieldsToTranslate.description = item.description.trim();
  }
  if (needsIndonesianTranslation(item.source) && item.source) {
    fieldsToTranslate.source = item.source.trim();
  }
  if (needsIndonesianTranslation(item.note) && item.note) {
    fieldsToTranslate.note = item.note.trim();
  }
  const translateHalalReason = needsIndonesianTranslation(item.halalReason) && Boolean(item.halalReason);

  if (Object.keys(fieldsToTranslate).length === 0 && !translateHalalReason) {
    return {
      description: item.description,
      source: item.source,
      note: item.note,
      halalReason: item.halalReason,
    };
  }

  return fetchWithSwr<EcodeTranslation>({
    key: getTranslationCacheKey(item),
    freshTtlMs: 30 * ONE_DAY_MS,
    staleTtlMs: 90 * ONE_DAY_MS,
    signal,
    fetcher: async () => {
      let translatedFields: Record<string, string> = {};

      if (Object.keys(fieldsToTranslate).length > 0) {
        let serverWorked = false;
        try {
          const res = await fetchWithTimeout(
            `${ECODE_ENDPOINT}?action=translate`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({ fields: fieldsToTranslate }),
              signal,
            },
            7500
          );
          if (res.ok) {
            const json = (await res.json().catch(() => null)) as {
              status?: string;
              data?: Record<string, unknown>;
            } | null;
            if (json?.status === "ok" && json.data && typeof json.data === "object") {
              for (const key of Object.keys(fieldsToTranslate)) {
                const val = json.data[key];
                if (typeof val === "string" && val.trim()) {
                  translatedFields[key] = val.trim();
                }
              }
              if (Object.keys(translatedFields).length > 0) {
                serverWorked = true;
              }
            }
          }
        } catch (err) {
          if (signal?.aborted) throw err;
        }

        if (!serverWorked) {
          const pairs = await Promise.all(
            Object.entries(fieldsToTranslate).map(
              async ([key, text]) => [key, await translateSnippetDirect(text, signal)] as const
            )
          );
          translatedFields = Object.fromEntries(pairs);
        }
      }

      let translatedReason = item.halalReason;
      if (translateHalalReason && item.halalReason) {
        try {
          translatedReason = await translateSnippetDirect(item.halalReason.trim(), signal);
        } catch {
          translatedReason = item.halalReason;
        }
      }

      return {
        description: translatedFields.description || item.description,
        source: translatedFields.source || item.source,
        note: translatedFields.note || item.note,
        halalReason: translatedReason,
      };
    },
  });
}
