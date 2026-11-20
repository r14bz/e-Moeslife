const BASE_URL = "https://api.ahmadsanusi.com";
const ALLOWED_ACTIONS = new Set(["summary", "list", "search", "detail"]);
const ALLOWED_STATUS_MAP = new Map([
  ["halal", "Halal"],
  ["haram", "Haram"],
  ["doubtful", "Doubtful"],
]);

function parsePositiveInt(raw, fallback, max) {
  const num = Number(raw ?? fallback);
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
        "Layanan Cek Halal E-Code belum aktif karena AHMADSANUSI_API_KEY belum dikonfigurasi di server.",
    });
  }

  const query = req.query || {};
  const action = String(query.action || "list").trim().toLowerCase();
  if (!ALLOWED_ACTIONS.has(action)) {
    return res.status(400).json({ status: "error", message: "Permintaan E-Code tidak valid." });
  }

  const upstream = new URL(`${BASE_URL}/v1/ecode`);

  if (action === "summary") {
    upstream.pathname = "/v1/ecode/summary";
  } else if (action === "list") {
    const page = parsePositiveInt(query.page, 1, 1000);
    const limit = parsePositiveInt(query.limit, 20, 100);
    if (page === null || limit === null) {
      return res.status(400).json({ status: "error", message: "Parameter halaman E-Code tidak valid." });
    }
    upstream.searchParams.set("page", String(page));
    upstream.searchParams.set("limit", String(limit));

    if (typeof query.status === "string" && query.status.trim()) {
      const normalizedStatus = ALLOWED_STATUS_MAP.get(query.status.trim().toLowerCase());
      if (!normalizedStatus) {
        return res.status(400).json({ status: "error", message: "Filter status halal tidak valid." });
      }
      upstream.searchParams.set("status", normalizedStatus);
    }

    if (typeof query.type === "string" && query.type.trim()) {
      const cleanType = query.type.trim();
      if (!/^[\p{L}\p{N}\s,&/()-]{1,80}$/u.test(cleanType)) {
        return res.status(400).json({ status: "error", message: "Filter kategori bahan tidak valid." });
      }
      upstream.searchParams.set("type", cleanType);
    }
  } else if (action === "search") {
    const keyword = typeof query.q === "string" ? query.q.trim() : "";
    if (keyword.length < 1 || keyword.length > 100) {
      return res.status(400).json({
        status: "error",
        message: "Kata pencarian E-Code minimal 1 dan maksimal 100 karakter.",
      });
    }
    const page = parsePositiveInt(query.page, 1, 1000);
    const limit = parsePositiveInt(query.limit, 20, 100);
    if (page === null || limit === null) {
      return res.status(400).json({ status: "error", message: "Parameter halaman E-Code tidak valid." });
    }
    upstream.pathname = "/v1/ecode/search";
    upstream.searchParams.set("q", keyword);
    upstream.searchParams.set("page", String(page));
    upstream.searchParams.set("limit", String(limit));
  } else if (action === "detail") {
    const code = typeof query.code === "string" ? query.code.trim() : "";
    if (!/^[a-z0-9][a-z0-9._-]{0,30}$/i.test(code)) {
      return res.status(400).json({ status: "error", message: "Format kode E-Code tidak valid." });
    }
    upstream.pathname = `/v1/ecode/${encodeURIComponent(code)}`;
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
      data = { status: "error", message: "Respons layanan E-Code bukan JSON yang valid." };
    }
    if (!response.ok) {
      const status = response.status === 401 || response.status === 403 ? 502 : response.status;
      return res.status(status).json({
        status: "error",
        message:
          response.status === 401 || response.status === 403
            ? "Autentikasi API Ahmad Sanusi ditolak. Periksa AHMADSANUSI_API_KEY di server."
            : data?.detail || data?.message || "Layanan E-Code Halal sedang bermasalah.",
      });
    }
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.setHeader("Vary", "Accept");
    return res.status(200).json(data);
  } catch {
    return res.status(502).json({
      status: "error",
      message: "Tidak dapat terhubung ke layanan E-Code Halal. Silakan coba kembali.",
    });
  }
}
