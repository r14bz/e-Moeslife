import { execSync } from "node:child_process";

const versionCode = Number.parseInt(process.env.VERSION_CODE || "1", 10) || 1;
const versionName = process.env.VERSION_NAME || `3.0.${versionCode}`;
const signMode = process.env.APK_SIGN_MODE === "release" ? "release" : "debug";
const signLabel = signMode === "release" ? "Release Signed" : "Debug Signed";
const currentSha = (process.env.GITHUB_SHA || safeExec("git rev-parse HEAD")).trim();

const targetTag = (process.env.TARGET_TAG || "v3.0-android").trim();

function extractApkDownloadCount(release) {
  const assets = Array.isArray(release?.assets) ? release.assets : [];
  const apkAsset = assets.find((a) =>
    String(a?.name || "")
      .toLowerCase()
      .endsWith(".apk")
  );
  return typeof apkAsset?.download_count === "number" && Number.isFinite(apkAsset.download_count)
    ? apkAsset.download_count
    : 0;
}

function extractPrevMetadata(body) {
  const match = String(body || "").match(/<!--\s*emoeslife-release:(\{[\s\S]*?\})\s*-->/);
  if (!match) return { commit: "", prevDownloads: 0, migratedTags: [] };
  try {
    const parsed = JSON.parse(match[1]);
    return {
      commit: typeof parsed.commit === "string" ? parsed.commit.trim() : "",
      prevDownloads:
        typeof parsed.prevDownloads === "number" && Number.isFinite(parsed.prevDownloads)
          ? parsed.prevDownloads
          : 0,
      migratedTags: Array.isArray(parsed.migratedTags)
        ? parsed.migratedTags.map((t) => String(t).trim()).filter(Boolean)
        : [],
    };
  } catch {
    return { commit: "", prevDownloads: 0, migratedTags: [] };
  }
}

function parsePrevState() {
  const rawList = process.env.RELEASES_JSON || "";
  if (rawList) {
    try {
      const releases = JSON.parse(rawList);
      if (Array.isArray(releases) && releases.length > 0) {
        const targetRelease = releases.find((r) => String(r?.tag_name || "") === targetTag) || null;
        const olderAndroidReleases = releases.filter((r) => {
          const tag = String(r?.tag_name || "");
          return tag && tag !== targetTag && /^v\d+(\.\d+)?-android$/i.test(tag);
        });

        const targetMeta = extractPrevMetadata(targetRelease?.body || "");
        const targetCurrent = targetRelease ? extractApkDownloadCount(targetRelease) : 0;
        let totalPrevDownloads = targetMeta.prevDownloads + targetCurrent;
        const migratedSet = new Set(targetMeta.migratedTags);

        for (const oldRel of olderAndroidReleases) {
          const oldTag = String(oldRel.tag_name || "");
          if (!oldTag || migratedSet.has(oldTag)) continue;
          const oldMeta = extractPrevMetadata(oldRel.body || "");
          const oldCurrent = extractApkDownloadCount(oldRel);
          totalPrevDownloads += oldMeta.prevDownloads + oldCurrent;
          migratedSet.add(oldTag);
        }

        const commitCandidate =
          targetMeta.commit ||
          olderAndroidReleases.map((r) => extractPrevMetadata(r.body || "").commit).find(Boolean) ||
          "";

        return {
          commit: commitCandidate,
          prevDownloads: totalPrevDownloads,
          migratedTags: Array.from(migratedSet),
        };
      }
    } catch {
      // Fallback to PREV_RELEASE_JSON / PREV_RELEASE_BODY
    }
  }

  const rawJson = process.env.PREV_RELEASE_JSON || "";
  if (rawJson) {
    try {
      const data = JSON.parse(rawJson);
      if (data && typeof data.body === "string") {
        const meta = extractPrevMetadata(data.body);
        const currentDownloads = extractApkDownloadCount(data);
        return {
          commit: meta.commit,
          prevDownloads: meta.prevDownloads + currentDownloads,
          migratedTags: meta.migratedTags,
        };
      }
    } catch {
      // Fallback to PREV_RELEASE_BODY
    }
  }

  const bodyMeta = extractPrevMetadata(process.env.PREV_RELEASE_BODY || "");
  return {
    commit: bodyMeta.commit,
    prevDownloads: bodyMeta.prevDownloads,
    migratedTags: bodyMeta.migratedTags,
  };
}

