import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import {
  formatApkSize,
  INSTALLED_APK_VERSION_NAME,
  isNativeAndroidApp,
  type ApkChangelogCategory,
  type ApkReleaseInfo,
} from "../services/apkUpdater";
import {
  downloadAndInstallApk,
  installCachedApk,
  isInAppApkInstallerAvailable,
  type ApkDownloadProgressEvent,
} from "../services/apkInstaller";

interface ApkUpdatePromptProps {
  release: ApkReleaseInfo | null;
  statusMessage?: string | null;
  onDismiss: () => void;
}

const CATEGORY_STYLE: Record<
  ApkChangelogCategory,
  { icon: React.ReactNode; badgeClass: string }
> = {
  fitur: {
    icon: <Sparkles className="h-3.5 w-3.5" />,
    badgeClass:
      "border-[var(--theme-tint-border)] bg-[var(--theme-tint-bg)] text-[var(--theme-tint-text)]",
  },
  keamanan: {
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
    badgeClass:
      "bg-amber-50 text-[#9c6a12] border-amber-200 dark:bg-amber-950/50 dark:text-[#E2B354] dark:border-amber-800/70",
  },
  perbaikan: {
    icon: <Wrench className="h-3.5 w-3.5" />,
    badgeClass:
      "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/70",
  },
  lainnya: {
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    badgeClass:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  },
};

