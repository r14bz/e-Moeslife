import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const appGradlePath = path.join(rootDir, "android", "app", "build.gradle");

if (!fs.existsSync(appGradlePath)) {
  throw new Error(`android/app/build.gradle not found at ${appGradlePath}`);
}

const versionCode = Number.parseInt(process.env.APK_VERSION_CODE || "1", 10);
if (!Number.isSafeInteger(versionCode) || versionCode < 1) {
  throw new Error(`Invalid APK_VERSION_CODE: ${process.env.APK_VERSION_CODE}`);
}
const versionName = (process.env.APK_VERSION_NAME || `2.0.${versionCode}`).trim();

let gradle = fs.readFileSync(appGradlePath, "utf8");

gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
gradle = gradle.replace(/versionName\s+"[^"]+"/, `versionName "${versionName}"`);

const keystoreRelPath = process.env.ANDROID_KEYSTORE_PATH;
const keystoreAbsPath = keystoreRelPath
  ? path.join(rootDir, "android", "app", keystoreRelPath)
  : "";

if (keystoreRelPath && fs.existsSync(keystoreAbsPath)) {
  const signingBlock = `    signingConfigs {
        release {
            storeFile file(System.getenv("ANDROID_KEYSTORE_PATH") ?: "${keystoreRelPath}")
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD") ?: ""
            keyAlias System.getenv("ANDROID_KEY_ALIAS") ?: ""
            keyPassword System.getenv("ANDROID_KEY_PASSWORD") ?: System.getenv("ANDROID_KEYSTORE_PASSWORD") ?: ""
        }
    }
    buildTypes {`;

  if (!gradle.includes("signingConfigs")) {
    gradle = gradle.replace(/\s+buildTypes\s*\{/, `\n${signingBlock}`);
  }
  if (!gradle.includes("signingConfig signingConfigs.release")) {
    gradle = gradle.replace(
      /(buildTypes\s*\{\s*release\s*\{)/,
      `$1\n            signingConfig signingConfigs.release`
    );
  }
  console.log(
    `Configured Android release signing + versionCode=${versionCode}, versionName=${versionName}`
  );
} else {
  console.log(
    `Configured Android debug versioning: versionCode=${versionCode}, versionName=${versionName}`
  );
}

fs.writeFileSync(appGradlePath, gradle, "utf8");
