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

  const ALLOWED_ECODE_ACTIONS = new Set(["summary", "list", "search", "detail"]);
  const ALLOWED_ECODE_STATUS = new Map([
    ["halal", "Halal"],
    ["haram", "Haram"],
    ["doubtful", "Doubtful"],
  ]);

  app.get("/api/ecode", async (req, res) => {
    const pick = (v: unknown) => (Array.isArray(v) ? String(v[0] || "") : String(v || ""));
    const action = pick(req.query.action || "list").trim().toLowerCase();
    const apiKey = (process.env.AHMADSANUSI_API_KEY || "").trim();

    if (!ALLOWED_ECODE_ACTIONS.has(action)) {
      return res.status(400).json({ status: "error", message: "Aksi API E-Code tidak valid." });
    }

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