const prevState = parsePrevState();
const cumulativePrevDownloads = prevState.prevDownloads;
const migratedTags = prevState.migratedTags;

function safeExec(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

function hasCommit(sha) {
  if (!sha || !/^[0-9a-f]{7,40}$/i.test(sha)) return false;
  return Boolean(safeExec(`git cat-file -e "${sha}^{commit}" && echo ok`));
}

function collectCommitSubjects() {
  const prevSha = prevState.commit;
  let raw = "";
  if (prevSha && hasCommit(prevSha) && prevSha !== currentSha) {
    raw = safeExec(`git log --no-merges --pretty=format:%s ${prevSha}..HEAD`);
  }
  if (!raw) {
    raw = safeExec("git log --no-merges -n 6 --pretty=format:%s");
  }
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function cleanCommitSubject(subject) {
  const stripped = subject
    .replace(/^[a-z]+(\([^)]+\))?!?:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!stripped) return "";
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

function classifyCommit(subject) {
  const lower = subject.toLowerCase();
  if (
    /^(sec|security|keamanan)\b/.test(lower) ||
    /\b(security|keamanan|keystore|signed|signing|signature|permission|izin|auth|token|secret|https|privasi)\b/.test(
      lower
    )
  ) {
    return "keamanan";
  }
  if (
    /^(feat|feature|add|fitur)\b/.test(lower) ||
    /\b(tambah|menambahkan|fitur|notifikasi|jadwal|changelog|pencarian|kitab|quran|shalat|lokasi|offline)\b/.test(
      lower
    )
  ) {
    return "fitur";
  }
  return "perbaikan";
}

const subjects = collectCommitSubjects();
const buckets = {
  fitur: [],
  keamanan: [],
  perbaikan: [],
};

for (const subject of subjects) {
  const category = classifyCommit(subject);
  const text = cleanCommitSubject(subject);
  if (!text) continue;
  if (!buckets[category].includes(text)) {
    buckets[category].push(text);
  }
}

if (signMode === "release") {
  buckets.keamanan.unshift(
    "Rilis ditandatangani dengan Release Keystore resmi (pembaruan langsung tanpa hapus data)."
  );
} else {
  buckets.keamanan.push("Build menggunakan konfigurasi debug signature.");
}

if (buckets.fitur.length === 0 && buckets.perbaikan.length === 0) {
  buckets.perbaikan.push("Peningkatan stabilitas aplikasi dan pembaruan aset lokal terbaru.");
}

const lines = [
  `Ringkasan pembaruan aplikasi Android **e-Moeslife v${versionName}**.`,
  "",
];

if (buckets.fitur.length > 0) {
  lines.push("### Fitur Baru");
  for (const item of buckets.fitur) lines.push(`- ${item}`);
  lines.push("");
}

if (buckets.keamanan.length > 0) {
  lines.push("### Keamanan");
  for (const item of buckets.keamanan) lines.push(`- ${item}`);
  lines.push("");
}

if (buckets.perbaikan.length > 0) {
  lines.push("### Perbaikan & Peningkatan");
  for (const item of buckets.perbaikan) lines.push(`- ${item}`);
  lines.push("");
}

lines.push(
  "### Informasi Rilis",
  `- Versi: v${versionName} (Build ${versionCode})`,
  `- Tipe Signature: ${signLabel}`,
  "- Package ID: com.emoeslife.app",
  "",
  `<!-- emoeslife-release:${JSON.stringify({
    versionCode,
    versionName,
    signed: signMode,
    commit: currentSha,
    prevDownloads: cumulativePrevDownloads,
    migratedTags,
  })} -->`
);

process.stdout.write(`${lines.join("\n")}\n`);
