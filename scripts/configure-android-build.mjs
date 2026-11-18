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

const manifestPath = path.join(
  rootDir,
  "android",
  "app",
  "src",
  "main",
  "AndroidManifest.xml"
);

if (fs.existsSync(manifestPath)) {
  let manifest = fs.readFileSync(manifestPath, "utf8");
  const requiredEntries = [
    '<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />',
    '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />',
    '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />',
    '<uses-permission android:name="android.permission.USE_EXACT_ALARM" />',
    '<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />',
    '<uses-feature android:name="android.hardware.location.gps" android:required="false" />',
  ];

  const missing = requiredEntries.filter((entry) => {
    const match = entry.match(/android:name="([^"]+)"/);
    return match ? !manifest.includes(match[1]) : false;
  });

  if (missing.length > 0) {
    manifest = manifest.replace(
      "</manifest>",
      `    ${missing.join("\n    ")}\n</manifest>`
    );
    fs.writeFileSync(manifestPath, manifest, "utf8");
    console.log(`Added ${missing.length} AndroidManifest permissions/features.`);
  }
}

const javaAppDir = path.join(
  rootDir,
  "android",
  "app",
  "src",
  "main",
  "java",
  "com",
  "emoeslife",
  "app"
);

if (fs.existsSync(javaAppDir)) {
  const pluginJava = `package com.emoeslife.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.activity.result.ActivityResult;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "ApkInstaller")
public class ApkInstallerPlugin extends Plugin {

    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private volatile boolean isDownloading = false;

    private File getTargetApkFile() {
        File dir = new File(getContext().getCacheDir(), "updates");
        if (!dir.exists()) {
            dir.mkdirs();
        }
        return new File(dir, "e-moeslife-update.apk");
    }

    private boolean canInstallPackages() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            return getContext().getPackageManager().canRequestPackageInstalls();
        }
        return true;
    }

    private void emitProgress(String stage, long downloadedBytes, long totalBytes, int percent) {
        JSObject data = new JSObject();
        data.put("stage", stage);
        data.put("downloadedBytes", downloadedBytes);
        data.put("totalBytes", totalBytes);
        data.put("percent", percent);
        notifyListeners("downloadProgress", data);
    }

    private void launchInstaller(File apkFile, PluginCall call) {
        try {
            Uri apkUri = FileProvider.getUriForFile(
                getContext(),
                getContext().getPackageName() + ".fileprovider",
                apkFile
            );
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getActivity().runOnUiThread(() -> {
                try {
                    getActivity().startActivity(intent);
                    JSObject ret = new JSObject();
                    ret.put("status", "installing");
                    call.resolve(ret);
                } catch (Exception ex) {
                    call.reject("Gagal membuka pemasang APK: " + ex.getMessage(), ex);
                }
            });
        } catch (Exception ex) {
            call.reject("Gagal menyiapkan berkas APK: " + ex.getMessage(), ex);
        }
    }

    private void proceedToInstallOrRequestPermission(File apkFile, PluginCall call) {
        if (canInstallPackages()) {
            launchInstaller(apkFile, call);
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            emitProgress("permission", apkFile.length(), apkFile.length(), 100);
            Intent settingsIntent = new Intent(
                Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                Uri.parse("package:" + getContext().getPackageName())
            );
            getActivity().runOnUiThread(() -> {
                try {
                    startActivityForResult(call, settingsIntent, "onInstallSettingsReturned");
                } catch (Exception ex) {
                    call.reject("Gagal membuka pengaturan izin pasang aplikasi: " + ex.getMessage(), ex);
                }
            });
        } else {
            launchInstaller(apkFile, call);
        }
    }

    @ActivityCallback
    public void onInstallSettingsReturned(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }
        File apkFile = getTargetApkFile();
        if (!apkFile.exists()) {
            call.reject("Berkas pembaruan APK tidak ditemukan.");
            return;
        }
        if (canInstallPackages()) {
            launchInstaller(apkFile, call);
        } else {
            JSObject ret = new JSObject();
            ret.put("status", "permission_denied");
            ret.put("fileReady", true);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void canRequestPackageInstalls(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("granted", canInstallPackages());
        call.resolve(ret);
    }

    @PluginMethod
    public void installCachedApk(PluginCall call) {
        File apkFile = getTargetApkFile();
        if (!apkFile.exists() || apkFile.length() < 1000000L) {
            call.reject("Berkas APK belum siap. Silakan unduh ulang.");
            return;
        }
        proceedToInstallOrRequestPermission(apkFile, call);
    }

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String rawUrl = call.getString("url");
        if (rawUrl == null || !rawUrl.startsWith("https://")) {
            call.reject("URL pembaruan tidak valid.");
            return;
        }
        if (isDownloading) {
            call.reject("Pengunduhan pembaruan sedang berlangsung.");
            return;
        }

        isDownloading = true;
        File targetFile = getTargetApkFile();
        File partFile = new File(targetFile.getParentFile(), "e-moeslife-update.apk.part");

        executor.execute(() -> {
            HttpURLConnection conn = null;
            try {
                emitProgress("connecting", 0L, 0L, 0);
                String currentUrl = rawUrl;
                for (int hop = 0; hop < 8; hop++) {
                    URL url = new URL(currentUrl);
                    conn = (HttpURLConnection) url.openConnection();
                    conn.setInstanceFollowRedirects(false);
                    conn.setConnectTimeout(20000);
                    conn.setReadTimeout(30000);
                    conn.setRequestProperty("User-Agent", "e-Moeslife-Android-Updater");
                    int code = conn.getResponseCode();
                    if (
                        code == HttpURLConnection.HTTP_MOVED_PERM ||
                        code == HttpURLConnection.HTTP_MOVED_TEMP ||
                        code == HttpURLConnection.HTTP_SEE_OTHER ||
                        code == 307 ||
                        code == 308
                    ) {
                        String location = conn.getHeaderField("Location");
                        conn.disconnect();
                        if (location == null || location.isEmpty()) {
                            throw new IllegalStateException("Tautan unduhan tidak mengarah ke berkas.");
                        }
                        currentUrl = new URL(url, location).toString();
                        continue;
                    }
                    if (code < 200 || code >= 300) {
                        throw new IllegalStateException("Server mengembalikan kode HTTP " + code);
                    }
                    break;
                }

                if (conn == null) {
                    throw new IllegalStateException("Tidak dapat terhubung ke server unduhan.");
                }

                long totalBytes = conn.getContentLengthLong();
                long downloadedBytes = 0L;
                int lastPercent = -1;
                long lastEmitMs = 0L;
                boolean checkedHeader = false;

                if (partFile.exists()) {
                    partFile.delete();
                }

                try (
                    InputStream in = new BufferedInputStream(conn.getInputStream());
                    FileOutputStream out = new FileOutputStream(partFile)
                ) {
                    byte[] buffer = new byte[16384];
                    int read;
                    while ((read = in.read(buffer)) != -1) {
                        if (!checkedHeader && read >= 2) {
                            checkedHeader = true;
                            if (buffer[0] != 0x50 || buffer[1] != 0x4B) {
                                throw new IllegalStateException("Berkas yang diunduh bukan paket APK yang valid.");
                            }
                        }
                        out.write(buffer, 0, read);
                        downloadedBytes += read;

                        int percent = totalBytes > 0
                            ? (int) Math.min(99L, (downloadedBytes * 100L) / totalBytes)
                            : 0;
                        long now = System.currentTimeMillis();
                        if (percent != lastPercent || now - lastEmitMs >= 150L) {
                            lastPercent = percent;
                            lastEmitMs = now;
                            emitProgress("downloading", downloadedBytes, totalBytes, percent);
                        }
                    }
                    out.flush();
                }

                if (downloadedBytes < 1000000L) {
                    throw new IllegalStateException("Ukuran berkas APK terlalu kecil atau tidak lengkap.");
                }

                if (targetFile.exists()) {
                    targetFile.delete();
                }
                if (!partFile.renameTo(targetFile)) {
                    throw new IllegalStateException("Gagal menyimpan berkas APK di cache.");
                }

                emitProgress("ready", downloadedBytes, downloadedBytes, 100);
                proceedToInstallOrRequestPermission(targetFile, call);
            } catch (Exception ex) {
                if (partFile.exists()) {
                    partFile.delete();
                }
                call.reject("Gagal mengunduh pembaruan: " + ex.getMessage(), ex);
            } finally {
                if (conn != null) {
                    conn.disconnect();
                }
                isDownloading = false;
            }
        });
    }

    @Override
    protected void handleOnDestroy() {
        executor.shutdownNow();
        super.handleOnDestroy();
    }
}
`;

  fs.writeFileSync(path.join(javaAppDir, "ApkInstallerPlugin.java"), pluginJava, "utf8");

  const mainActivityJava = `package com.emoeslife.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ApkInstallerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
`;
  fs.writeFileSync(path.join(javaAppDir, "MainActivity.java"), mainActivityJava, "utf8");
  console.log("Generated ApkInstallerPlugin.java and registered plugin in MainActivity.java.");
}

