import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Droplets,
  Info,
  Sparkles,
} from "lucide-react";
import {
  SHALAT_INTENTIONS,
  SHALAT_RUKUN,
  SHALAT_STEPS,
  WUDHU_BATAL,
  WUDHU_OVERVIEW_IMAGE,
  WUDHU_RUKUN,
  WUDHU_STEPS,
  type GuideStep,
} from "../data/wudhuShalatGuide";
import { FooterDisclaimer } from "./FooterDisclaimer";

interface WudhuShalatViewProps {
  initialTab?: "wudhu" | "shalat";
  onBackHome: () => void;
}

export const WudhuShalatView: React.FC<WudhuShalatViewProps> = ({
  initialTab = "wudhu",
  onBackHome,
}) => {
  const [tab, setTab] = useState<"wudhu" | "shalat">(initialTab);
  const [selectedShalatId, setSelectedShalatId] = useState<string>(SHALAT_INTENTIONS[0].id);
  const [copiedKey, setCopiedKey] = useState<string>("");

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((prev) => (prev === key ? "" : prev)), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const activeSteps: GuideStep[] = tab === "wudhu" ? WUDHU_STEPS : SHALAT_STEPS;
  const activeIntention =
    SHALAT_INTENTIONS.find((i) => i.id === selectedShalatId) || SHALAT_INTENTIONS[0];

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 pt-4 pb-10 sm:px-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-3 border-b border-[#e2e8e4] pb-4 md:flex-row md:items-end dark:border-slate-800">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onBackHome}
            aria-label="Kembali ke beranda"
            className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#dce4df] bg-white text-[#174231] hover:bg-[#f2f6f4] dark:border-slate-800 dark:bg-[#111A27] dark:text-slate-200 dark:hover:bg-[#172334]"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-[#9c7d3c] uppercase dark:text-[#E2B354]">
              Tuntunan Ibadah Harian
            </p>
            <h1 className="font-display mt-0.5 text-xl font-semibold text-[#103d2c] sm:text-2xl dark:text-white">
              Panduan Wudhu &amp; Shalat
            </h1>
            <p className="mt-0.5 text-xs text-[#5e6a62] sm:text-sm dark:text-slate-300">
              Tata cara lengkap dengan bacaan Arab, transliterasi Latin, arti bahasa Indonesia, dan ilustrasi gerakan.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div
          role="tablist"
          aria-label="Pilih panduan"
          className="flex shrink-0 rounded-xl border border-[#dce4df] bg-white p-1 dark:border-slate-800 dark:bg-[#111A27]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "wudhu"}
            onClick={() => setTab("wudhu")}
            className={`inline-flex min-h-[38px] flex-1 items-center justify-center gap-1.5 rounded-lg px-3.5 text-xs font-semibold whitespace-nowrap transition-colors sm:flex-none ${
              tab === "wudhu"
                ? "bg-[#134a35] text-white dark:bg-[#E2B354] dark:text-[#0B111A]"
                : "text-[#354c3e] hover:text-[#103d2c] dark:text-slate-300"
            }`}
          >
            <Droplets className="h-3.5 w-3.5" />
            <span>Tata Cara Wudhu</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "shalat"}
            onClick={() => setTab("shalat")}
            className={`inline-flex min-h-[38px] flex-1 items-center justify-center gap-1.5 rounded-lg px-3.5 text-xs font-semibold whitespace-nowrap transition-colors sm:flex-none ${
              tab === "shalat"
                ? "bg-[#134a35] text-white dark:bg-[#E2B354] dark:text-[#0B111A]"
                : "text-[#354c3e] hover:text-[#103d2c] dark:text-slate-300"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Tata Cara Shalat</span>
          </button>
        </div>
      </div>

      {/* Wudhu Overview Visual + Rukun & Batal Cards */}
      {tab === "wudhu" && (
        <section className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-[#e2e8e4] bg-white shadow-xs dark:border-slate-800 dark:bg-[#111A27]">
            <div className="w-full bg-white p-2 sm:p-4">
              <img
                src={WUDHU_OVERVIEW_IMAGE.src}
                alt={WUDHU_OVERVIEW_IMAGE.alt}
                referrerPolicy="no-referrer"
                className="mx-auto block h-auto max-h-[460px] w-full object-contain"
              />
            </div>
            <div className="border-t border-[#e8eeea] px-4 py-3 text-xs text-[#5e6a62] dark:border-slate-800 dark:text-slate-300">
              {WUDHU_OVERVIEW_IMAGE.caption}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-[#e2e8e4] bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#111A27]">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-[#103d2c] dark:text-white">
                <CheckCircle2 className="h-4 w-4 text-[#134a35] dark:text-[#E2B354]" />
                <span>6 Fardhu (Rukun) Wudhu</span>
              </h2>
              <ol className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-[#354c3e] dark:text-slate-300">
                {WUDHU_RUKUN.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-mono-tabular mt-0.5 font-semibold text-[#9c7d3c] dark:text-[#E2B354]">
                      {idx + 1}.
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border border-[#e2e8e4] bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#111A27]">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-[#103d2c] dark:text-white">
                <Info className="h-4 w-4 text-[#9c7d3c] dark:text-[#E2B354]" />
                <span>Yang Membatalkan Wudhu</span>
              </h2>
              <ul className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-[#354c3e] dark:text-slate-300">
                {WUDHU_BATAL.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#9c7d3c] dark:bg-[#E2B354]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Shalat Niat 5 Waktu Selector & 13 Rukun Ringkas */}
      {tab === "shalat" && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-[#b7d3c3] bg-white p-4 shadow-xs ring-1 ring-[#134a35]/10 sm:p-5 dark:border-[#2a4562] dark:bg-[#111A27] dark:ring-[#E2B354]/15">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e8eeea] pb-3 dark:border-slate-800">
              <div>
                <p className="text-[11px] font-semibold tracking-wider text-[#9c7d3c] uppercase dark:text-[#E2B354]">
                  Lafal Niat Shalat Fardhu
                </p>
                <h2 className="font-display mt-0.5 text-base font-semibold text-[#103d2c] sm:text-lg dark:text-white">
                  Pilih Shalat 5 Waktu
                </h2>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    `niat-${activeIntention.id}`,
                    `${activeIntention.name}\n${activeIntention.arabic}\n${activeIntention.latin}\n${activeIntention.translation}`
                  )
                }
                className="inline-flex min-h-[34px] items-center gap-1 rounded-xl border border-[#dce4df] bg-[#f4f7f5] px-3 text-xs font-semibold text-[#174231] hover:bg-[#e6ede9] dark:border-slate-700 dark:bg-[#162131] dark:text-slate-200"
              >
                {copiedKey === `niat-${activeIntention.id}` ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>{copiedKey === `niat-${activeIntention.id}` ? "Tersalin" : "Salin Niat"}</span>
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {SHALAT_INTENTIONS.map((item) => {
                const active = item.id === activeIntention.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedShalatId(item.id)}
                    className={`min-h-[36px] rounded-xl px-3 text-xs font-semibold transition-colors ${
                      active
                        ? "bg-[#134a35] text-white dark:bg-[#E2B354] dark:text-[#0B111A]"
                        : "border border-[#dce4df] bg-[#f4f7f5] text-[#354c3e] hover:bg-[#e6ede9] dark:border-slate-700 dark:bg-[#162131] dark:text-slate-200"
                    }`}
                  >
                    {item.name.replace("Shalat ", "")} · {item.rakaat}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 space-y-2 rounded-xl bg-[#f7faf8] p-3.5 sm:p-4 dark:bg-[#162131]">
              <p
                lang="ar"
                dir="rtl"
                className="arabic-reader-text text-right text-[#1c2b23] dark:text-[#EDF2F7]"
              >
                {activeIntention.arabic}
              </p>
              <p className="latin-reader-text text-[#7a6d56] italic dark:text-slate-400">
                {activeIntention.latin}
              </p>
              <p className="prose-reader-text text-[#2e3e34] dark:text-slate-300">
                {activeIntention.translation}
              </p>
            </div>
          </div>

          <details className="rounded-2xl border border-[#e2e8e4] bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#111A27]">
            <summary className="cursor-pointer list-none text-sm font-semibold text-[#103d2c] dark:text-white">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#134a35] dark:text-[#E2B354]" />
                <span>Ringkasan 13 Rukun Shalat (Ketuk untuk melihat)</span>
              </span>
            </summary>
            <ol className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 border-t border-[#e8eeea] pt-3 text-xs leading-relaxed text-[#354c3e] sm:grid-cols-2 dark:border-slate-800 dark:text-slate-300">
              {SHALAT_RUKUN.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-mono-tabular mt-0.5 font-semibold text-[#9c7d3c] dark:text-[#E2B354]">
                    {String(idx + 1).padStart(2, "0")}.
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </details>
        </section>
      )}

      {/* Quick Jump Step Index */}
      <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1">
        {activeSteps.map((step) => (
          <a
            key={step.id}
            href={`#${step.id}`}
            className="inline-flex min-h-[34px] shrink-0 items-center gap-1.5 rounded-xl border border-[#dce4df] bg-white px-3 text-xs font-medium text-[#174231] hover:border-[#134a35] hover:bg-[#f4f8f5] dark:border-slate-800 dark:bg-[#111A27] dark:text-slate-200 dark:hover:border-[#E2B354]"
          >
            <span className="font-mono-tabular font-semibold text-[#9c7d3c] dark:text-[#E2B354]">
              {step.number}
            </span>
            <span className="max-w-[170px] truncate">{step.title}</span>
          </a>
        ))}
      </div>

      {/* Step-by-Step Detailed Cards */}
      <div className="space-y-4">
        {activeSteps.map((step) => {
          const isCopied = copiedKey === step.id;
          return (
            <article
              key={step.id}
              id={step.id}
              className="scroll-mt-20 overflow-hidden rounded-2xl border border-[#e2e8e4] bg-white shadow-xs dark:border-slate-800 dark:bg-[#111A27]"
            >
              {step.image && (
                <div className="border-b border-[#e8eeea] bg-white dark:border-slate-800 dark:bg-[#0D1520]">
                  <div className="w-full bg-white p-2 sm:p-4">
                    <img
                      src={step.image.src}
                      alt={step.image.alt}
                      referrerPolicy="no-referrer"
                      className="mx-auto block h-auto max-h-[420px] w-full object-contain"
                    />
                  </div>
                  <p className="border-t border-[#e8eeea] bg-[#f6f9f7] px-4 py-2 text-[11px] font-medium text-[#5e6a62] dark:border-slate-800 dark:bg-[#0D1520] dark:text-slate-400">
                    {step.image.caption}
                  </p>
                </div>
              )}

              <div className="p-4 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span className="font-mono-tabular flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#134a35] text-xs font-bold text-white dark:bg-[#E2B354] dark:text-[#0B111A]">
                      {step.number}
                    </span>
                    <div className="min-w-0">
                      <span className="inline-block rounded-md bg-[#fbf5e6] px-2 py-0.5 text-[10px] font-semibold text-[#8d6820] uppercase dark:bg-[#272011] dark:text-[#E2B354]">
                        {step.badge}
                      </span>
                      <h3 className="font-display mt-1 text-base font-semibold text-[#103d2c] sm:text-lg dark:text-white">
                        {step.title}
                      </h3>
                    </div>
                  </div>

                  {step.arabic && (
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          step.id,
                          [step.title, step.arabic, step.latin, step.translation]
                            .filter(Boolean)
                            .join("\n\n")
                        )
                      }
                      className="inline-flex min-h-[34px] shrink-0 items-center gap-1 rounded-xl border border-[#dce4df] bg-[#f4f7f5] px-2.5 text-xs font-semibold text-[#174231] hover:bg-[#e6ede9] dark:border-slate-700 dark:bg-[#162131] dark:text-slate-200"
                    >
                      {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{isCopied ? "Tersalin" : "Salin Bacaan"}</span>
                    </button>
                  )}
                </div>

                <p className="prose-reader-text mt-3 text-[#2e3e34] dark:text-slate-300">
                  {step.summary}
                </p>

                {step.movement && (
                  <p className="mt-2 rounded-xl border border-[#e4ece7] bg-[#f8fbf9] px-3.5 py-2.5 text-xs leading-relaxed text-[#354c3e] dark:border-slate-800 dark:bg-[#162131] dark:text-slate-300">
                    <strong className="text-[#134a35] dark:text-[#E2B354]">Gerakan:</strong>{" "}
                    {step.movement}
                  </p>
                )}

                {step.arabic && (
                  <div className="mt-4 space-y-2 border-t border-[#e8eeea] pt-4 dark:border-slate-800">
                    <p
                      lang="ar"
                      dir="rtl"
                      className="arabic-reader-text whitespace-pre-wrap text-right text-[#1c2b23] dark:text-[#EDF2F7]"
                    >
                      {step.arabic}
                    </p>
                    {step.latin && (
                      <p className="latin-reader-text text-[#7a6d56] italic dark:text-slate-400">
                        {step.latin}
                      </p>
                    )}
                    {step.translation && (
                      <p className="prose-reader-text text-[#2e3e34] dark:text-slate-300">
                        {step.translation}
                      </p>
                    )}
                  </div>
                )}

                {step.note && (
                  <p className="mt-3 text-xs text-[#6e644e] italic dark:text-slate-400">
                    Catatan: {step.note}
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <FooterDisclaimer variant="compact" />
    </div>
  );
};
