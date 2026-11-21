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
const versionName = (process.env.APK_VERSION_NAME || `3.0.${versionCode}`).trim();

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

const rootGradlePath = path.join(rootDir, "android", "build.gradle");
if (fs.existsSync(rootGradlePath)) {
  let rootGradle = fs.readFileSync(rootGradlePath, "utf8");
  const mirrorUrl = "https://maven-central.storage-download.googleapis.com/maven2";
  if (!rootGradle.includes(mirrorUrl)) {
    rootGradle = rootGradle.replace(
      /mavenCentral\(\)/g,
      `mavenCentral()\n        maven { url "${mirrorUrl}" }`
    );
    fs.writeFileSync(rootGradlePath, rootGradle, "utf8");
    console.log("Added Maven Central mirror fallback to android/build.gradle.");
  }
}

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
  let manifestChanged = false;
  const requiredEntries = [
    '<uses-permission android:name="android.permission.INTERNET" />',
    '<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />',
    '<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />',
    '<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />',
    '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />',
    '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />',
    '<uses-permission android:name="android.permission.USE_EXACT_ALARM" />',
    '<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />',
    '<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />',
    '<uses-permission android:name="android.permission.HIGH_SAMPLING_RATE_SENSORS" />',
    '<uses-feature android:name="android.hardware.location.gps" android:required="false" />',
    '<uses-feature android:name="android.hardware.sensor.compass" android:required="false" />',
    '<uses-feature android:name="android.hardware.sensor.accelerometer" android:required="false" />',
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
    manifestChanged = true;
    console.log(`Added ${missing.length} AndroidManifest permissions/features.`);
  }

  const appComponents = [];
  if (!manifest.includes("ApkUpdateJobService")) {
    appComponents.push(
      `        <service\n            android:name=".ApkUpdateJobService"\n            android:permission="android.permission.BIND_JOB_SERVICE"\n            android:exported="false" />`
    );
  }
  if (!manifest.includes("ApkUpdateReceiver")) {
    appComponents.push(
      `        <receiver\n            android:name=".ApkUpdateReceiver"\n            android:enabled="true"\n            android:exported="false">\n            <intent-filter>\n                <action android:name="android.intent.action.BOOT_COMPLETED" />\n                <action android:name="android.intent.action.LOCKED_BOOT_COMPLETED" />\n                <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />\n                <action android:name="com.emoeslife.app.ACTION_CHECK_APK_UPDATE" />\n            </intent-filter>\n        </receiver>`
    );
  }
  if (appComponents.length > 0 && manifest.includes("</application>")) {
    manifest = manifest.replace(
      "</application>",
      `${appComponents.join("\n")}\n    </application>`
    );
    manifestChanged = true;
    console.log("Registered ApkUpdateJobService and ApkUpdateReceiver in AndroidManifest.xml.");
  }

  if (manifestChanged) {
    fs.writeFileSync(manifestPath, manifest, "utf8");
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
  const updateCheckerJava = `package com.emoeslife.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.json.JSONObject;

public final class ApkUpdateChecker {

    private static final String PREFS_NAME = "emoeslife_apk_updater";
    private static final String KEY_NOTIFIED_VERSION = "notified_version_code";
    private static final String KEY_LAST_CHECK_MS = "last_check_ms";
    private static final String KEY_PENDING_OPEN = "pending_open_apk_update";
    private static final String LEGACY_CHANNEL_ID = "pembaruan-aplikasi";
    private static final String CHANNEL_ID = "pembaruan-aplikasi-v2";
    private static final int NOTIFICATION_ID = 519901;
    private static final long MIN_CHECK_COOLDOWN_MS = 10L * 60L * 1000L;
    private static final int NOTIFICATION_ACCENT_COLOR = Color.parseColor("#009950");

    private static final String[] CATEGORY_ORDER = new String[] {
        "fitur",
        "keamanan",
        "perbaikan",
        "lainnya"
    };

    private static final String[] ENDPOINTS = new String[] {
        "https://api.github.com/repos/r14bz/e-Moeslife/releases/latest",
        "https://api.github.com/repos/r14bz/e-Moeslife/releases/tags/v3.0-android",
        "https://api.github.com/repos/r14bz/e-Moeslife/releases/tags/v2.0-android"
    };

    private ApkUpdateChecker() {}

    public static void markVersionNotified(Context context, long versionCode) {
        if (context == null || versionCode <= 0L) return;
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        long current = prefs.getLong(KEY_NOTIFIED_VERSION, 0L);
        if (versionCode > current) {
            prefs.edit().putLong(KEY_NOTIFIED_VERSION, versionCode).apply();
        }
    }

    public static void setPendingOpenUpdate(Context context, boolean pending) {
        if (context == null) return;
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putBoolean(KEY_PENDING_OPEN, pending)
            .apply();
    }

    public static boolean consumePendingOpenUpdate(Context context) {
        if (context == null) return false;
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        boolean pending = prefs.getBoolean(KEY_PENDING_OPEN, false);
        if (pending) {
            prefs.edit().putBoolean(KEY_PENDING_OPEN, false).apply();
        }
        return pending;
    }

    private static boolean isNetworkConnected(Context context) {
        try {
            ConnectivityManager cm = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm == null) return true;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Network network = cm.getActiveNetwork();
                if (network == null) return false;
                NetworkCapabilities caps = cm.getNetworkCapabilities(network);
                return caps != null && caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
            }
            return true;
        } catch (Exception ignored) {
            return true;
        }
    }

    @SuppressWarnings("deprecation")
    private static long getInstalledVersionCode(Context context) {
        try {
            PackageInfo pInfo = context.getPackageManager().getPackageInfo(context.getPackageName(), 0);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                return pInfo.getLongVersionCode();
            }
            return pInfo.versionCode;
        } catch (Exception ignored) {
            return 0L;
        }
    }

    private static boolean canPostNotifications(Context context) {
        if (Build.VERSION.SDK_INT >= 33) {
            if (ContextCompat.checkSelfPermission(context, "android.permission.POST_NOTIFICATIONS")
                != PackageManager.PERMISSION_GRANTED) {
                return false;
            }
        }
        return NotificationManagerCompat.from(context).areNotificationsEnabled();
    }

    private static String fetchJsonString(String endpoint) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(endpoint);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(15000);
            conn.setReadTimeout(20000);
            conn.setRequestProperty("Accept", "application/vnd.github+json");
            conn.setRequestProperty("User-Agent", "e-Moeslife-Android-Updater");
            int code = conn.getResponseCode();
            if (code < 200 || code >= 300) {
                return null;
            }
            StringBuilder sb = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8)
            )) {
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line).append('\\n');
                }
            }
            return sb.toString();
        } catch (Exception ignored) {
            return null;
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }
    }

    private static String getCategoryLabel(String category) {
        if ("fitur".equals(category)) return "Fitur Baru";
        if ("keamanan".equals(category)) return "Keamanan";
        if ("perbaikan".equals(category)) return "Perbaikan & Peningkatan";
        return "Pembaruan Lainnya";
    }

    private static String mapHeadingToCategory(String heading) {
        String normalized = heading.trim().toLowerCase(Locale.ROOT);
        if (normalized.matches(".*(informasi\\\\s+rilis|release\\\\s+info|metadata).*")) return "ignore";
        if (normalized.matches(".*(keamanan|security|proteksi|izin|permission).*")) return "keamanan";
        if (normalized.matches(".*(fitur|feature|penambahan|baru).*")) return "fitur";
        if (normalized.matches(".*(perbaikan|peningkatan|fix|bug|stabil|performa|optimasi).*")) return "perbaikan";
        if (normalized.matches(".*(lainnya|other|catatan|perubahan|changelog).*")) return "lainnya";
        return null;
    }

    private static String classifyBulletText(String text) {
        String lower = text.toLowerCase(Locale.ROOT);
        if (Pattern.compile("\\\\b(keamanan|security|keystore|signature|signed|signing|permission|izin|auth|token|enkripsi|privasi)\\\\b").matcher(lower).find()) {
            return "keamanan";
        }
        if (Pattern.compile("\\\\b(fitur|feature|tambah|menambahkan|notifikasi|jadwal|changelog|pencarian|audio|tema|mode|doa|kitab)\\\\b").matcher(lower).find()) {
            return "fitur";
        }
        if (Pattern.compile("\\\\b(perbaik|fix|bug|optimal|stabil|offline|rapi|sinkron|kecepatan|kinerja)\\\\b").matcher(lower).find()) {
            return "perbaikan";
        }
        return "lainnya";
    }

    private static boolean isBoilerplateLine(String line) {
        String clean = line.trim().toLowerCase(Locale.ROOT);
        if (clean.isEmpty()) return true;
        if (clean.startsWith("build otomatis aplikasi android e-moeslife")) return true;
        if (clean.startsWith("ringkasan pembaruan aplikasi android")) return true;
        return clean.matches("^(versi|tipe signature|package id)\\\\s*:.*");
    }

    private static final class ParsedChangelog {
        final List<String> highlights = new ArrayList<>();
        final List<String> taggedLines = new ArrayList<>();
    }

    private static ParsedChangelog parseChangelog(String body, String signed) {
        ParsedChangelog result = new ParsedChangelog();
        Map<String, List<String>> buckets = new LinkedHashMap<>();
        for (String cat : CATEGORY_ORDER) {
            buckets.put(cat, new ArrayList<String>());
        }

        String cleaned = body == null
            ? ""
            : body.replaceAll("(?s)<!--\\\\s*emoeslife-release:.*?-->", "").trim();
        boolean hasHeadings = cleaned.contains("###");
        String currentSection = null;
        Pattern headingPattern = Pattern.compile("^#{1,4}\\\\s+(.+)$");
        Pattern bulletPattern = Pattern.compile("^[-*•]\\\\s+(.+)$");

        for (String raw : cleaned.split("\\\\r?\\\\n")) {
            String line = raw.trim();
            if (line.isEmpty()) continue;

            Matcher headingMatcher = headingPattern.matcher(line);
            if (headingMatcher.matches()) {
                currentSection = mapHeadingToCategory(headingMatcher.group(1));
                continue;
            }

            if ("ignore".equals(currentSection)) continue;

            Matcher bulletMatcher = bulletPattern.matcher(line);
            String rawContent = bulletMatcher.matches() ? bulletMatcher.group(1) : line;
            String content = rawContent.replaceAll("\\\\*\\\\*(.+?)\\\\*\\\\*", "$1").trim();

            if (content.isEmpty() || isBoilerplateLine(content)) continue;
            if (!bulletMatcher.matches() && currentSection == null && hasHeadings) continue;

            String targetCategory = currentSection != null ? currentSection : classifyBulletText(content);
            List<String> list = buckets.get(targetCategory);
            if (list != null && !list.contains(content)) {
                list.add(content);
            }
        }

        List<String> securityList = buckets.get("keamanan");
        if ("release".equalsIgnoreCase(signed) && securityList != null && securityList.isEmpty()) {
            securityList.add("Rilis ditandatangani dengan Release Keystore resmi agar pembaruan menjaga data tersimpan.");
        }

        for (String cat : CATEGORY_ORDER) {
            List<String> items = buckets.get(cat);
            if (items == null || items.isEmpty()) continue;
            String label = getCategoryLabel(cat);
            int perCategoryCount = 0;
            for (String item : items) {
                if (result.highlights.size() < 2) {
                    result.highlights.add(item);
                }
                if (perCategoryCount < 2 && result.taggedLines.size() < 5) {
                    result.taggedLines.add("• [" + label + "] " + item);
                    perCategoryCount++;
                }
            }
        }

        return result;
    }

    public static void checkAndNotify(Context context, boolean bypassCooldown) {
        if (context == null || !isNetworkConnected(context)) return;

        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        long now = System.currentTimeMillis();
        long lastCheck = prefs.getLong(KEY_LAST_CHECK_MS, 0L);
        if (!bypassCooldown && (now - lastCheck) < MIN_CHECK_COOLDOWN_MS) {
            return;
        }
        prefs.edit().putLong(KEY_LAST_CHECK_MS, now).apply();

        long installedCode = getInstalledVersionCode(context);
        if (installedCode <= 0L) return;

        for (String endpoint : ENDPOINTS) {
            String rawJson = fetchJsonString(endpoint);
            if (rawJson == null || rawJson.isEmpty()) continue;

            try {
                JSONObject json = new JSONObject(rawJson);
                String body = json.optString("body", "");
                String releaseName = json.optString("name", "");

                long remoteCode = 0L;
                String versionName = "";
                String signed = "";

                Matcher markerMatcher = Pattern
                    .compile("<!--\\\\s*emoeslife-release:(\\\\{.*?\\\\})\\\\s*-->", Pattern.DOTALL)
                    .matcher(body);
                if (markerMatcher.find()) {
                    JSONObject marker = new JSONObject(markerMatcher.group(1));
                    remoteCode = marker.optLong("versionCode", 0L);
                    versionName = marker.optString("versionName", "");
                    signed = marker.optString("signed", "");
                }

                if (remoteCode <= 0L && !body.isEmpty()) {
                    Matcher buildMatcher = Pattern.compile("\\\\(Build\\\\s+(\\\\d+)\\\\)", Pattern.CASE_INSENSITIVE).matcher(body);
                    if (buildMatcher.find()) {
                        remoteCode = Long.parseLong(buildMatcher.group(1));
                    }
                }

                if (versionName.isEmpty() && !releaseName.isEmpty()) {
                    Matcher verMatcher = Pattern.compile("v(\\\\d+\\\\.\\\\d+\\\\.\\\\d+)", Pattern.CASE_INSENSITIVE).matcher(releaseName);
                    if (verMatcher.find()) {
                        versionName = verMatcher.group(1);
                    }
                }

                if (remoteCode <= 0L && !releaseName.isEmpty()) {
                    Matcher titleMatcher = Pattern.compile("v(\\\\d+\\\\.\\\\d+\\\\.(\\\\d+))", Pattern.CASE_INSENSITIVE).matcher(releaseName);
                    if (titleMatcher.find()) {
                        if (versionName.isEmpty()) versionName = titleMatcher.group(1);
                        remoteCode = Long.parseLong(titleMatcher.group(2));
                    }
                }

                if (remoteCode <= 0L) continue;
                if (versionName.isEmpty()) {
                    versionName = "3.0." + remoteCode;
                }

                long lastNotified = prefs.getLong(KEY_NOTIFIED_VERSION, 0L);
                if (remoteCode <= installedCode || remoteCode <= lastNotified) {
                    return;
                }

                if (!canPostNotifications(context)) {
                    return;
                }

                ParsedChangelog changelog = parseChangelog(body, signed);
                showUpdateNotification(context, remoteCode, versionName, changelog);
                prefs.edit().putLong(KEY_NOTIFIED_VERSION, remoteCode).apply();
                return;
            } catch (Exception ignored) {
                // Try next endpoint
            }
        }
    }

    private static Uri resolveUpdateSoundUri(Context context) {
        int rawId = context.getResources().getIdentifier("notif_update", "raw", context.getPackageName());
        if (rawId != 0) {
            return Uri.parse("android.resource://" + context.getPackageName() + "/" + rawId);
        }
        return RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
    }

    private static void showUpdateNotification(
        Context context,
        long versionCode,
        String versionName,
        ParsedChangelog changelog
    ) {
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        Uri soundUri = resolveUpdateSoundUri(context);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                nm.deleteNotificationChannel(LEGACY_CHANNEL_ID);
            } catch (Exception ignored) {
                // Ignore if legacy channel absent
            }
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Pembaruan Aplikasi",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Pemberitahuan otomatis bersuara saat versi terbaru e-Moeslife tersedia");
            channel.enableVibration(true);
            AudioAttributes audioAttrs = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();
            channel.setSound(soundUri, audioAttrs);
            nm.createNotificationChannel(channel);
        }

        String summary;
        if (!changelog.highlights.isEmpty()) {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < changelog.highlights.size(); i++) {
                if (i > 0) sb.append(" • ");
                sb.append(changelog.highlights.get(i));
            }
            sb.append(" — Ketuk untuk melihat detail & memperbarui.");
            summary = sb.toString();
        } else {
            summary = "Versi terbaru v" + versionName + " tersedia. Ketuk untuk mengunduh pembaruan.";
        }

        StringBuilder bigText = new StringBuilder();
        if (!changelog.taggedLines.isEmpty()) {
            for (String item : changelog.taggedLines) {
                if (bigText.length() > 0) bigText.append('\\n');
                bigText.append(item);
            }
        } else {
            bigText.append(summary);
        }

        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.putExtra("open_apk_update", true);
        launchIntent.putExtra("version_code", versionCode);
        launchIntent.setFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK |
            Intent.FLAG_ACTIVITY_CLEAR_TOP |
            Intent.FLAG_ACTIVITY_SINGLE_TOP
        );

        PendingIntent pendingIntent = PendingIntent.getActivity(
            context,
            NOTIFICATION_ID,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        int smallIcon = context.getResources().getIdentifier(
            "ic_stat_emoeslife",
            "drawable",
            context.getPackageName()
        );
        if (smallIcon == 0) {
            smallIcon = context.getApplicationInfo().icon;
        }

        String versionSubText = "Versi v" + versionName;
        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(smallIcon)
            .setColor(NOTIFICATION_ACCENT_COLOR)
            .setContentTitle("Pembaruan e-Moeslife v" + versionName)
            .setContentText(summary)
            .setSubText(versionSubText)
            .setStyle(
                new NotificationCompat.BigTextStyle()
                    .bigText(bigText.toString())
                    .setSummaryText(versionSubText)
            )
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setSound(soundUri)
            .setDefaults(NotificationCompat.DEFAULT_VIBRATE | NotificationCompat.DEFAULT_LIGHTS)
            .setOnlyAlertOnce(true)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent);

        nm.notify(NOTIFICATION_ID, builder.build());
    }
}
`;
  fs.writeFileSync(path.join(javaAppDir, "ApkUpdateChecker.java"), updateCheckerJava, "utf8");

  const updateSchedulerJava = `package com.emoeslife.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.app.job.JobInfo;
import android.app.job.JobScheduler;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.SystemClock;

public final class ApkUpdateScheduler {

    public static final String ACTION_CHECK_APK_UPDATE = "com.emoeslife.app.ACTION_CHECK_APK_UPDATE";
    private static final int JOB_ID = 519910;
    private static final int ALARM_REQUEST_CODE = 519911;
    private static final long JOB_INTERVAL_MS = 15L * 60L * 1000L;
    private static final long ALARM_INTERVAL_MS = 20L * 60L * 1000L;

    private ApkUpdateScheduler() {}

    public static void ensureScheduled(Context context) {
        if (context == null) return;
        schedulePeriodicJob(context);
        ensureBackupAlarmScheduled(context);
    }

    private static void schedulePeriodicJob(Context context) {
        try {
            JobScheduler js = (JobScheduler) context.getSystemService(Context.JOB_SCHEDULER_SERVICE);
            if (js == null) return;
            if (js.getPendingJob(JOB_ID) != null) return;

            ComponentName serviceComponent = new ComponentName(context, ApkUpdateJobService.class);
            JobInfo.Builder builder = new JobInfo.Builder(JOB_ID, serviceComponent)
                .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
                .setPersisted(true);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                builder.setPeriodic(JOB_INTERVAL_MS, 5L * 60L * 1000L);
            } else {
                builder.setPeriodic(JOB_INTERVAL_MS);
            }
            js.schedule(builder.build());
        } catch (Exception ignored) {
            // Ignore JobScheduler restrictions on older/custom ROMs; backup alarm still runs
        }
    }

    private static void ensureBackupAlarmScheduled(Context context) {
        try {
            Intent intent = new Intent(context, ApkUpdateReceiver.class);
            intent.setAction(ACTION_CHECK_APK_UPDATE);
            PendingIntent existing = PendingIntent.getBroadcast(
                context,
                ALARM_REQUEST_CODE,
                intent,
                PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
            );
            if (existing == null) {
                scheduleNextAlarm(context);
            }
        } catch (Exception ignored) {
            // Ignore
        }
    }

    public static void scheduleNextAlarm(Context context) {
        if (context == null) return;
        try {
            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (am == null) return;

            Intent intent = new Intent(context, ApkUpdateReceiver.class);
            intent.setAction(ACTION_CHECK_APK_UPDATE);
            PendingIntent pi = PendingIntent.getBroadcast(
                context,
                ALARM_REQUEST_CODE,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            long triggerAt = SystemClock.elapsedRealtime() + ALARM_INTERVAL_MS;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAt, pi);
            } else {
                am.set(AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAt, pi);
            }
        } catch (Exception ignored) {
            // Ignore
        }
    }
}
`;
  fs.writeFileSync(path.join(javaAppDir, "ApkUpdateScheduler.java"), updateSchedulerJava, "utf8");

  const updateJobServiceJava = `package com.emoeslife.app;

import android.app.job.JobParameters;
import android.app.job.JobService;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ApkUpdateJobService extends JobService {

    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @Override
    public boolean onStartJob(JobParameters params) {
        executor.execute(() -> {
            try {
                ApkUpdateChecker.checkAndNotify(getApplicationContext(), false);
            } finally {
                jobFinished(params, false);
            }
        });
        return true;
    }

    @Override
    public boolean onStopJob(JobParameters params) {
        return true;
    }

    @Override
    public void onDestroy() {
        executor.shutdownNow();
        super.onDestroy();
    }
}
`;
  fs.writeFileSync(path.join(javaAppDir, "ApkUpdateJobService.java"), updateJobServiceJava, "utf8");

  const updateReceiverJava = `package com.emoeslife.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ApkUpdateReceiver extends BroadcastReceiver {

    private static final ExecutorService EXECUTOR = Executors.newSingleThreadExecutor();

    @Override
    public void onReceive(Context context, Intent intent) {
        final Context appContext = context.getApplicationContext();
        final String action = intent != null ? intent.getAction() : "";

        ApkUpdateScheduler.ensureScheduled(appContext);
        if (ApkUpdateScheduler.ACTION_CHECK_APK_UPDATE.equals(action)) {
            ApkUpdateScheduler.scheduleNextAlarm(appContext);
        }

        final PendingResult pendingResult = goAsync();
        final boolean bypassCooldown = Intent.ACTION_BOOT_COMPLETED.equals(action)
            || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action);

        EXECUTOR.execute(() -> {
            try {
                ApkUpdateChecker.checkAndNotify(appContext, bypassCooldown);
            } finally {
                pendingResult.finish();
            }
        });
    }
}
`;
  fs.writeFileSync(path.join(javaAppDir, "ApkUpdateReceiver.java"), updateReceiverJava, "utf8");

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
    public void markVersionNotified(PluginCall call) {
        Integer code = call.getInt("versionCode", 0);
        if (code != null && code > 0) {
            ApkUpdateChecker.markVersionNotified(getContext(), code.longValue());
        }
        call.resolve();
    }

    @PluginMethod
    public void consumePendingUpdateOpen(PluginCall call) {
        boolean pending = ApkUpdateChecker.consumePendingOpenUpdate(getContext());
        JSObject ret = new JSObject();
        ret.put("pending", pending);
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

  const qiblaCompassJava = `package com.emoeslife.app;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.view.Display;
import android.view.Surface;
import android.view.WindowManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "QiblaCompass")
public class QiblaCompassPlugin extends Plugin implements SensorEventListener {

    private SensorManager sensorManager;
    private Sensor rotationSensor;
    private Sensor accelSensor;
    private Sensor magnetSensor;

    private final float[] rotationMatrix = new float[9];
    private final float[] remappedMatrix = new float[9];
    private final float[] orientationAngles = new float[3];
    private final float[] lastAccel = new float[3];
    private final float[] lastMagnet = new float[3];
    private boolean hasAccel = false;
    private boolean hasMagnet = false;
    private boolean listening = false;
    private long lastEmitMs = 0L;
    private int currentAccuracy = SensorManager.SENSOR_STATUS_ACCURACY_MEDIUM;

    private void initSensorsIfNeeded() {
        if (sensorManager != null) return;
        sensorManager = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
        if (sensorManager == null) return;
        rotationSensor = sensorManager.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR);
        accelSensor = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        magnetSensor = sensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD);
    }

    private boolean isHardwareAvailable() {
        initSensorsIfNeeded();
        if (sensorManager == null) return false;
        return rotationSensor != null || (accelSensor != null && magnetSensor != null);
    }

    @SuppressWarnings("deprecation")
    private int getDisplayRotation() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && getActivity() != null) {
                Display display = getActivity().getDisplay();
                if (display != null) return display.getRotation();
            }
            WindowManager wm = (WindowManager) getContext().getSystemService(Context.WINDOW_SERVICE);
            if (wm != null && wm.getDefaultDisplay() != null) {
                return wm.getDefaultDisplay().getRotation();
            }
        } catch (Exception ignored) {
            // fallback
        }
        return Surface.ROTATION_0;
    }

    private void emitAzimuthFromMatrix() {
        int axisX = SensorManager.AXIS_X;
        int axisY = SensorManager.AXIS_Y;
        int rot = getDisplayRotation();
        if (rot == Surface.ROTATION_90) {
            axisX = SensorManager.AXIS_Y;
            axisY = SensorManager.AXIS_MINUS_X;
        } else if (rot == Surface.ROTATION_180) {
            axisX = SensorManager.AXIS_MINUS_X;
            axisY = SensorManager.AXIS_MINUS_Y;
        } else if (rot == Surface.ROTATION_270) {
            axisX = SensorManager.AXIS_MINUS_Y;
            axisY = SensorManager.AXIS_X;
        }

        SensorManager.remapCoordinateSystem(rotationMatrix, axisX, axisY, remappedMatrix);
        SensorManager.getOrientation(remappedMatrix, orientationAngles);

        double deg = Math.toDegrees(orientationAngles[0]);
        deg = ((deg % 360.0) + 360.0) % 360.0;

        long now = System.currentTimeMillis();
        if (now - lastEmitMs < 45L) return;
        lastEmitMs = now;

        JSObject data = new JSObject();
        data.put("heading", deg);
        data.put("accuracy", currentAccuracy);
        data.put("absolute", true);
        notifyListeners("compassReading", data);
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (!listening || event == null || event.sensor == null) return;
        int type = event.sensor.getType();
        if (type == Sensor.TYPE_ROTATION_VECTOR) {
            SensorManager.getRotationMatrixFromVector(rotationMatrix, event.values);
            emitAzimuthFromMatrix();
        } else if (type == Sensor.TYPE_ACCELEROMETER) {
            System.arraycopy(event.values, 0, lastAccel, 0, Math.min(3, event.values.length));
            hasAccel = true;
            if (hasMagnet && SensorManager.getRotationMatrix(rotationMatrix, null, lastAccel, lastMagnet)) {
                emitAzimuthFromMatrix();
            }
        } else if (type == Sensor.TYPE_MAGNETIC_FIELD) {
            System.arraycopy(event.values, 0, lastMagnet, 0, Math.min(3, event.values.length));
            hasMagnet = true;
            if (hasAccel && SensorManager.getRotationMatrix(rotationMatrix, null, lastAccel, lastMagnet)) {
                emitAzimuthFromMatrix();
            }
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        currentAccuracy = accuracy;
    }

    private void startListeningInternal() {
        if (listening || !isHardwareAvailable()) return;
        listening = true;
        if (rotationSensor != null) {
            sensorManager.registerListener(this, rotationSensor, SensorManager.SENSOR_DELAY_UI);
        } else {
            if (accelSensor != null) {
                sensorManager.registerListener(this, accelSensor, SensorManager.SENSOR_DELAY_UI);
            }
            if (magnetSensor != null) {
                sensorManager.registerListener(this, magnetSensor, SensorManager.SENSOR_DELAY_UI);
            }
        }
    }

    private void stopListeningInternal() {
        if (!listening || sensorManager == null) return;
        listening = false;
        sensorManager.unregisterListener(this);
    }

    @PluginMethod
    public void start(PluginCall call) {
        boolean available = isHardwareAvailable();
        if (available) {
            startListeningInternal();
        }
        JSObject ret = new JSObject();
        ret.put("available", available);
        ret.put("listening", listening);
        call.resolve(ret);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        stopListeningInternal();
        call.resolve();
    }

    @Override
    protected void handleOnPause() {
        stopListeningInternal();
        super.handleOnPause();
    }

    @Override
    protected void handleOnDestroy() {
        stopListeningInternal();
        super.handleOnDestroy();
    }
}
`;
  fs.writeFileSync(path.join(javaAppDir, "QiblaCompassPlugin.java"), qiblaCompassJava, "utf8");

  const mainActivityJava = `package com.emoeslife.app;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private void handleUpdateIntent(Intent intent) {
        if (intent != null && intent.getBooleanExtra("open_apk_update", false)) {
            ApkUpdateChecker.setPendingOpenUpdate(getApplicationContext(), true);
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ApkInstallerPlugin.class);
        registerPlugin(QiblaCompassPlugin.class);
        super.onCreate(savedInstanceState);
        handleUpdateIntent(getIntent());
        ApkUpdateScheduler.ensureScheduled(getApplicationContext());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleUpdateIntent(intent);
    }
}
`;
  fs.writeFileSync(path.join(javaAppDir, "MainActivity.java"), mainActivityJava, "utf8");
  console.log("Generated ApkInstallerPlugin, QiblaCompassPlugin, background ApkUpdateChecker/JobService/Receiver, and MainActivity.");
}

// Copy notification & Adzan sounds to android/app/src/main/res/raw/
const resRawDir = path.join(rootDir, "android", "app", "src", "main", "res", "raw");
const publicSoundDir = path.join(rootDir, "public", "assets", "sounds");
if (fs.existsSync(publicSoundDir)) {
  fs.mkdirSync(resRawDir, { recursive: true });
  for (const soundName of ["notif_shalat.wav", "notif_update.wav", "adzan.mp3", "adzan_subuh.mp3"]) {
    const srcSound = path.join(publicSoundDir, soundName);
    if (fs.existsSync(srcSound)) {
      fs.copyFileSync(srcSound, path.join(resRawDir, soundName));
    }
  }
  console.log("Copied notification and Adzan sound assets to android/app/src/main/res/raw/.");
}

