import React from "react";
import { ArrowLeft, Maximize2, Minimize2 } from "lucide-react";
import { KitabJurumiyahReader } from "./KitabJurumiyahReader";
import { FooterDisclaimer } from "./FooterDisclaimer";

interface JurumiyahKitabPageProps {
  initialBabId?: number;
  focusMode: boolean;
  onToggleFocus: () => void;
  onBackToLibrary: () => void;
}

export const JurumiyahKitabPage: React.FC<JurumiyahKitabPageProps> = ({
  initialBabId = 1,
  focusMode,
  onToggleFocus,
  onBackToLibrary,
}) => {
  return (
    <div style={{ backgroundColor: "var(--tashrif-bg)", minHeight: "100vh" }}>
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-3 pt-2.5 pb-1">
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

      <KitabJurumiyahReader initialBabId={initialBabId} />

      <div className="mx-auto max-w-2xl px-3 pb-6">
        <FooterDisclaimer variant="compact" />
      </div>
    </div>
  );
};

export default JurumiyahKitabPage;
