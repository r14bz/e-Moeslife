import React, { useRef, useState } from "react";
import { KITAB_TASHRIF_DATA } from "../data/kitabTashrifData";
import { COLS_11, COLS_12 } from "../types/tashrif";
import { findIlalNote } from "../data/ilalNotes";
import { ThemedSelect } from "./ThemedSelect";
import { FloatingPageNav } from "./FloatingPageNav";

const SHORT_HEADERS_12 = [
  "Madhi", "Mudhari'", "Mashdar", "M. Mim",
  "Dhomir", "Fa'il", "Isyarah", "Maf'ul",
  "Amr", "Nahi", "Zaman", "Alat"
];
const SHORT_HEADERS_11 = SHORT_HEADERS_12.slice(0, 11);

const COL_WIDTHS_12 = [
  "8.1%", "8.9%", "9.6%", "9.2%", "6.3%", "8.3%", "6.9%", "8.7%", "7.9%", "9.5%", "8.3%", "8.3%"
];
const COL_WIDTHS_11 = [
  "8.9%", "9.7%", "10.5%", "10.0%", "6.7%", "9.1%", "7.3%", "9.5%", "8.5%", "10.5%", "9.3%"
];

export const KitabTashrifReader: React.FC = () => {
  const [currentBabIndex, setCurrentBabIndex] = useState<number>(0);
  const [turnDir, setTurnDir] = useState<"next" | "prev" | "fade">("fade");
  const [selectedCell, setSelectedCell] = useState<{
    arab: string;
    arti: string;
    shighat: string;
    wazan: string;
    isWazanRow: boolean;
  } | null>(null);

  const readingCardRef = useRef<HTMLDivElement | null>(null);

  const currentBab = KITAB_TASHRIF_DATA[currentBabIndex] || KITAB_TASHRIF_DATA[0];
  const fullHeaders = currentBab.hasIsimAlat ? COLS_12 : COLS_11;
  const shortHeaders = currentBab.hasIsimAlat ? SHORT_HEADERS_12 : SHORT_HEADERS_11;
  const colWidths = currentBab.hasIsimAlat ? COL_WIDTHS_12 : COL_WIDTHS_11;

  const handleSelectBab = (idx: number) => {
    setTurnDir(idx > currentBabIndex ? "next" : idx < currentBabIndex ? "prev" : "fade");
    setCurrentBabIndex(idx);
    setSelectedCell(null);
    window.requestAnimationFrame(() => {
      readingCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const findNearestWazan = (rowIndex: number, colIndex: number): string => {
    for (let i = rowIndex; i >= 0; i--) {
      if (currentBab.rows[i]?.isWazan && currentBab.rows[i]?.items[colIndex]) {
        return currentBab.rows[i].items[colIndex][0];
      }
    }
    return "-";
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--tashrif-bg)", color: "var(--tashrif-text)", padding: selectedCell ? "10px 3px 110px 3px" : "10px 3px 24px 3px", boxSizing: "border-box" }}>
      <div style={{ maxWidth: "980px", margin: "0 auto 10px auto" }}>
        <ThemedSelect
          className="w-full"
          ariaLabel="Pilih Bab Tashrif Istilahi"
          kickerLabel="Daftar Bab Tashrif Istilahi"
          value={currentBabIndex}
          onChange={(val) => handleSelectBab(Number(val))}
          options={KITAB_TASHRIF_DATA.map((bab, index) => ({
            value: index,
            label: `${index + 1}. ${bab.judulIndo}`,
            sublabel: bab.kategori,
          }))}
        />
      </div>

      <div key={currentBabIndex} ref={readingCardRef} className={`page-enter-${turnDir}`} style={{ maxWidth: "980px", margin: "0 auto", scrollMarginTop: "5rem", border: "4px double var(--tashrif-border-strong)", backgroundColor: "var(--tashrif-paper)", padding: "8px 2px", boxShadow: "0 2px 6px rgba(16, 61, 44, 0.10)" }}>
        <div style={{ textAlign: "center", borderBottom: "2px solid var(--tashrif-border-strong)", paddingBottom: "6px", marginBottom: "8px" }}>
          <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 700, color: "var(--tashrif-accent)" }}>{currentBab.kategori}</div>
          <h2 dir="rtl" style={{ fontFamily: "Amiri, serif", fontSize: "clamp(1.28rem, 4.6vw, 1.8rem)", fontWeight: 700, color: "var(--tashrif-ink)", margin: "2px 0", lineHeight: 1.55 }}>{currentBab.judulArab}</h2>
          <p style={{ fontSize: "12.5px", color: "var(--tashrif-muted)", margin: 0, fontWeight: 600 }}>{currentBab.judulIndo}</p>
        </div>

        <div style={{ width: "100%", overflow: "hidden" }}>
          <table dir="rtl" style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", textAlign: "center", border: "1.5px solid var(--tashrif-border-strong)" }}>
            <colgroup>
              {colWidths.map((w, idx) => (<col key={idx} style={{ width: w }} />))}
            </colgroup>
            <thead>
              <tr style={{ backgroundColor: "var(--tashrif-thead-bg)", borderBottom: "2px solid var(--tashrif-border-strong)" }}>
                {shortHeaders.map((label, colIdx) => (
                  <th key={colIdx} title={fullHeaders[colIdx]} style={{ padding: "6px 0.5px", borderLeft: colIdx === shortHeaders.length - 1 ? "none" : "1px solid var(--tashrif-border-cell)", fontWeight: 700, color: "var(--tashrif-text)", fontSize: "clamp(0.45rem, 1.38vw, 0.78rem)", letterSpacing: "-0.2px", lineHeight: 1.15, verticalAlign: "middle", whiteSpace: "nowrap", overflow: "hidden" }}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentBab.rows.map((row, rowIdx) => (
                <tr key={rowIdx} style={{ backgroundColor: row.isWazan ? "var(--tashrif-wazan-bg)" : rowIdx % 2 === 0 ? "var(--tashrif-paper)" : "var(--tashrif-row-alt)", borderTop: row.isWazan ? "1.5px solid var(--tashrif-border-strong)" : undefined, borderBottom: "1px solid var(--tashrif-border-cell)", fontWeight: row.isWazan ? 700 : 400 }}>
                  {row.items.map((cell, colIdx) => {
                    const [arab, arti] = cell;
                    const isSelected = selectedCell?.arab === arab && selectedCell?.shighat === fullHeaders[colIdx];
                    const isShortParticle = colIdx === 4 || colIdx === 6;
                    const hasMultipleWords = arab.includes(" ");
                    const baseLen = arab.replace(/[\u064B-\u065F\u0670]/g, "").length;
                    const isVeryLongSingle = !hasMultipleWords && baseLen >= 7;
                    const isMediumSingle = !hasMultipleWords && baseLen >= 5;
                    const cellFontSize = hasMultipleWords
                      ? "clamp(0.62rem, 2.05vw, 1.02rem)"
                      : isShortParticle
                      ? "clamp(0.68rem, 2.4vw, 1.12rem)"
                      : isVeryLongSingle
                      ? "clamp(0.68rem, 2.35vw, 1.12rem)"
                      : isMediumSingle
                      ? "clamp(0.74rem, 2.6vw, 1.24rem)"
                      : "clamp(0.80rem, 2.85vw, 1.36rem)";
                    return (
                      <td key={colIdx} onClick={() => setSelectedCell({ arab, arti, shighat: fullHeaders[colIdx] || "-", wazan: findNearestWazan(rowIdx, colIdx), isWazanRow: Boolean(row.isWazan) })} style={{ padding: "6px 1px", borderLeft: colIdx === row.items.length - 1 ? "none" : "1px solid var(--tashrif-border-cell)", backgroundColor: isSelected ? "var(--tashrif-cell-selected)" : undefined, cursor: "pointer", verticalAlign: "middle", userSelect: "none", overflow: "hidden" }}>
                        <div style={{ fontFamily: "Amiri, serif", color: "var(--tashrif-ink)", fontSize: cellFontSize, lineHeight: hasMultipleWords ? 1.35 : 1.55, whiteSpace: hasMultipleWords ? "normal" : "nowrap", wordBreak: "keep-all" }}>{arab}</div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <FloatingPageNav
        maxWidthClass="max-w-[980px]"
        hidden={Boolean(selectedCell)}
        onPrev={() => handleSelectBab(currentBabIndex - 1)}
        onNext={() => handleSelectBab(currentBabIndex + 1)}
        canPrev={currentBabIndex > 0}
        canNext={currentBabIndex < KITAB_TASHRIF_DATA.length - 1}
        centerText={`${currentBabIndex + 1} / ${KITAB_TASHRIF_DATA.length}`}
        ariaLabel="Navigasi antar bab Tashrif Istilahi"
      />

      {selectedCell && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, backgroundColor: "var(--tashrif-panel-bg)", color: "var(--tashrif-panel-text)", padding: "12px 14px", borderTop: "2px solid var(--tashrif-panel-border)", boxShadow: "0 -3px 10px rgba(0,0,0,0.25)", zIndex: 50 }}>
          <div style={{ maxWidth: "980px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--tashrif-panel-sub)" }}>
                <span style={{ padding: "2px 7px", backgroundColor: "var(--tashrif-panel-chip-bg)", borderRadius: "4px", fontWeight: 700, color: "var(--tashrif-panel-bright)" }}>{selectedCell.shighat}</span>
                {!selectedCell.isWazanRow && (
                  <span>- Wazan: <strong style={{ fontFamily: "Amiri, serif", fontSize: "16px", color: "var(--tashrif-panel-bright)" }}>{selectedCell.wazan}</strong></span>
                )}
              </div>
              <div style={{ fontSize: "14px", fontWeight: 600, marginTop: "4px" }}>{selectedCell.arti}</div>
              {(() => {
                const ilal = findIlalNote(selectedCell.arab);
                if (!ilal) return null;
                return (
                  <div style={{ marginTop: "6px", padding: "6px 8px", backgroundColor: "var(--tashrif-ilal-bg)", borderRight: "3px solid var(--tashrif-ilal-accent)", borderRadius: "4px", fontSize: "12px", lineHeight: 1.45, color: "var(--tashrif-panel-text)" }}>
                    <div style={{ fontWeight: 700, color: "var(--tashrif-ilal-accent)", marginBottom: "2px" }}>
                      Catatan I'lal ({ilal.kaidah}) - Asal: <span dir="rtl" style={{ fontFamily: "Amiri, serif", fontSize: "15px" }}>{ilal.asal}</span>
                    </div>
                    <div>{ilal.penjelasan}</div>
                  </div>
                );
              })()}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
              <span dir="rtl" style={{ fontFamily: "Amiri, serif", fontSize: "28px", fontWeight: 700, color: "var(--tashrif-panel-bright)" }}>{selectedCell.arab}</span>
              <button onClick={() => setSelectedCell(null)} style={{ padding: "6px 11px", fontSize: "12px", fontWeight: 700, backgroundColor: "var(--tashrif-panel-chip-bg)", color: "var(--tashrif-panel-text)", border: "1px solid var(--tashrif-panel-border)", borderRadius: "4px", cursor: "pointer" }}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default KitabTashrifReader;