function formatReleaseDate(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatByteProgress(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 MB";
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const ApkUpdatePrompt: React.FC<ApkUpdatePromptProps> = ({
  release,
  statusMessage,
  onDismiss,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<ApkDownloadProgressEvent | null>(null);
  const [needsPermissionRetry, setNeedsPermissionRetry] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);
  const canInAppInstall = isInAppApkInstallerAvailable() || isNativeAndroidApp();

  useEffect(() => {
    setDownloading(false);
    setProgress(null);
    setNeedsPermissionRetry(false);
    setInstallError(null);
  }, [release?.versionCode]);

  if (!release && !statusMessage) return null;

  if (!release && statusMessage) {
    return (
      <div
        role="status"
        className="fixed right-4 bottom-20 left-4 z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-[var(--theme-border-strong)] bg-[var(--theme-card)] px-4 py-3 text-xs font-medium text-[var(--theme-ink)] shadow-xl lg:right-6 lg:bottom-6 lg:left-auto"
      >
        <div className="flex items-center gap-2.5">
          <RefreshCw className="h-4 w-4 shrink-0 text-[var(--theme-tint-text)]" />
          <span>{statusMessage}</span>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Tutup notifikasi"
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (!release) return null;
  const sizeLabel = formatApkSize(release.sizeBytes);
  const dateLabel = formatReleaseDate(release.publishedAt);

  const handleInAppUpdate = async () => {
    if (downloading) return;
    setInstallError(null);

    if (needsPermissionRetry) {
      setDownloading(true);
      try {
        const res = await installCachedApk();
        if (res.status === "permission_denied") {
          setNeedsPermissionRetry(true);
        } else {
          setNeedsPermissionRetry(false);
        }
      } catch (err) {
        setNeedsPermissionRetry(false);
        setInstallError(err instanceof Error ? err.message : "Gagal membuka pemasang APK.");
      } finally {
        setDownloading(false);
      }
      return;
    }

    setDownloading(true);
    setProgress({ stage: "connecting", downloadedBytes: 0, totalBytes: release.sizeBytes, percent: 0 });
    try {
      const res = await downloadAndInstallApk(release.downloadUrl, (evt) => {
        setProgress(evt);
      });
      if (res.status === "permission_denied") {
        setNeedsPermissionRetry(true);
      } else {
        setNeedsPermissionRetry(false);
      }
    } catch (err) {
      setInstallError(err instanceof Error ? err.message : "Gagal mengunduh pembaruan APK.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4 sm:items-center"
      onClick={() => {
        if (!downloading) onDismiss();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="apk-update-title"
    >
      <div
        className="w-full max-w-md rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-5 text-[var(--theme-ink)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/assets/app-icon/icon.png"
              alt="e-Moeslife"
              className="h-12 w-12 shrink-0 rounded-2xl border border-[var(--theme-border)] bg-white p-1"
            />
            <div>
              <p className="text-[11px] font-bold tracking-wider text-[var(--theme-accent)] uppercase">
                Pembaruan Tersedia
              </p>
              <h2
                id="apk-update-title"
                className="font-display text-lg font-semibold text-[var(--theme-heading)]"
              >
                e-Moeslife v{release.versionName}
              </h2>
              {dateLabel && (
                <p className="text-[11px] text-[var(--theme-muted)]">
                  Dirilis {dateLabel}
                </p>
              )}
            </div>
          </div>
          {!downloading && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Tutup pembaruan"
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-[var(--theme-border-soft)] bg-[var(--theme-card-alt)] p-3.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[var(--theme-muted)]">Versi terpasang</span>
            <span className="font-semibold text-[var(--theme-ink)]">
              v{INSTALLED_APK_VERSION_NAME}
            </span>
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="text-[var(--theme-muted)]">Versi terbaru</span>
            <span className="font-bold text-[var(--theme-tint-text)]">
              v{release.versionName}
              {sizeLabel ? ` · ${sizeLabel}` : ""}
            </span>
          </div>
        </div>

        <div className="mt-3.5 rounded-2xl border border-[var(--theme-border-soft)] bg-[var(--theme-card-alt)] p-3.5">
          <p className="text-[11px] font-bold tracking-wider text-[var(--theme-accent)] uppercase">
            Catatan Pembaruan (Changelog)
          </p>

          {release.changelog.length > 0 ? (
            <div className="mt-2.5 max-h-44 space-y-3 overflow-y-auto pr-1">
              {release.changelog.map((group) => {
                const style = CATEGORY_STYLE[group.category];
                return (
                  <div key={group.category} className="space-y-1.5">
                    <div
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[11px] font-bold ${style.badgeClass}`}
                    >
                      {style.icon}
                      <span>{group.label}</span>
                    </div>
                    <ul className="space-y-1 pl-1 text-xs leading-relaxed text-[var(--theme-nav-muted)]">
                      {group.items.map((item, idx) => (
                        <li key={`${group.category}-${idx}`} className="flex items-start gap-2">
                          <span
                            aria-hidden="true"
                            className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--theme-primary)]"
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-2 text-xs leading-relaxed text-[var(--theme-muted)]">
              Pembaruan aplikasi tersedia dengan peningkatan stabilitas dan pengalaman baca.
            </p>
          )}
        </div>

        {downloading && progress && (
          <div className="mt-3.5 rounded-2xl border border-[var(--theme-tint-border)] bg-[var(--theme-tint-bg)] p-3">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--theme-tint-text)]">
              <span>
                {progress.stage === "connecting"
                  ? "Menghubungkan ke server…"
                  : progress.stage === "permission"
                  ? "Menunggu izin pemasangan aplikasi…"
                  : progress.stage === "ready"
                  ? "Membuka pemasang Android…"
                  : "Mengunduh pembaruan APK…"}
              </span>
              <span className="font-mono-tabular">{progress.percent}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--theme-border)]">
              <div
                className="h-full rounded-full bg-[var(--theme-primary)] transition-all duration-150"
                style={{ width: `${Math.max(4, progress.percent)}%` }}
              />
            </div>
            {progress.totalBytes > 0 && (
              <p className="mt-1.5 text-[11px] text-[var(--theme-muted)]">
                {formatByteProgress(progress.downloadedBytes)} /{" "}
                {formatByteProgress(progress.totalBytes)}
              </p>
            )}
          </div>
        )}

        {needsPermissionRetry && !downloading && (
          <div className="mt-3.5 flex items-start gap-2 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-950 dark:border-amber-700/70 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Berkas pembaruan sudah terunduh. Aktifkan izin{" "}
              <strong>“Izinkan dari sumber ini”</strong> untuk e-Moeslife agar pembaruan dapat
              dipasang langsung.
            </span>
          </div>
        )}

        {installError && !downloading && (
          <div className="mt-3.5 space-y-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{installError}</span>
            </div>
            {canInAppInstall && (
              <button
                type="button"
                onClick={handleInAppUpdate}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-red-900 px-3 text-[11px] font-semibold text-white hover:bg-red-800 dark:bg-red-800 dark:hover:bg-red-700"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Coba Unduh Ulang di Aplikasi</span>
              </button>
            )}
          </div>
        )}

        <div className="mt-3.5 flex items-start gap-2.5 rounded-2xl border border-amber-300/85 bg-amber-50/90 p-3 text-[11.5px] leading-relaxed text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/35 dark:text-amber-100">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-[#E2B354]" />
          <div>
            <p className="font-semibold text-amber-950 dark:text-[#f5d388]">
              Info Pemasangan (Google Play Protect)
            </p>
            <p className="mt-0.5">
              Klik <strong>Detail selengkapnya</strong> lalu pilih <strong>Tetap instal</strong>{" "}
              jika pembaruan diblokir oleh Google Play Protect. Hal tersebut terjadi karena aplikasi
              e-Moeslife diunduh langsung dan bukan berasal dari Google Play Store.
            </p>
          </div>
        </div>

        <p className="mt-2.5 flex items-start gap-2 text-[11px] leading-relaxed text-[var(--theme-muted)]">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--theme-tint-text)]" />
          <span>
            Pembaruan diunduh dan dipasang langsung di dalam aplikasi e-Moeslife tanpa dialihkan ke
            browser. Data bacaan dan pengaturan tetap tersimpan aman.
          </span>
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row-reverse">
          {canInAppInstall ? (
            <button
              type="button"
              onClick={handleInAppUpdate}
              disabled={downloading}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--theme-primary)] px-4 text-xs font-bold text-[var(--theme-primary-text)] shadow-xs transition-colors hover:bg-[var(--theme-primary-hover)] disabled:opacity-75"
            >
              {downloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>
                    {progress?.percent ? `Mengunduh (${progress.percent}%)…` : "Memproses…"}
                  </span>
                </>
              ) : needsPermissionRetry ? (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Izinkan &amp; Pasang Sekarang</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Unduh &amp; Perbarui APK</span>
                </>
              )}
            </button>
          ) : (
            <a
              href={release.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onDismiss}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--theme-primary)] px-4 text-xs font-bold text-[var(--theme-primary-text)] shadow-xs transition-colors hover:bg-[var(--theme-primary-hover)]"
            >
              <Download className="h-4 w-4" />
              <span>Unduh &amp; Perbarui APK</span>
            </a>
          )}
          <button
            type="button"
            onClick={onDismiss}
            disabled={downloading}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[var(--theme-border-strong)] bg-[var(--theme-card)] px-4 text-xs font-semibold text-[var(--theme-nav-muted)] transition-colors hover:bg-[var(--theme-card-alt)] disabled:opacity-50"
          >
            Nanti Saja
          </button>
        </div>
      </div>
    </div>
  );
};
