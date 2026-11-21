const BASE_URL = "https://api.ahmadsanusi.com";
const ALLOWED_ACTIONS = new Set(["categories", "list", "search", "detail"]);

function parsePositiveInt(raw, fallback, max) {
  if (raw === undefined || raw === null || String(raw).trim() === "") return fallback;
  const num = Number(raw);
  if (!Number.isInteger(num) || num < 1 || num > max) return null;
  return num;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Accept, Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return res.status(405).json({ status: "error", message: "Method tidak diizinkan." });
  }

  const apiKey = (process.env.AHMADSANUSI_API_KEY || "").trim();
  if (!apiKey) {
    return res.status(503).json({
      status: "error",
      unconfigured: true,
      message:
        "Layanan Do'a & Dzikir Ahmad Sanusi belum aktif karena AHMADSANUSI_API_KEY belum dikonfigurasi di server.",
    });
  }

  const query = req.query || {};
  const action = String(query.action || "categories").trim().toLowerCase();
  if (!ALLOWED_ACTIONS.has(action)) {
    return res.status(400).json({ status: "error", message: "Aksi API Do'a & Dzikir tidak valid." });
  }

  const upstream = new URL(`${BASE_URL}/v1/doa/kategori`);

  if (action === "categories") {
    upstream.pathname = "/v1/doa/kategori";
  } else if (action === "list") {
    const slug = typeof query.slug === "string" ? query.slug.trim() : "";
    if (!/^[a-z0-9-]{2,60}$/i.test(slug)) {
      return res.status(400).json({ status: "error", message: "Slug kategori do'a tidak valid." });
    }
    const page = parsePositiveInt(query.page, 1, 100);
    const limit = parsePositiveInt(query.limit, 100, 100);
    if (page === null || limit === null) {
      return res.status(400).json({ status: "error", message: "Parameter halaman do'a tidak valid." });
    }
    upstream.pathname = `/v1/doa/kategori/${encodeURIComponent(slug)}`;
    upstream.searchParams.set("page", String(page));
    upstream.searchParams.set("limit", String(limit));
  } else if (action === "search") {
    const keyword = typeof query.q === "string" ? query.q.trim() : "";
    if (keyword.length < 2 || keyword.length > 100) {
      return res.status(400).json({
        status: "error",
        message: "Kata pencarian do'a minimal 2 dan maksimal 100 karakter.",
      });
    }
    const limit = parsePositiveInt(query.limit, 30, 50);
    if (limit === null) {
      return res.status(400).json({ status: "error", message: "Batas jumlah do'a tidak valid." });
    }
    upstream.pathname = "/v1/doa/search";
    upstream.searchParams.set("q", keyword);
    upstream.searchParams.set("limit", String(limit));
  } else if (action === "detail") {
    const id = parsePositiveInt(query.id, 0, 100000);
    if (!id) {
      return res.status(400).json({ status: "error", message: "ID do'a tidak valid." });
    }
    upstream.pathname = `/v1/doa/${id}`;
  }

  try {
    const response = await fetch(upstream.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-API-Key": apiKey,
      },
    });
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { status: "error", message: "Respons layanan Do'a & Dzikir bukan JSON yang valid." };
    }
    if (!response.ok) {
      const status = response.status === 401 || response.status === 403 ? 502 : response.status;
      return res.status(status).json({
        status: "error",
        message:
          response.status === 401 || response.status === 403
            ? "Autentikasi API Ahmad Sanusi ditolak. Periksa AHMADSANUSI_API_KEY di server."
            : data?.detail || data?.message || "Layanan Do'a & Dzikir sedang bermasalah.",
      });
    }
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.setHeader("Vary", "Accept");
    return res.status(200).json(data);
  } catch {
    return res.status(502).json({
      status: "error",
      message: "Tidak dapat terhubung ke layanan Do'a & Dzikir. Silakan coba kembali.",
    });
  }
}
