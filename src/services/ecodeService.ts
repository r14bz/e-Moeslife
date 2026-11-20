import { Capacitor } from "@capacitor/core";

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

let summaryCache: EcodeSummary | null = null;
const listCache = new Map<string, EcodeListResult>();
const detailCache = new Map<string, EcodeItem>();

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
  const res = await fetch(`${ECODE_ENDPOINT}?${query.toString()}`, {
    headers: { Accept: "application/json" },
    signal,
  });
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

export async function fetchEcodeSummary(signal?: AbortSignal): Promise<EcodeSummary> {
  if (summaryCache) return summaryCache;
  const json = await requestEcode({ action: "summary" }, signal);
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

  const result: EcodeSummary = {
    total,
    halal,
    doubtful,
    haram,
    types: types.sort((a, b) => b.count - a.count || a.type.localeCompare(b.type)),
  };

  summaryCache = result;
  return result;
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
  const params: Record<string, string> = {
    action: "list",
    page: String(page),
    limit: String(limit),
  };
  if (options.status) params.status = options.status;
  if (options.type) params.type = options.type;

  const cacheKey = JSON.stringify(params);
  const cached = listCache.get(cacheKey);
  if (cached) return cached;

  const json = await requestEcode(params, signal);
  const payload = extractPayload(json);
  const items = extractItemsArray(payload).map(normalizeEcodeItem);
  const meta = extractMeta(json, payload, items.length, page, limit);

  const result = { items, meta };
  listCache.set(cacheKey, result);
  return result;
}

export async function searchEcodes(
  queryText: string,
  options: { page?: number; limit?: number } = {},
  signal?: AbortSignal
): Promise<EcodeListResult> {
  const q = queryText.trim();
  const page = options.page ?? 1;
  const limit = options.limit ?? 20;
  const params: Record<string, string> = {
    action: "search",
    q,
    page: String(page),
    limit: String(limit),
  };

  const cacheKey = JSON.stringify(params);
  const cached = listCache.get(cacheKey);
  if (cached) return cached;

  const json = await requestEcode(params, signal);
  const payload = extractPayload(json);
  const items = extractItemsArray(payload).map(normalizeEcodeItem);
  const meta = extractMeta(json, payload, items.length, page, limit);

  const result = { items, meta };
  listCache.set(cacheKey, result);
  return result;
}

export async function fetchEcodeDetail(code: string, signal?: AbortSignal): Promise<EcodeItem> {
  const normalizedCode = code.trim().toUpperCase();
  const cached = detailCache.get(normalizedCode);
  if (cached) return cached;

  const json = await requestEcode({ action: "detail", code: normalizedCode }, signal);
  const payload = extractPayload(json);
  const rawObj = Array.isArray(payload) ? payload[0] : payload;
  const item = normalizeEcodeItem(rawObj);
  detailCache.set(normalizedCode, item);
  return item;
}
