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
    <div
      style={{
        backgroundColor: "var(--tashrif-bg)",
        color: "var(--tashrif-text)",
        minHeight: "100vh",
      }}
    >
      <div className="mx-auto max-w-5xl space-y-4 px-3.5 pt-3.5 pb-10 sm:px-6">
        {/* Top Bar + Back + Segmented Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onBackHome}
            style={{
              border: "1px solid var(--tashrif-border-cell)",
              backgroundColor: "var(--tashrif-paper)",
              color: "var(--tashrif-text)",
            }}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 text-xs font-semibold shadow-xs transition-colors hover:opacity-90"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Beranda</span>
          </button>

          {/* Tab Switcher */}
          <div
            role="tablist"
            aria-label="Pilih panduan"
            style={{
              border: "1px solid var(--tashrif-border-cell)",
              backgroundColor: "var(--tashrif-paper)",
            }}
            className="flex shrink-0 rounded-xl p-1 shadow-xs"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === "wudhu"}
              onClick={() => setTab("wudhu")}
              style={
                tab === "wudhu"
                  ? {
                      backgroundColor: "var(--tashrif-btn-bg)",
                      color: "var(--tashrif-btn-text)",
                    }
                  : { color: "var(--tashrif-text)" }
              }
              className="inline-flex min-h-[36px] flex-1 items-center justify-center gap-1.5 rounded-lg px-3.5 text-xs font-bold whitespace-nowrap transition-colors sm:flex-none"
            >
              <Droplets className="h-3.5 w-3.5" />
              <span>Tata Cara Wudhu</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "shalat"}
              onClick={() => setTab("shalat")}
              style={
                tab === "shalat"
                  ? {
                      backgroundColor: "var(--tashrif-btn-bg)",
                      color: "var(--tashrif-btn-text)",
                    }
                  : { color: "var(--tashrif-text)" }
              }
              className="inline-flex min-h-[36px] flex-1 items-center justify-center gap-1.5 rounded-lg px-3.5 text-xs font-bold whitespace-nowrap transition-colors sm:flex-none"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Tata Cara Shalat</span>
            </button>
          </div>
        </div>

        {/* Banner Header Hijau Zamrud (Senada Pembaca Kitab) */}
        <div
          style={{
            backgroundColor: "var(--tashrif-panel-bg)",
            border: "1px solid var(--tashrif-panel-border)",
            borderRadius: "0.75rem",
          }}
          className="px-3.5 py-4 text-center shadow-xs"
        >
          <h1
            dir="rtl"
            lang="ar"
            style={{ color: "var(--tashrif-panel-bright)", lineHeight: "1.8" }}
            className="font-arabic text-2xl font-bold sm:text-[1.65rem]"
          >
            {tab === "wudhu" ? "أَحْكَامُ الْوُضُوْءِ وَسُنَنُهُ" : "كَيْفِيَّةُ الصَّلَاةِ وَأَرْكَانُهَا"}
          </h1>
          <p style={{ color: "var(--tashrif-panel-sub)" }} className="mt-0.5 text-xs font-semibold">
            {tab === "wudhu"
              ? "Panduan Wudhu — Niat, 6 Fardhu (Safinatun Najah), Tata Cara & Doa"
              : "Panduan Shalat — Niat 5 Waktu, 17 Rukun (Safinatun Najah), Bacaan & Qunut"}
          </p>
        </div>

        {/* Wudhu Rukun & Batal Cards */}
        {tab === "wudhu" && (
          <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div
              style={{
                backgroundColor: "var(--tashrif-paper)",
                border: "1px solid var(--tashrif-border-cell)",
                borderRadius: "0.75rem",
              }}
              className="overflow-hidden shadow-xs"
            >
              <div
                style={{
                  backgroundColor: "var(--tashrif-wazan-bg)",
                  borderBottom: "1px solid var(--tashrif-border-cell)",
                }}
                className="flex items-center gap-2 px-4 py-2.5"
              >
                <CheckCircle2
                  style={{ color: "var(--tashrif-accent)" }}
                  className="h-4 w-4 shrink-0"
                />
                <h2
                  style={{ color: "var(--tashrif-ink)" }}
                  className="text-xs font-bold tracking-wide uppercase"
                >
                  6 Fardhu (Rukun) Wudhu
                </h2>
              </div>
              <ol
                style={{ color: "var(--tashrif-text)" }}
                className="space-y-1.5 p-4 text-xs leading-relaxed"
              >
                {WUDHU_RUKUN.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span
                      style={{ color: "var(--tashrif-accent)" }}
                      className="font-mono-tabular mt-0.5 font-bold"
                    >
                      {idx + 1}.
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div
              style={{
                backgroundColor: "var(--tashrif-paper)",
                border: "1px solid var(--tashrif-border-cell)",
                borderRadius: "0.75rem",
              }}
              className="overflow-hidden shadow-xs"
            >
              <div
                style={{
                  backgroundColor: "var(--tashrif-wazan-bg)",
                  borderBottom: "1px solid var(--tashrif-border-cell)",
                }}
                className="flex items-center gap-2 px-4 py-2.5"
              >
                <Info
                  style={{ color: "var(--tashrif-accent)" }}
                  className="h-4 w-4 shrink-0"
                />
                <h2
                  style={{ color: "var(--tashrif-ink)" }}
                  className="text-xs font-bold tracking-wide uppercase"
                >
                  Yang Membatalkan Wudhu
                </h2>
              </div>
              <ul
                style={{ color: "var(--tashrif-text)" }}
                className="space-y-1.5 p-4 text-xs leading-relaxed"
              >
                {WUDHU_BATAL.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span
                      style={{ color: "var(--tashrif-accent)" }}
                      className="font-mono-tabular font-bold"
                    >
                      —
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Shalat Niat 5 Waktu Selector & 17 Rukun Ringkas */}
        {tab === "shalat" && (
          <section className="space-y-4">
            <div
              style={{
                backgroundColor: "var(--tashrif-paper)",
                border: "4px double var(--tashrif-border-strong)",
                borderRadius: "0.75rem",
              }}
              className="overflow-hidden shadow-xs"
            >
              <div
                style={{
                  backgroundColor: "var(--tashrif-wazan-bg)",
                  borderBottom: "1px solid var(--tashrif-border-cell)",
                }}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5"
              >
                <div>
                  <p
                    style={{ color: "var(--tashrif-accent)" }}
                    className="font-mono-tabular text-[11px] font-bold tracking-wider uppercase"
                  >
                    Lafal Niat Shalat Fardhu · 5 Waktu
                  </p>
                  <h2
                    style={{ color: "var(--tashrif-ink)" }}
                    className="font-display mt-0.5 text-base font-semibold sm:text-lg"
                  >
                    {activeIntention.name} ({activeIntention.rakaat})
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
                  style={{
                    border: "1px solid var(--tashrif-border-cell)",
                    backgroundColor: "var(--tashrif-paper)",
                    color: "var(--tashrif-text)",
                  }}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors hover:opacity-90"
                >
                  {copiedKey === `niat-${activeIntention.id}` ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>{copiedKey === `niat-${activeIntention.id}` ? "Tersalin" : "Salin Niat"}</span>
                </button>
              </div>

              <div className="p-4 sm:p-5">
                <div className="flex flex-wrap gap-1.5">
                  {SHALAT_INTENTIONS.map((item) => {
                    const active = item.id === activeIntention.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedShalatId(item.id)}
                        style={
                          active
                            ? {
                                backgroundColor: "var(--tashrif-btn-bg)",
                                color: "var(--tashrif-btn-text)",
                              }
                            : {
                                border: "1px solid var(--tashrif-border-cell)",
                                backgroundColor: "var(--tashrif-row-alt)",
                                color: "var(--tashrif-text)",
                              }
                        }
                        className="min-h-[38px] rounded-lg px-3 text-xs font-bold transition-colors"
                      >
                        {item.name.replace("Shalat ", "")} · {item.rakaat}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4">
                  <p
                    lang="ar"
                    dir="rtl"
                    style={{ color: "var(--tashrif-ink)" }}
                    className="arabic-reader-text text-right"
                  >
                    {activeIntention.arabic}
                  </p>
                </div>

                <div
                  style={{
                    borderTop: "1px dashed var(--tashrif-group-break)",
                    backgroundColor: "var(--tashrif-wazan-bg)",
                  }}
                  className="mt-3.5 space-y-1.5 rounded-lg p-3.5"
                >
                  <p
                    style={{ color: "var(--tashrif-muted)" }}
                    className="latin-reader-text italic"
                  >
                    {activeIntention.latin}
                  </p>
                  <p
                    style={{ color: "var(--tashrif-text)" }}
                    className="prose-reader-text font-medium"
                  >
                    {activeIntention.translation}
                  </p>
                </div>
              </div>
            </div>

            <details
              style={{
                backgroundColor: "var(--tashrif-paper)",
                border: "1px solid var(--tashrif-border-cell)",
                borderRadius: "0.75rem",
              }}
              className="overflow-hidden shadow-xs"
            >
              <summary
                style={{
                  backgroundColor: "var(--tashrif-wazan-bg)",
                  color: "var(--tashrif-ink)",
                }}
                className="cursor-pointer list-none px-4 py-3 text-xs font-bold sm:text-sm"
              >
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 style={{ color: "var(--tashrif-accent)" }} className="h-4 w-4 shrink-0" />
                  <span>Ringkasan 17 Rukun Shalat · Kitab Safinatun Najah (Ketuk untuk melihat)</span>
                </span>
              </summary>
              <div
                style={{
                  borderTop: "1px solid var(--tashrif-border-cell)",
                  color: "var(--tashrif-text)",
                }}
                className="p-4"
              >
                <ol className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-xs leading-relaxed sm:grid-cols-2">
                  {SHALAT_RUKUN.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span
                        style={{ color: "var(--tashrif-accent)" }}
                        className="font-mono-tabular mt-0.5 font-bold"
                      >
                        {String(idx + 1).padStart(2, "0")}.
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
                <p
                  style={{
                    borderTop: "1px dashed var(--tashrif-group-break)",
                    color: "var(--tashrif-muted)",
                  }}
                  className="mt-3 pt-2.5 text-[11px] leading-relaxed"
                >
                  <strong style={{ color: "var(--tashrif-accent)" }}>Catatan Safinatun Najah:</strong>{" "}
                  Pada mazhab Syafi&apos;i, 4 thuma&apos;ninah (saat ruku&apos;, i&apos;tidal, sujud, dan duduk di antara dua sujud) dihitung sebagai rukun tersendiri sehingga berjumlah <strong>17 rukun</strong>.
                </p>
              </div>
            </details>
          </section>
        )}

        {/* Quick Jump Step Index */}
        <div
          style={{
            backgroundColor: "var(--tashrif-paper)",
            border: "1px solid var(--tashrif-border-cell)",
            borderRadius: "0.75rem",
          }}
          className="p-2.5 shadow-xs"
        >
          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
            {activeSteps.map((step) => (
              <a
                key={step.id}
                href={`#${step.id}`}
                style={{
                  border: "1px solid var(--tashrif-border-cell)",
                  backgroundColor: "var(--tashrif-row-alt)",
                  color: "var(--tashrif-text)",
                }}
                className="inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors hover:opacity-85"
              >
                <span
                  style={{ color: "var(--tashrif-accent)" }}
                  className="font-mono-tabular font-bold"
                >
                  {step.number}
                </span>
                <span className="max-w-[175px] truncate">{step.title}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Step-by-Step Detailed Kitab Cards */}
        <div className="space-y-4">
          {activeSteps.map((step) => {
            const isCopied = copiedKey === step.id;
            return (
              <article
                key={step.id}
                id={step.id}
                style={{
                  backgroundColor: "var(--tashrif-paper)",
                  border: "4px double var(--tashrif-border-strong)",
                  borderRadius: "0.75rem",
                }}
                className="scroll-mt-20 overflow-hidden shadow-xs"
              >
                {/* Tinted Kitab Header Band */}
                <div
                  style={{
                    backgroundColor: "var(--tashrif-wazan-bg)",
                    borderBottom: "1px solid var(--tashrif-border-cell)",
                  }}
                  className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-3 sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <span
                      style={{ color: "var(--tashrif-accent)" }}
                      className="block font-mono-tabular text-[11px] font-bold tracking-wider uppercase"
                    >
                      URUTAN {step.number} · {step.badge}
                    </span>
                    <h3
                      style={{ color: "var(--tashrif-ink)" }}
                      className="font-display mt-0.5 text-base font-semibold sm:text-lg"
                    >
                      {step.title}
                    </h3>
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
                      style={{
                        border: "1px solid var(--tashrif-border-cell)",
                        backgroundColor: "var(--tashrif-paper)",
                        color: "var(--tashrif-text)",
                      }}
                      className="inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition-colors hover:opacity-90"
                    >
                      {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{isCopied ? "Tersalin" : "Salin Bacaan"}</span>
                    </button>
                  )}
                </div>

                {/* Body */}
                <div className="p-4 sm:p-5">
                  <p
                    style={{ color: "var(--tashrif-text)" }}
                    className="prose-reader-text"
                  >
                    {step.summary}
                  </p>

                  {step.movement && (
                    <div
                      style={{
                        border: "1px solid var(--tashrif-border-cell)",
                        backgroundColor: "var(--tashrif-row-alt)",
                        color: "var(--tashrif-text)",
                      }}
                      className="mt-2.5 rounded-lg px-3.5 py-2.5 text-xs leading-relaxed"
                    >
                      <strong style={{ color: "var(--tashrif-accent)" }}>Tatacara / Gerakan:</strong>{" "}
                      {step.movement}
                    </div>
                  )}

                  {step.arabic && (
                    <div className="mt-4">
                      <p
                        lang="ar"
                        dir="rtl"
                        style={{ color: "var(--tashrif-ink)" }}
                        className="arabic-reader-text whitespace-pre-wrap text-right"
                      >
                        {step.arabic}
                      </p>

                      {(step.latin || step.translation) && (
                        <div
                          style={{
                            borderTop: "1px dashed var(--tashrif-group-break)",
                            backgroundColor: "var(--tashrif-wazan-bg)",
                          }}
                          className="mt-3 space-y-1.5 rounded-lg p-3.5"
                        >
                          {step.latin && (
                            <p
                              style={{ color: "var(--tashrif-muted)" }}
                              className="latin-reader-text italic"
                            >
                              {step.latin}
                            </p>
                          )}
                          {step.translation && (
                            <p
                              style={{ color: "var(--tashrif-text)" }}
                              className="prose-reader-text font-medium"
                            >
                              {step.translation}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {step.note && (
                    <div
                      style={{
                        borderTop: "1px dotted var(--tashrif-border-cell)",
                        color: "var(--tashrif-muted)",
                      }}
                      className="mt-3 pt-2.5 text-xs leading-relaxed"
                    >
                      <strong style={{ color: "var(--tashrif-accent)" }}>Catatan:</strong>{" "}
                      {step.note}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <FooterDisclaimer variant="compact" />
      </div>
    </div>
  );
};
