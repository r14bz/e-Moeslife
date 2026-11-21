const BASE_URL = "https://api.ahmadsanusi.com";
const ALLOWED_ACTIONS = new Set(["daily", "books", "list", "search", "detail"]);

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
        "Layanan Pencarian Hadis belum aktif karena AHMADSANUSI_API_KEY belum dikonfigurasi di server.",
    });
  }

  const query = req.query || {};
  const action = String(query.action || "books").trim().toLowerCase();
  if (!ALLOWED_ACTIONS.has(action)) {
    return res.status(400).json({ status: "error", message: "Aksi API Hadis tidak valid." });
  }

  const upstream = new URL(`${BASE_URL}/v1/hadits`);

  if (action === "daily") {
    upstream.pathname = "/v1/hadits/daily";
  } else if (action === "books") {
    upstream.pathname = "/v1/hadits";
  } else if (action === "list") {
    const kitab = typeof query.kitab === "string" ? query.kitab.trim() : "";
    if (!/^[a-z0-9_]{2,50}$/i.test(kitab)) {
      return res.status(400).json({ status: "error", message: "Slug kitab hadis tidak valid." });
    }
    const page = parsePositiveInt(query.page, 1, 10000);
    const limit = parsePositiveInt(query.limit, 20, 100);
    if (page === null || limit === null) {
      return res.status(400).json({ status: "error", message: "Parameter halaman hadis tidak valid." });
    }
    upstream.pathname = `/v1/hadits/${encodeURIComponent(kitab)}`;
    upstream.searchParams.set("page", String(page));
    upstream.searchParams.set("limit", String(limit));
  } else if (action === "search") {
    const keyword = typeof query.q === "string" ? query.q.trim() : "";
    if (keyword.length < 3 || keyword.length > 120) {
      return res.status(400).json({
        status: "error",
        message: "Kata pencarian hadis minimal 3 dan maksimal 120 karakter.",
      });
    }
    const page = parsePositiveInt(query.page, 1, 1000);
    const limit = parsePositiveInt(query.limit, 20, 100);
    if (page === null || limit === null) {
      return res.status(400).json({ status: "error", message: "Parameter halaman pencarian tidak valid." });
    }
    upstream.pathname = "/v1/hadits/search";
    upstream.searchParams.set("q", keyword);
    upstream.searchParams.set("page", String(page));
    upstream.searchParams.set("limit", String(limit));

    if (typeof query.kitab === "string" && query.kitab.trim()) {
      const kitab = query.kitab.trim();
      if (!/^[a-z0-9_]{2,50}$/i.test(kitab)) {
        return res.status(400).json({ status: "error", message: "Filter kitab hadis tidak valid." });
      }
      upstream.searchParams.set("kitab", kitab);
    }
  } else if (action === "detail") {
    const kitab = typeof query.kitab === "string" ? query.kitab.trim() : "";
    const nomor = parsePositiveInt(query.nomor, 0, 100000);
    if (!/^[a-z0-9_]{2,50}$/i.test(kitab) || !nomor) {
      return res.status(400).json({ status: "error", message: "Parameter kitab atau nomor hadis tidak valid." });
    }
    upstream.pathname = `/v1/hadits/${encodeURIComponent(kitab)}/${nomor}`;
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
      data = { status: "error", message: "Respons layanan Hadis bukan JSON yang valid." };
    }
    if (!response.ok) {
      const status = response.status === 401 || response.status === 403 ? 502 : response.status;
      return res.status(status).json({
        status: "error",
        message:
          response.status === 401 || response.status === 403
            ? "Autentikasi API Ahmad Sanusi ditolak. Periksa AHMADSANUSI_API_KEY di server."
            : data?.detail || data?.message || "Layanan Pencarian Hadis sedang bermasalah.",
      });
    }
    res.setHeader(
      "Cache-Control",
      action === "daily"
        ? "public, s-maxage=900, stale-while-revalidate=3600"
        : "public, s-maxage=3600, stale-while-revalidate=86400"
    );
    res.setHeader("Vary", "Accept");
    return res.status(200).json(data);
  } catch {
    return res.status(502).json({
      status: "error",
      message: "Tidak dapat terhubung ke layanan Hadis. Silakan coba kembali.",
    });
  }
}
