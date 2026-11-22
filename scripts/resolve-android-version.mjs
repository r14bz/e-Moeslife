import fs from "node:fs";
import path from "node:path";

const pkgPath = path.join(process.cwd(), "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const rawPkgVersion = String(pkg?.version || "3.0.0").trim();
const pkgMatch = rawPkgVersion.match(/^(\d+)\.(\d+)(?:\.(\d+))?/);

const major = pkgMatch ? Number.parseInt(pkgMatch[1], 10) : 3;
const minor = pkgMatch ? Number.parseInt(pkgMatch[2], 10) : 0;
const basePatch = pkgMatch && pkgMatch[3] !== undefined ? Number.parseInt(pkgMatch[3], 10) : 0;

const runNumber =
  Number.parseInt(process.env.GITHUB_RUN_NUMBER || process.env.APK_VERSION_CODE || "1", 10) || 1;
const targetTag = `v${major}.${minor}-android`;
const linePrefix = `${major}.${minor}.`;

function extractReleaseVersion(release) {
  const body = String(release?.body || "");
  const name = String(release?.name || "");
  let versionName = "";
  let versionCode = 0;

  const markerMatch = body.match(/<!--\s*emoeslife-release:(\{[\s\S]*?\})\s*-->/);
  if (markerMatch) {
    try {
      const parsed = JSON.parse(markerMatch[1]);
      if (typeof parsed.versionName === "string") {
        versionName = parsed.versionName.trim();
      }
      if (typeof parsed.versionCode === "number" && Number.isFinite(parsed.versionCode)) {
        versionCode = parsed.versionCode;
      }
    } catch {
      // Ignore malformed marker
    }
  }

  if (!versionName && name) {
    const titleMatch = name.match(/v(\d+\.\d+\.\d+)/i);
    if (titleMatch) versionName = titleMatch[1];
  }

  return { versionName, versionCode };
}

let releases = [];
try {
  const parsed = JSON.parse(process.env.RELEASES_JSON || "[]");
  if (Array.isArray(parsed)) releases = parsed;
} catch {
  releases = [];
}

let highestMatching = null;

for (const rel of releases) {
  if (!rel || rel.draft) continue;
  const { versionName, versionCode } = extractReleaseVersion(rel);
  if (!versionName.startsWith(linePrefix)) continue;

  const patchStr = versionName.slice(linePrefix.length);
  const patchMatch = patchStr.match(/^(\d+)/);
  if (!patchMatch) continue;
  const rawPatch = Number.parseInt(patchMatch[1], 10);
  if (!Number.isFinite(rawPatch)) continue;

  // Treat legacy "<major>.<minor>.<run_number>" builds (e.g. 3.0.33) as 0 baseline
  // so subsequent builds continue cleanly as .1, .2, .3...
  const effectivePatch = versionCode > 1 && rawPatch === versionCode ? 0 : rawPatch;

  if (
    !highestMatching ||
    effectivePatch > highestMatching.patch ||
    (effectivePatch === highestMatching.patch && versionCode > highestMatching.versionCode)
  ) {
    highestMatching = { patch: effectivePatch, versionCode };
  }
}

let nextPatch = basePatch;
if (highestMatching) {
  if (highestMatching.versionCode === runNumber) {
    nextPatch = Math.max(basePatch, highestMatching.patch);
  } else {
    nextPatch = Math.max(basePatch, highestMatching.patch + 1);
  }
}

const resolvedVersionName = `${major}.${minor}.${nextPatch}`;

const olderTags = releases
  .filter((r) => {
    const tag = String(r?.tag_name || "");
    return tag && tag !== targetTag && /^v\d+(\.\d+)?-android$/i.test(tag);
  })
  .map((r) => String(r.tag_name));

const outputs = {
  version_code: String(runNumber),
  version_name: resolvedVersionName,
  target_tag: targetTag,
  older_tags: olderTags.join(","),
};

if (process.env.GITHUB_OUTPUT) {
  const lines = Object.entries(outputs).map(([k, v]) => `${k}=${v}`);
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `${lines.join("\n")}\n`);
}

console.log(JSON.stringify(outputs));
