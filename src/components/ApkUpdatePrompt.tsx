import React from "react";
import {
  CheckCircle2,
  Download,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import {
  formatApkSize,
  INSTALLED_APK_VERSION_NAME,
  type ApkChangelogCategory,
  type ApkReleaseInfo,
} from "../services/apkUpdater";

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
      "bg-emerald-50 text-[#134a35] border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/70",
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

export const ApkUpdatePrompt: React.FC<ApkUpdatePromptProps> = ({
  release,
  statusMessage,
  onDismiss,
}) => {
  if (!release && !statusMessage) return null;

  if (!release && statusMessage) {
    return (
      <div
        role="status"
        className="fixed right-4 bottom-20 left-4 z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-[#dce4df] bg-white px-4 py-3 text-xs font-medium text-[#1d2c24] shadow-xl lg:right-6 lg:bottom-6 lg:left-auto dark:border-slate-700 dark:bg-[#111A27] dark:text-slate-100"
      >
        <div className="flex items-center gap-2.5">
          <RefreshCw className="h-4 w-4 shrink-0 text-[#134a35] dark:text-[#E2B354]" />
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4 sm:items-center"
      onClick={onDismiss}
      role="dialog"
      aria-modal="true"
      aria-labelledby="apk-update-title"
    >
      <div
        className="w-full max-w-md rounded-3xl border border-[#e2e8e4] bg-white p-5 text-[#1d2c24] shadow-2xl dark:border-slate-700/80 dark:bg-[#111A27] dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/assets/app-icon/icon.png"
              alt="e-Moeslife"
              className="h-12 w-12 shrink-0 rounded-2xl border border-[#e2e8e4] bg-white p-1 dark:border-slate-700"
            />
            <div>
              <p className="text-[11px] font-bold tracking-wider text-[#9c7d3c] uppercase dark:text-[#E2B354]">
                Pembaruan Tersedia
              </p>
              <h2
                id="apk-update-title"
                className="font-display text-lg font-semibold text-[#103d2c] dark:text-white"
              >
                e-Moeslife v{release.versionName}
              </h2>
              {dateLabel && (
                <p className="text-[11px] text-[#5e6a62] dark:text-slate-400">
                  Dirilis {dateLabel}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Tutup pembaruan"
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-[#e8eeea] bg-[#f8faf9] p-3.5 text-xs dark:border-slate-800 dark:bg-[#152030]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[#5e6a62] dark:text-slate-400">Versi terpasang</span>
            <span className="font-semibold text-[#1d2c24] dark:text-slate-200">
              v{INSTALLED_APK_VERSION_NAME}
            </span>
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="text-[#5e6a62] dark:text-slate-400">Versi terbaru</span>
            <span className="font-bold text-[#134a35] dark:text-[#E2B354]">
              v{release.versionName}
              {sizeLabel ? ` · ${sizeLabel}` : ""}
            </span>
          </div>
        </div>

        <div className="mt-3.5 rounded-2xl border border-[#e8eeea] bg-[#fbfcfb] p-3.5 dark:border-slate-800 dark:bg-[#131D2B]">
          <p className="text-[11px] font-bold tracking-wider text-[#9c7d3c] uppercase dark:text-[#E2B354]">
            Catatan Pembaruan (Changelog)
          </p>

          {release.changelog.length > 0 ? (
            <div className="mt-2.5 max-h-48 space-y-3 overflow-y-auto pr-1">
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
                    <ul className="space-y-1 pl-1 text-xs leading-relaxed text-[#354c3e] dark:text-slate-300">
                      {group.items.map((item, idx) => (
                        <li key={`${group.category}-${idx}`} className="flex items-start gap-2">
                          <span
                            aria-hidden="true"
                            className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#134a35] dark:bg-[#E2B354]"
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
            <p className="mt-2 text-xs leading-relaxed text-[#5e6a62] dark:text-slate-300">
              Pembaruan aplikasi tersedia dengan peningkatan stabilitas dan pengalaman baca.
            </p>
          )}
        </div>

        <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-[#5e6a62] dark:text-slate-400">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#134a35] dark:text-[#E2B354]" />
          <span>
            Setelah berkas APK selesai diunduh, ketuk notifikasi unduhan lalu pilih{" "}
            <strong>Perbarui / Update</strong>. Data bacaan dan pengaturan tetap tersimpan.
          </span>
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row-reverse">
          <a
            href={release.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onDismiss}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#134a35] px-4 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#0e3928] dark:bg-[#E2B354] dark:text-[#0B111A] dark:hover:bg-[#ecc26c]"
          >
            <Download className="h-4 w-4" />
            <span>Unduh &amp; Perbarui APK</span>
          </a>
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#dce4df] bg-white px-4 text-xs font-semibold text-[#354c3e] transition-colors hover:bg-[#f4f7f5] dark:border-slate-700 dark:bg-[#162131] dark:text-slate-300 dark:hover:bg-[#1E2C40]"
          >
            Nanti Saja
          </button>
        </div>
      </div>
    </div>
  );
};
