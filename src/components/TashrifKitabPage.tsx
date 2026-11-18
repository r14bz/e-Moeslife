import React, { useState } from "react";
import { ArrowLeft, Maximize2, Minimize2 } from "lucide-react";
import { KitabTashrifReader } from "./KitabTashrifReader";
import { TashrifLughawiView } from "./TashrifLughawiView";
import { FooterDisclaimer } from "./FooterDisclaimer";

interface TashrifKitabPageProps {
  initialTab?: "istilahi" | "lughawi";
  focusMode: boolean;
  onToggleFocus: () => void;
  onBackToLibrary: () => void;
}

export const TashrifKitabPage: React.FC<TashrifKitabPageProps> = ({
  initialTab = "istilahi",
  focusMode,
  onToggleFocus,
  onBackToLibrary,
}) => {
  const [activeTab, setActiveTab] = useState<"istilahi" | "lughawi">(initialTab);

  return (
    <div style={{ backgroundColor: "var(--tashrif-bg)", minHeight: "100vh" }}>
      {/* Bar atas e-Moeslife (Perpustakaan & Mode Fokus) di luar bingkai kitab */}
      <div className="mx-auto flex max-w-[908px] items-center justify-between gap-2 px-2 pt-2.5 pb-1">
        <button
          type="button"
          onClick={onBackToLibrary}
          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[#dce4df] bg-white px-3 text-xs font-semibold text-[#174231] shadow-xs transition-colors hover:bg-[#f4f7f5] dark:border-slate-800 dark:bg-[#111A27] dark:text-slate-200 dark:hover:bg-[#172334]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Perpustakaan</span>
        </button>

        <button
          type="button"
          onClick={onToggleFocus}
          aria-pressed={focusMode}
          className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors ${
            focusMode
              ? "border-[#134a35] bg-[#134a35] text-white dark:border-[#E2B354] dark:bg-[#E2B354] dark:text-[#0B111A]"
              : "border-[#dce4df] bg-white text-[#174231] hover:bg-[#f4f7f5] dark:border-slate-800 dark:bg-[#111A27] dark:text-slate-200"
          }`}
        >
          {focusMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          <span>{focusMode ? "Keluar Fokus" : "Mode Fokus"}</span>
        </button>
      </div>

      {/* Navigasi Tab Kitab (selaras dengan tema e-Moeslife, tanpa ubah tata letak) */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          padding: "10px",
          backgroundColor: "var(--tashrif-panel-bg)",
          justifyContent: "center",
          marginTop: "6px",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("istilahi")}
          style={{
            padding: "8px 16px",
            fontWeight: 700,
            borderRadius: "6px",
            border: `1px solid ${activeTab === "istilahi" ? "var(--tashrif-tab-active-border)" : "var(--tashrif-panel-border)"}`,
            backgroundColor: activeTab === "istilahi" ? "var(--tashrif-tab-active-bg)" : "var(--tashrif-panel-chip-bg)",
            color: activeTab === "istilahi" ? "var(--tashrif-tab-active-text)" : "var(--tashrif-panel-text)",
            cursor: "pointer",
          }}
        >
          Tashrif Istilahi (31 Bab)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("lughawi")}
          style={{
            padding: "8px 16px",
            fontWeight: 700,
            borderRadius: "6px",
            border: `1px solid ${activeTab === "lughawi" ? "var(--tashrif-tab-active-border)" : "var(--tashrif-panel-border)"}`,
            backgroundColor: activeTab === "lughawi" ? "var(--tashrif-tab-active-bg)" : "var(--tashrif-panel-chip-bg)",
            color: activeTab === "lughawi" ? "var(--tashrif-tab-active-text)" : "var(--tashrif-panel-text)",
            cursor: "pointer",
          }}
        >
          Tashrif Lughawi (15 Bab)
        </button>
      </div>

      {/* Konten Kitab (tata letak asli dipertahankan utuh 100%) */}
      {activeTab === "istilahi" ? <KitabTashrifReader /> : <TashrifLughawiView />}

      <div className="mx-auto max-w-[900px] px-3 pb-6">
        <FooterDisclaimer variant="compact" />
      </div>
    </div>
  );
};

export default TashrifKitabPage;
