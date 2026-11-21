import React, { useState } from "react";
import { KitabTashrifReader } from "./KitabTashrifReader";
import { TashrifLughawiView } from "./TashrifLughawiView";
import { KitabTopBar } from "./KitabTopBar";
import { FooterDisclaimer } from "./FooterDisclaimer";

interface TashrifKitabPageProps {
  initialTab?: "istilahi" | "lughawi";
  focusMode: boolean;
  onToggleFocus: () => void;
  onBackToLibrary: () => void;
  onGoHome: () => void;
}

export const TashrifKitabPage: React.FC<TashrifKitabPageProps> = ({
  initialTab = "istilahi",
  focusMode,
  onToggleFocus,
  onBackToLibrary,
  onGoHome,
}) => {
  const [activeTab, setActiveTab] = useState<"istilahi" | "lughawi">(initialTab);

  return (
    <div style={{ backgroundColor: "var(--tashrif-bg)", minHeight: "100vh" }}>
      {/* Bar atas e-Moeslife (Perpustakaan, Beranda & Mode Fokus) di luar bingkai kitab */}
      <KitabTopBar
        focusMode={focusMode}
        onToggleFocus={onToggleFocus}
        onBackToLibrary={onBackToLibrary}
        onGoHome={onGoHome}
        maxWidthClass="max-w-[988px]"
      />

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
      <div key={activeTab} className="panel-enter-fade">
        {activeTab === "istilahi" ? <KitabTashrifReader /> : <TashrifLughawiView />}
      </div>

      <div className="mx-auto max-w-[980px] px-3 pb-6">
        <FooterDisclaimer variant="compact" />
      </div>
    </div>
  );
};

export default TashrifKitabPage;
