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
const ALLOWED_KITAB_ACTIONS = new Set(["list", "categories", "detail", "chapter", "search"]);

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
    const action = String(req.query.action || "");
    const apiKey = process.env.AHMADSANUSI_API_KEY;

    if (!apiKey) {
      if (action === "list") {
        return res.status(200).json({ status: "ok", unconfigured: true, data: [] });
      }
      return res.status(503).json({
        status: "error",
        message: "Konfigurasi layanan kitab belum tersedia di server.",
      });
    }

    const slug = typeof req.query.slug === "string" ? req.query.slug : "";
    const nomor = req.query.nomor;
    const q = typeof req.query.q === "string" ? req.query.q : "";
    const page = req.query.page;
    const limit = req.query.limit;

    if (!ALLOWED_KITAB_ACTIONS.has(action)) {
      return res.status(400).json({ status: "error", message: "Permintaan katalog kitab tidak valid." });
    }

    let apiPath = "/v1/kitab";
    if (action === "categories") apiPath += "/kategori";
    if (action === "detail" || action === "chapter" || action === "search") {
      if (!/^[a-z0-9][a-z0-9_-]{0,100}$/i.test(slug)) {
        return res.status(400).json({ status: "error", message: "Identitas kitab tidak valid." });
      }
      apiPath += "/" + encodeURIComponent(slug);
      if (action === "chapter") {
        const chapterNumber = String(nomor ?? "");
        if (!/^[0-9]{1,5}$/.test(chapterNumber)) {
          return res.status(400).json({ status: "error", message: "Nomor bab tidak valid." });
        }
        apiPath += "/bab/" + chapterNumber;
      } else if (action === "search") {
        apiPath += "/search";
        const keyword = q.trim();
        if (keyword.length < 2 || keyword.length > 100) {
          return res.status(400).json({
            status: "error",
            message: "Kata pencarian minimal 2 dan maksimal 100 karakter.",
          });
        }
      }
    }

    const targetUrl = new URL(KITAB_BASE_URL + apiPath);
    if (action === "search") targetUrl.searchParams.set("q", q.trim());
    if (action === "detail") {
      const pageNumber = Number(page ?? 1);
      const pageLimit = Number(limit ?? 100);
      if (
        !Number.isInteger(pageNumber) ||
        pageNumber < 1 ||
        pageNumber > 1000 ||
        !Number.isInteger(pageLimit) ||
        pageLimit < 1 ||
        pageLimit > 100
      ) {
        return res.status(400).json({ status: "error", message: "Parameter halaman kitab tidak valid." });
      }
      targetUrl.searchParams.set("page", String(pageNumber));
      targetUrl.searchParams.set("limit", String(pageLimit));
    }

    try {
      const upstream = await fetch(targetUrl, {
        method: "GET",
        headers: { Accept: "application/json", "X-API-Key": apiKey },
      });
      const body = await upstream.text();
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(body);
      } catch {
        data = { status: "error", message: "Respons layanan kitab bukan JSON yang valid." };
      }
      if (!upstream.ok) {
        const status = upstream.status === 401 || upstream.status === 403 ? 502 : upstream.status;
        return res.status(status).json({
          status: "error",
          message:
            upstream.status === 401 || upstream.status === 403
              ? "Autentikasi layanan kitab ditolak. Periksa AHMADSANUSI_API_KEY."
              : String(data.detail || data.message || "Layanan kitab sedang bermasalah."),
        });
      }
      res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=1800");
      return res.status(200).json(data);
    } catch {
      return res.status(502).json({
        status: "error",
        message: "Tidak dapat terhubung ke layanan kitab. Silakan coba kembali.",
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
