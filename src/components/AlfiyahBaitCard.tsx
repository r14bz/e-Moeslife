import React from "react";
import type { AlfiyahBait } from "../types/alfiyah";

interface AlfiyahBaitCardProps {
  bait: AlfiyahBait;
  isVisible: boolean;
  onToggle: (id: number) => void;
}

export const AlfiyahBaitCard: React.FC<AlfiyahBaitCardProps> = ({
  bait,
  isVisible,
  onToggle,
}) => {
  return (
    <div
      style={{ borderBottom: "1px solid var(--tashrif-border-cell)" }}
      className="last:border-b-0"
    >
      {/* Baris Tabel 2 Kolom Bersih (Kanan: Shadr, Kiri: Ajuz) */}
      <button
        type="button"
        onClick={() => onToggle(bait.id)}
        aria-expanded={isVisible}
        dir="rtl"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          width: "100%",
          textAlign: "center",
          background: "transparent",
          border: "none",
        }}
        className="cursor-pointer items-stretch transition-colors hover:bg-emerald-900/5 dark:hover:bg-amber-400/5"
      >
        {/* Kolom Kanan: Shadr */}
        <div
          style={{
            borderLeft: "1px solid var(--tashrif-border-cell)",
            color: "var(--tashrif-ink)",
            fontSize: "var(--arabic-reader-size)",
            lineHeight: "1.9",
          }}
          className="flex h-full items-center justify-center px-2 py-2.5 text-center font-arabic"
        >
          {bait.shadr}
        </div>

        {/* Kolom Kiri: Ajuz */}
        <div
          style={{
            color: "var(--tashrif-ink)",
            fontSize: "var(--arabic-reader-size)",
            lineHeight: "1.9",
          }}
          className="flex h-full items-center justify-center px-2 py-2.5 text-center font-arabic"
        >
          {bait.ajuz}
        </div>
      </button>

      {/* Baris Terjemahan (Show/Hide saat baris diketuk) */}
      {isVisible && (
        <div
          style={{
            borderTop: "1px dashed var(--tashrif-group-break)",
            backgroundColor: "var(--tashrif-wazan-bg)",
            color: "var(--tashrif-text)",
          }}
          className="px-3.5 py-2.5 text-xs leading-relaxed sm:text-[13px]"
        >
          <span
            style={{ color: "var(--tashrif-accent)" }}
            className="mr-1.5 font-mono-tabular font-bold"
          >
            [{bait.id}]
          </span>
          {bait.terjemahan}
        </div>
      )}
    </div>
  );
};

export default AlfiyahBaitCard;
