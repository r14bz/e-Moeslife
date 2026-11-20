import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface FloatingPageNavProps {
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
  centerText: string;
  prevLabel?: string;
  nextLabel?: string;
  ariaLabel?: string;
  onCenterClick?: () => void;
  centerAriaLabel?: string;
  extraCenterButton?: React.ReactNode;
  maxWidthClass?: string;
  hidden?: boolean;
}

export const FloatingPageNav: React.FC<FloatingPageNavProps> = ({
  onPrev,
  onNext,
  canPrev,
  canNext,
  centerText,
  prevLabel = "Sebelumnya",
  nextLabel = "Selanjutnya",
  ariaLabel = "Navigasi antar halaman",
  onCenterClick,
  centerAriaLabel = "Buka daftar halaman",
  extraCenterButton,
  maxWidthClass = "",
  hidden = false,
}) => {
  if (hidden) return null;

  return (
    <div
      className={`pointer-events-none sticky bottom-0 z-20 mt-4 ${
        maxWidthClass ? `mx-auto w-full ${maxWidthClass}` : "w-full"
      }`}
    >
      {/* Frosted gradient backdrop so covered reading content blurs cleanly */}
      <div
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(to top, var(--tashrif-scrim-strong) 42%, var(--tashrif-scrim-soft) 78%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to top, black 64%, transparent 100%)",
          maskImage: "linear-gradient(to top, black 64%, transparent 100%)",
        }}
        className="pointer-events-none absolute -inset-x-3 -top-6 bottom-0 backdrop-blur-md sm:-inset-x-4"
      />

      <nav
        aria-label={ariaLabel}
        style={{
          border: "1.5px solid var(--tashrif-floating-border)",
          backgroundColor: "var(--tashrif-floating-bg)",
          boxShadow: "var(--tashrif-floating-shadow)",
        }}
        className="pointer-events-auto relative mb-2.5 flex items-center justify-between gap-2 rounded-2xl p-1.5 backdrop-blur-xl sm:mb-3 sm:p-2"
      >
        <button
          type="button"
          disabled={!canPrev}
          onClick={onPrev}
          style={{
            border: "1px solid var(--tashrif-border-cell)",
            backgroundColor: "var(--tashrif-paper)",
            color: "var(--tashrif-text)",
          }}
          className="inline-flex min-h-[42px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-bold whitespace-nowrap transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" />
          <span className="truncate">{prevLabel}</span>
        </button>

        {extraCenterButton ? (
          extraCenterButton
        ) : onCenterClick ? (
          <button
            type="button"
            onClick={onCenterClick}
            aria-label={centerAriaLabel}
            style={{ color: "var(--tashrif-muted)" }}
            className="font-mono-tabular inline-flex min-h-[42px] shrink-0 items-center justify-center rounded-xl px-2.5 text-xs font-bold lg:cursor-default"
          >
            {centerText}
          </button>
        ) : (
          <span
            style={{ color: "var(--tashrif-muted)" }}
            className="font-mono-tabular shrink-0 px-2 text-xs font-bold"
          >
            {centerText}
          </span>
        )}

        <button
          type="button"
          disabled={!canNext}
          onClick={onNext}
          style={{
            backgroundColor: "var(--tashrif-btn-bg)",
            color: "var(--tashrif-btn-text)",
          }}
          className="inline-flex min-h-[42px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-bold whitespace-nowrap transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="truncate">{nextLabel}</span>
          <ChevronRight className="h-4 w-4 shrink-0" />
        </button>
      </nav>
    </div>
  );
};

export default FloatingPageNav;
