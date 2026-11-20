import React from "react";
import { ArrowLeft, Home, Maximize2, Minimize2 } from "lucide-react";

interface KitabTopBarProps {
  focusMode: boolean;
  onToggleFocus: () => void;
  onBackToLibrary: () => void;
  onGoHome: () => void;
  maxWidthClass?: string;
}

export const KitabTopBar: React.FC<KitabTopBarProps> = ({
  focusMode,
  onToggleFocus,
  onBackToLibrary,
  onGoHome,
  maxWidthClass = "max-w-2xl",
}) => {
  return (
    <div
      className={`mx-auto flex ${maxWidthClass} flex-wrap items-center justify-between gap-2 px-3 pt-2.5 pb-1`}
    >
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={onBackToLibrary}
          style={{
            border: "1px solid var(--tashrif-border-cell)",
            backgroundColor: "var(--tashrif-paper)",
            color: "var(--tashrif-text)",
          }}
          className="inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold whitespace-nowrap shadow-xs transition-opacity hover:opacity-90 sm:px-3"
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
          <span>Perpustakaan</span>
        </button>

        <button
          type="button"
          onClick={onGoHome}
          style={{
            border: "1px solid var(--tashrif-border-cell)",
            backgroundColor: "var(--tashrif-paper)",
            color: "var(--tashrif-text)",
          }}
          className="inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold whitespace-nowrap shadow-xs transition-opacity hover:opacity-90 sm:px-3"
        >
          <Home className="h-3.5 w-3.5 shrink-0" />
          <span>Beranda</span>
        </button>
      </div>

      <button
        type="button"
        onClick={onToggleFocus}
        aria-pressed={focusMode}
        style={
          focusMode
            ? {
                backgroundColor: "var(--tashrif-btn-bg)",
                color: "var(--tashrif-btn-text)",
              }
            : {
                border: "1px solid var(--tashrif-border-cell)",
                backgroundColor: "var(--tashrif-paper)",
                color: "var(--tashrif-text)",
              }
        }
        className="inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold whitespace-nowrap shadow-xs transition-opacity hover:opacity-90 sm:px-3"
      >
        {focusMode ? (
          <Minimize2 className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <Maximize2 className="h-3.5 w-3.5 shrink-0" />
        )}
        <span>{focusMode ? "Keluar Fokus" : "Mode Fokus"}</span>
      </button>
    </div>
  );
};

export default KitabTopBar;
