const BASE_URL = "https://api.ahmadsanusi.com";
const TRANSLATE_CLIENTS5_URL = "https://clients5.google.com/translate_a/t";
const TRANSLATE_GTX_URL = "https://translate.googleapis.com/translate_a/single";
const TRANSLATE_MYMEMORY_URL = "https://api.mymemory.translated.net/get";
const ALLOWED_ACTIONS = new Set(["summary", "list", "search", "detail", "translate"]);
const ALLOWED_TRANSLATE_FIELDS = ["description", "source", "note"];
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

function splitIntoChunks(text, maxLen = 420) {
  if (text.length <= maxLen) return [text];
  const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];
  const chunks = [];
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

async function translateViaClients5(text) {
  const url = new URL(TRANSLATE_CLIENTS5_URL);
  url.searchParams.set("client", "dict-chrome-ex");
  url.searchParams.set("sl", "en");
  url.searchParams.set("tl", "id");
  url.searchParams.set("q", text);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(6500),
  });
  if (!response.ok) throw new Error(`clients5 HTTP ${response.status}`);
  const parsed = await response.json();
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
}

async function translateViaGtx(text) {
  const url = new URL(TRANSLATE_GTX_URL);
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "en");
  url.searchParams.set("tl", "id");
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", text);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(6500),
  });
  if (!response.ok) throw new Error(`gtx HTTP ${response.status}`);
  const parsed = await response.json();
  if (!Array.isArray(parsed) || !Array.isArray(parsed[0])) {
    throw new Error("gtx invalid payload");
  }
  const translated = parsed[0]
    .map((segment) => (Array.isArray(segment) && typeof segment[0] === "string" ? segment[0] : ""))
    .join("")
    .trim();
  if (!translated) throw new Error("gtx empty");
  return translated;
}

async function translateViaMyMemory(text) {
  const chunks = splitIntoChunks(text, 420);
  const translatedChunks = await Promise.all(
    chunks.map(async (chunk) => {
      const url = new URL(TRANSLATE_MYMEMORY_URL);
      url.searchParams.set("q", chunk);
      url.searchParams.set("langpair", "en|id");
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(7000),
      });
      if (!response.ok) throw new Error(`mymemory HTTP ${response.status}`);
      const parsed = await response.json();
      const translated = typeof parsed?.responseData?.translatedText === "string"
        ? parsed.responseData.translatedText.trim()
        : "";
      if (!translated || /QUERY LENGTH LIMIT EXCEEDED/i.test(translated)) {
        throw new Error("mymemory invalid");
      }
      return translated;
    })
  );
  return translatedChunks.join(" ").trim();
}

async function translateSnippetToId(text) {
  const providers = [translateViaClients5, translateViaMyMemory, translateViaGtx];
  let lastError = null;
  for (const provider of providers) {
    try {
      const result = await provider(text);
      if (result) return result;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("Gagal menerjemahkan teks.");
}

async function handleTranslateRequest(req, res, query) {
  let rawFields = {};
  if (req.method === "POST") {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ status: "error", message: "Body JSON terjemahan tidak valid." });
      }
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({ status: "error", message: "Payload terjemahan tidak valid." });
    }
    rawFields =
      body.fields && typeof body.fields === "object" && !Array.isArray(body.fields)
        ? body.fields
        : body;
  } else {
    rawFields = {
      description: typeof query.description === "string" ? query.description : typeof query.q === "string" ? query.q : "",
      source: typeof query.source === "string" ? query.source : "",
      note: typeof query.note === "string" ? query.note : "",
    };
  }

  const entries = [];
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
    const translatedPairs = await Promise.all(
      entries.map(async ([key, text]) => [key, await translateSnippetToId(text)])
    );
    const data = Object.fromEntries(translatedPairs);
    res.setHeader("Cache-Control", req.method === "GET" ? "public, s-maxage=86400, stale-while-revalidate=604800" : "no-store");
    return res.status(200).json({ status: "ok", data });
  } catch {
    return res.status(502).json({
      status: "error",
      message: "Layanan terjemahan sedang sibuk. Silakan coba beberapa saat lagi.",
    });
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Accept, Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const query = req.query || {};
  const action = String(query.action || "list").trim().toLowerCase();
  if (!ALLOWED_ACTIONS.has(action)) {
    return res.status(400).json({ status: "error", message: "Permintaan E-Code tidak valid." });
  }

  if (action === "translate") {
    if (req.method !== "GET" && req.method !== "POST") {
      res.setHeader("Allow", "GET, POST, OPTIONS");
      return res.status(405).json({ status: "error", message: "Method tidak diizinkan." });
    }
    return handleTranslateRequest(req, res, query);
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
