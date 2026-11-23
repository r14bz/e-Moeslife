import express from "express";
import http from "http";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KITAB_BASE_URL = "https://api.ahmadsanusi.com";
const ALLOWED_KITAB_ACTIONS = new Set(["list", "detail", "chapter", "search"]);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.get("/api/maps-config", (_req, res) => {
    const apiKey =
      process.env.VITE_GOOGLE_MAPS_API_KEY ||
      process.env.GOOGLE_MAPS_API_KEY ||
      "";
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ apiKey });
  });

  app.get("/api/kitab", async (req, res) => {
    const pick = (v: unknown) => (Array.isArray(v) ? String(v[0] || "") : String(v || ""));
    const action = pick(req.query.action || "list").trim().toLowerCase();
    const apiKey = (process.env.AHMADSANUSI_API_KEY || "").trim();

    if (!ALLOWED_KITAB_ACTIONS.has(action)) {
      return res.status(400).json({ status: "error", message: "Aksi API kitab tidak valid." });
    }

    if (!apiKey) {
      if (action === "list") {
        return res.status(200).json({
          status: "ok",
          unconfigured: true,
          data: [],
        });
      }
      return res.status(503).json({
        status: "error",
        message: "API key kitab (AHMADSANUSI_API_KEY) belum dikonfigurasi di server.",
      });
    }

    const upstream = new URL(`${KITAB_BASE_URL}/v1/kitab`);
    if (action === "detail") {
      const slug = pick(req.query.slug).trim();
      if (!slug) {
        return res.status(400).json({ status: "error", message: "Parameter slug kitab wajib diisi." });
      }
      upstream.pathname = `/v1/kitab/${encodeURIComponent(slug)}`;
      if (req.query.page) upstream.searchParams.set("page", pick(req.query.page));
      if (req.query.limit) upstream.searchParams.set("limit", pick(req.query.limit));
    } else if (action === "chapter") {
      const slug = pick(req.query.slug).trim();
      const nomor = pick(req.query.nomor).trim();
      if (!slug || !nomor) {
        return res.status(400).json({
          status: "error",
          message: "Parameter slug dan nomor bab wajib diisi.",
        });
      }
      upstream.pathname = `/v1/kitab/${encodeURIComponent(slug)}/bab/${encodeURIComponent(nomor)}`;
    } else if (action === "search") {
      const q = pick(req.query.q).trim();
      if (!q) {
        return res.status(400).json({ status: "error", message: "Kata kunci pencarian wajib diisi." });
      }
      upstream.pathname = "/v1/kitab/search";
      upstream.searchParams.set("q", q);
    }

    try {
      const response = await fetch(upstream.toString(), {
        method: "GET",
        headers: {
          "X-API-Key": apiKey,
          Accept: "application/json",
        },
      });
      const text = await response.text();
      res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
      try {
        return res.status(response.status).json(JSON.parse(text));
      } catch {
        return res.status(response.status).send(text);
      }
    } catch {
      return res.status(502).json({
        status: "error",
        message: "Gagal menghubungi layanan kitab kuning.",
      });
    }
  });

  const ALLOWED_ECODE_ACTIONS = new Set(["summary", "list", "search", "detail", "translate"]);
  const ALLOWED_TRANSLATE_FIELDS = ["description", "source", "note"] as const;
  const ALLOWED_ECODE_STATUS = new Map([
    ["halal", "Halal"],
    ["haram", "Haram"],
    ["doubtful", "Doubtful"],
  ]);

  const splitTranslationChunks = (text: string, maxLen = 420): string[] => {
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
  };

  const translateEcodeText = async (text: string): Promise<string> => {
    const tryClients5 = async (): Promise<string> => {
      const url = new URL("https://clients5.google.com/translate_a/t");
      url.searchParams.set("client", "dict-chrome-ex");
      url.searchParams.set("sl", "en");
      url.searchParams.set("tl", "id");
      url.searchParams.set("q", text);
      const res = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(6500),
      });
      if (!res.ok) throw new Error(`clients5 HTTP ${res.status}`);
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
      throw new Error("clients5 invalid response");
    };

    const tryMyMemory = async (): Promise<string> => {
      const chunks = splitTranslationChunks(text, 420);
      const translatedChunks = await Promise.all(
        chunks.map(async (chunk) => {
          const url = new URL("https://api.mymemory.translated.net/get");
          url.searchParams.set("q", chunk);
          url.searchParams.set("langpair", "en|id");
          const res = await fetch(url.toString(), {
            method: "GET",
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(7000),
          });
          if (!res.ok) throw new Error(`mymemory HTTP ${res.status}`);
          const parsed = (await res.json()) as { responseData?: { translatedText?: string } };
          const out =
            typeof parsed?.responseData?.translatedText === "string"
              ? parsed.responseData.translatedText.trim()
              : "";
          if (!out || /QUERY LENGTH LIMIT EXCEEDED/i.test(out)) {
            throw new Error("mymemory invalid");
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
      const res = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(6500),
      });
      if (!res.ok) throw new Error(`gtx HTTP ${res.status}`);
      const parsed = (await res.json()) as unknown;
      if (!Array.isArray(parsed) || !Array.isArray(parsed[0])) {
        throw new Error("gtx invalid payload");
      }
      const out = (parsed[0] as unknown[])
        .map((seg) => (Array.isArray(seg) && typeof seg[0] === "string" ? seg[0] : ""))
        .join("")
        .trim();
      if (!out) throw new Error("gtx empty");
      return out;
    };

    let lastErr: unknown;
    for (const fn of [tryClients5, tryMyMemory, tryGtx]) {
      try {
        const result = await fn();
        if (result) return result;
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error("Translation failed");
  };

  app.post("/api/ecode", express.json({ limit: "32kb" }), async (req, res) => {
    const pick = (v: unknown) => (Array.isArray(v) ? String(v[0] || "") : String(v || ""));
    const action = pick(req.query.action || "").trim().toLowerCase();
    if (action !== "translate") {
      return res.status(405).json({ status: "error", message: "Method POST hanya didukung untuk terjemahan E-Code." });
    }

    const body = req.body as unknown;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({ status: "error", message: "Payload terjemahan tidak valid." });
    }
    const record = body as Record<string, unknown>;
    const rawFields =
      record.fields && typeof record.fields === "object" && !Array.isArray(record.fields)
        ? (record.fields as Record<string, unknown>)
        : record;

    const entries: Array<[string, string]> = [];
    for (const key of ALLOWED_TRANSLATE_FIELDS) {
      const val = rawFields[key];
      if (val === undefined || val === null || val === "") continue;
      if (typeof val !== "string") {
        return res.status(400).json({ status: "error", message: `Field ${key} harus berupa teks.` });
      }
      const clean = val.trim();
      if (clean.length > 2000) {
        return res.status(400).json({ status: "error", message: `Teks ${key} melebihi batas 2000 karakter.` });
      }
      if (clean) entries.push([key, clean]);
    }

    if (entries.length === 0) {
      return res.status(200).json({ status: "ok", data: {} });
    }

    try {
      const pairs = await Promise.all(
        entries.map(async ([key, text]) => [key, await translateEcodeText(text)] as const)
      );
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ status: "ok", data: Object.fromEntries(pairs) });
    } catch {
      return res.status(502).json({
        status: "error",
        message: "Layanan terjemahan sedang sibuk. Silakan coba beberapa saat lagi.",
      });
    }
  });

  app.get("/api/ecode", async (req, res) => {
    const pick = (v: unknown) => (Array.isArray(v) ? String(v[0] || "") : String(v || ""));
    const action = pick(req.query.action || "list").trim().toLowerCase();

    if (!ALLOWED_ECODE_ACTIONS.has(action)) {
      return res.status(400).json({ status: "error", message: "Aksi API E-Code tidak valid." });
    }

    if (action === "translate") {
      const entries: Array<[string, string]> = [];
      for (const key of ALLOWED_TRANSLATE_FIELDS) {
        const fallback = key === "description" ? pick(req.query.q) : "";
        const clean = (pick(req.query[key]) || fallback).trim();
        if (clean.length > 2000) {
          return res.status(400).json({ status: "error", message: `Teks ${key} melebihi batas 2000 karakter.` });
        }
        if (clean) entries.push([key, clean]);
      }
      if (entries.length === 0) {
        return res.status(200).json({ status: "ok", data: {} });
      }
      try {
        const pairs = await Promise.all(
          entries.map(async ([key, text]) => [key, await translateEcodeText(text)] as const)
        );
        res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
        return res.status(200).json({ status: "ok", data: Object.fromEntries(pairs) });
      } catch {
        return res.status(502).json({
          status: "error",
          message: "Layanan terjemahan sedang sibuk. Silakan coba beberapa saat lagi.",
        });
      }
    }

    const apiKey = (process.env.AHMADSANUSI_API_KEY || "").trim();

    if (!apiKey) {
      return res.status(503).json({
        status: "error",
        unconfigured: true,
        message:
          "Layanan Cek Halal E-Code belum aktif karena AHMADSANUSI_API_KEY belum dikonfigurasi di server.",
      });
    }

    const parsePositiveInt = (raw: string, fallback: number, max: number): number | null => {
      const value = raw.trim() ? Number(raw) : fallback;
      return Number.isInteger(value) && value >= 1 && value <= max ? value : null;
    };

    const upstream = new URL(`${KITAB_BASE_URL}/v1/ecode`);
    if (action === "summary") {
      upstream.pathname = "/v1/ecode/summary";
    } else if (action === "list") {
      const page = parsePositiveInt(pick(req.query.page), 1, 1000);
      const limit = parsePositiveInt(pick(req.query.limit), 20, 100);
      if (page === null || limit === null) {
        return res.status(400).json({ status: "error", message: "Parameter halaman E-Code tidak valid." });
      }
      upstream.searchParams.set("page", String(page));
      upstream.searchParams.set("limit", String(limit));

      const rawStatus = pick(req.query.status).trim();
      if (rawStatus) {
        const mappedStatus = ALLOWED_ECODE_STATUS.get(rawStatus.toLowerCase());
        if (!mappedStatus) {
          return res.status(400).json({ status: "error", message: "Filter status halal tidak valid." });
        }
        upstream.searchParams.set("status", mappedStatus);
      }

      const rawType = pick(req.query.type).trim();
      if (rawType) {
        if (!/^[\p{L}\p{N}\s,&/()-]{1,80}$/u.test(rawType)) {
          return res.status(400).json({ status: "error", message: "Filter kategori bahan tidak valid." });
        }
        upstream.searchParams.set("type", rawType);
      }
    } else if (action === "search") {
      const q = pick(req.query.q).trim();
      if (q.length < 1 || q.length > 100) {
        return res.status(400).json({
          status: "error",
          message: "Kata pencarian E-Code minimal 1 dan maksimal 100 karakter.",
        });
      }
      const page = parsePositiveInt(pick(req.query.page), 1, 1000);
      const limit = parsePositiveInt(pick(req.query.limit), 20, 100);
      if (page === null || limit === null) {
        return res.status(400).json({ status: "error", message: "Parameter halaman E-Code tidak valid." });
      }
      upstream.pathname = "/v1/ecode/search";
      upstream.searchParams.set("q", q);
      upstream.searchParams.set("page", String(page));
      upstream.searchParams.set("limit", String(limit));
    } else if (action === "detail") {
      const code = pick(req.query.code).trim();
      if (!/^[a-z0-9][a-z0-9._-]{0,30}$/i.test(code)) {
        return res.status(400).json({ status: "error", message: "Format kode E-Code tidak valid." });
      }
      upstream.pathname = `/v1/ecode/${encodeURIComponent(code)}`;
    }

    try {
      const response = await fetch(upstream.toString(), {
        method: "GET",
        headers: {
          "X-API-Key": apiKey,
          Accept: "application/json",
        },
      });
      const text = await response.text();
      res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
      try {
        const parsed = JSON.parse(text);
        if (!response.ok && (response.status === 401 || response.status === 403)) {
          return res.status(502).json({
            status: "error",
            message: "Autentikasi API Ahmad Sanusi ditolak. Periksa AHMADSANUSI_API_KEY di server.",
          });
        }
        return res.status(response.status).json(parsed);
      } catch {
        return res.status(response.status).send(text);
      }
    } catch {
      return res.status(502).json({
        status: "error",
        message: "Gagal menghubungi layanan E-Code Halal.",
      });
    }
  });

  const ALLOWED_HADITS_ACTIONS = new Set(["daily", "books", "list", "search", "detail"]);
  app.get("/api/hadits", async (req, res) => {
    const pick = (v: unknown) => (Array.isArray(v) ? String(v[0] || "") : String(v || ""));
    const action = pick(req.query.action || "books").trim().toLowerCase();
    const apiKey = (process.env.AHMADSANUSI_API_KEY || "").trim();

    if (!ALLOWED_HADITS_ACTIONS.has(action)) {
      return res.status(400).json({ status: "error", message: "Aksi API Hadis tidak valid." });
    }
    if (!apiKey) {
      return res.status(503).json({
        status: "error",
        unconfigured: true,
        message:
          "Layanan Pencarian Hadis belum aktif karena AHMADSANUSI_API_KEY belum dikonfigurasi di server.",
      });
    }

    const parsePositiveInt = (raw: string, fallback: number, max: number): number | null => {
      const value = raw.trim() ? Number(raw) : fallback;
      return Number.isInteger(value) && value >= 1 && value <= max ? value : null;
    };

    const upstream = new URL(`${KITAB_BASE_URL}/v1/hadits`);
    if (action === "daily") {
      upstream.pathname = "/v1/hadits/daily";
    } else if (action === "books") {
      upstream.pathname = "/v1/hadits";
    } else if (action === "list") {
      const kitab = pick(req.query.kitab).trim();
      if (!/^[a-z0-9_]{2,50}$/i.test(kitab)) {
        return res.status(400).json({ status: "error", message: "Slug kitab hadis tidak valid." });
      }
      const page = parsePositiveInt(pick(req.query.page), 1, 10000);
      const limit = parsePositiveInt(pick(req.query.limit), 20, 100);
      if (page === null || limit === null) {
        return res.status(400).json({ status: "error", message: "Parameter halaman hadis tidak valid." });
      }
      upstream.pathname = `/v1/hadits/${encodeURIComponent(kitab)}`;
      upstream.searchParams.set("page", String(page));
      upstream.searchParams.set("limit", String(limit));
    } else if (action === "search") {
      const q = pick(req.query.q).trim();
      if (q.length < 3 || q.length > 120) {
        return res.status(400).json({
          status: "error",
          message: "Kata pencarian hadis minimal 3 dan maksimal 120 karakter.",
        });
      }
      const page = parsePositiveInt(pick(req.query.page), 1, 1000);
      const limit = parsePositiveInt(pick(req.query.limit), 20, 100);
      if (page === null || limit === null) {
        return res.status(400).json({ status: "error", message: "Parameter halaman pencarian tidak valid." });
      }
      upstream.pathname = "/v1/hadits/search";
      upstream.searchParams.set("q", q);
      upstream.searchParams.set("page", String(page));
      upstream.searchParams.set("limit", String(limit));

      const kitab = pick(req.query.kitab).trim();
      if (kitab) {
        if (!/^[a-z0-9_]{2,50}$/i.test(kitab)) {
          return res.status(400).json({ status: "error", message: "Filter kitab hadis tidak valid." });
        }
        upstream.searchParams.set("kitab", kitab);
      }
    } else if (action === "detail") {
      const kitab = pick(req.query.kitab).trim();
      const nomor = parsePositiveInt(pick(req.query.nomor), 0, 100000);
      if (!/^[a-z0-9_]{2,50}$/i.test(kitab) || nomor === null || nomor < 1) {
        return res.status(400).json({ status: "error", message: "Parameter kitab atau nomor hadis tidak valid." });
      }
      upstream.pathname = `/v1/hadits/${encodeURIComponent(kitab)}/${nomor}`;
    }

    try {
      const response = await fetch(upstream.toString(), {
        method: "GET",
        headers: {
          "X-API-Key": apiKey,
          Accept: "application/json",
        },
      });
      const text = await response.text();
      res.setHeader(
        "Cache-Control",
        action === "daily" ? "s-maxage=900, stale-while-revalidate=3600" : "s-maxage=3600, stale-while-revalidate=86400"
      );
      try {
        const parsed = JSON.parse(text);
        if (!response.ok && (response.status === 401 || response.status === 403)) {
          return res.status(502).json({
            status: "error",
            message: "Autentikasi API Ahmad Sanusi ditolak. Periksa AHMADSANUSI_API_KEY di server.",
          });
        }
        return res.status(response.status).json(parsed);
      } catch {
        return res.status(response.status).send(text);
      }
    } catch {
      return res.status(502).json({
        status: "error",
        message: "Gagal menghubungi layanan Pencarian Hadis.",
      });
    }
  });

  const ALLOWED_DOA_ACTIONS = new Set(["categories", "list", "search", "detail"]);
  app.get("/api/doa", async (req, res) => {
    const pick = (v: unknown) => (Array.isArray(v) ? String(v[0] || "") : String(v || ""));
    const action = pick(req.query.action || "categories").trim().toLowerCase();
    const apiKey = (process.env.AHMADSANUSI_API_KEY || "").trim();

    if (!ALLOWED_DOA_ACTIONS.has(action)) {
      return res.status(400).json({ status: "error", message: "Aksi API Do'a & Dzikir tidak valid." });
    }
    if (!apiKey) {
      return res.status(503).json({
        status: "error",
        unconfigured: true,
        message:
          "Layanan Do'a & Dzikir belum aktif karena AHMADSANUSI_API_KEY belum dikonfigurasi di server.",
      });
    }

    const parsePositiveInt = (raw: string, fallback: number, max: number): number | null => {
      const value = raw.trim() ? Number(raw) : fallback;
      return Number.isInteger(value) && value >= 1 && value <= max ? value : null;
    };

    const upstream = new URL(`${KITAB_BASE_URL}/v1/doa/kategori`);
    if (action === "categories") {
      upstream.pathname = "/v1/doa/kategori";
    } else if (action === "list") {
      const slug = pick(req.query.slug).trim();
      if (!/^[a-z0-9-]{2,60}$/i.test(slug)) {
        return res.status(400).json({ status: "error", message: "Slug kategori do'a tidak valid." });
      }
      const page = parsePositiveInt(pick(req.query.page), 1, 100);
      const limit = parsePositiveInt(pick(req.query.limit), 100, 100);
      if (page === null || limit === null) {
        return res.status(400).json({ status: "error", message: "Parameter halaman do'a tidak valid." });
      }
      upstream.pathname = `/v1/doa/kategori/${encodeURIComponent(slug)}`;
      upstream.searchParams.set("page", String(page));
      upstream.searchParams.set("limit", String(limit));
    } else if (action === "search") {
      const q = pick(req.query.q).trim();
      if (q.length < 2 || q.length > 100) {
        return res.status(400).json({
          status: "error",
          message: "Kata pencarian do'a minimal 2 dan maksimal 100 karakter.",
        });
      }
      const limit = parsePositiveInt(pick(req.query.limit), 30, 50);
      if (limit === null) {
        return res.status(400).json({ status: "error", message: "Batas jumlah do'a tidak valid." });
      }
      upstream.pathname = "/v1/doa/search";
      upstream.searchParams.set("q", q);
      upstream.searchParams.set("limit", String(limit));
    } else if (action === "detail") {
      const id = parsePositiveInt(pick(req.query.id), 0, 100000);
      if (id === null || id < 1) {
        return res.status(400).json({ status: "error", message: "ID do'a tidak valid." });
      }
      upstream.pathname = `/v1/doa/${id}`;
    }

    try {
      const response = await fetch(upstream.toString(), {
        method: "GET",
        headers: {
          "X-API-Key": apiKey,
          Accept: "application/json",
        },
      });
      const text = await response.text();
      res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
      try {
        const parsed = JSON.parse(text);
        if (!response.ok && (response.status === 401 || response.status === 403)) {
          return res.status(502).json({
            status: "error",
            message: "Autentikasi API Ahmad Sanusi ditolak. Periksa AHMADSANUSI_API_KEY di server.",
          });
        }
        return res.status(response.status).json(parsed);
      } catch {
        return res.status(response.status).send(text);
      }
    } catch {
      return res.status(502).json({
        status: "error",
        message: "Gagal menghubungi layanan Do'a & Dzikir.",
      });
    }
  });

  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== "true",
        ws: { server: httpServer },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`e-Moeslife server listening on http://localhost:${PORT}`);
  });
}

startServer();
