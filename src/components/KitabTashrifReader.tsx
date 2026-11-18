import React, { useState } from "react";
import { KITAB_TASHRIF_DATA } from "../data/kitabTashrifData";
import { COLS_11, COLS_12 } from "../types/tashrif";
import { findIlalNote } from "../data/ilalNotes";

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
  const [selectedCell, setSelectedCell] = useState<{
    arab: string;
    arti: string;
    shighat: string;
    wazan: string;
    isWazanRow: boolean;
  } | null>(null);

  const currentBab = KITAB_TASHRIF_DATA[currentBabIndex] || KITAB_TASHRIF_DATA[0];
  const fullHeaders = currentBab.hasIsimAlat ? COLS_12 : COLS_11;
  const shortHeaders = currentBab.hasIsimAlat ? SHORT_HEADERS_12 : SHORT_HEADERS_11;
  const colWidths = currentBab.hasIsimAlat ? COL_WIDTHS_12 : COL_WIDTHS_11;

  const handleSelectBab = (idx: number) => {
    setCurrentBabIndex(idx);
    setSelectedCell(null);
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
    <div style={{ minHeight: "100vh", backgroundColor: "var(--tashrif-bg)", color: "var(--tashrif-text)", padding: "10px 4px 110px 4px", boxSizing: "border-box" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto 10px auto", display: "flex", flexDirection: "column", gap: "8px" }}>
        <select value={currentBabIndex} onChange={(e) => handleSelectBab(Number(e.target.value))} style={{ width: "100%", backgroundColor: "var(--tashrif-control-bg)", color: "var(--tashrif-text)", border: "2px solid var(--tashrif-border-strong)", borderRadius: "6px", padding: "8px 10px", fontSize: "13px", fontWeight: 700 }}>
          {KITAB_TASHRIF_DATA.map((bab, index) => (
            <option key={bab.id} value={index}>{index + 1}. {bab.judulIndo}</option>
          ))}
        </select>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          <button disabled={currentBabIndex === 0} onClick={() => handleSelectBab(currentBabIndex - 1)} style={{ flex: 1, padding: "7px 10px", fontSize: "12px", fontWeight: 700, backgroundColor: currentBabIndex === 0 ? "var(--tashrif-btn-disabled)" : "var(--tashrif-btn-bg)", color: currentBabIndex === 0 ? "var(--tashrif-btn-disabled-text)" : "var(--tashrif-btn-text)", border: "none", borderRadius: "5px", cursor: currentBabIndex === 0 ? "not-allowed" : "pointer" }}>&larr; Sebelumnya</button>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--tashrif-muted)", padding: "0 6px" }}>{currentBabIndex + 1} / {KITAB_TASHRIF_DATA.length}</span>
          <button disabled={currentBabIndex === KITAB_TASHRIF_DATA.length - 1} onClick={() => handleSelectBab(currentBabIndex + 1)} style={{ flex: 1, padding: "7px 10px", fontSize: "12px", fontWeight: 700, backgroundColor: currentBabIndex === KITAB_TASHRIF_DATA.length - 1 ? "var(--tashrif-btn-disabled)" : "var(--tashrif-btn-bg)", color: currentBabIndex === KITAB_TASHRIF_DATA.length - 1 ? "var(--tashrif-btn-disabled-text)" : "var(--tashrif-btn-text)", border: "none", borderRadius: "5px", cursor: currentBabIndex === KITAB_TASHRIF_DATA.length - 1 ? "not-allowed" : "pointer" }}>Selanjutnya &rarr;</button>
        </div>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", border: "4px double var(--tashrif-border-strong)", backgroundColor: "var(--tashrif-paper)", padding: "8px 3px", boxShadow: "0 2px 6px rgba(16, 61, 44, 0.10)" }}>
        <div style={{ textAlign: "center", borderBottom: "2px solid var(--tashrif-border-strong)", paddingBottom: "6px", marginBottom: "8px" }}>
          <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 700, color: "var(--tashrif-accent)" }}>{currentBab.kategori}</div>
          <h2 dir="rtl" style={{ fontFamily: "Amiri, serif", fontSize: "clamp(1.1rem, 4.2vw, 1.55rem)", fontWeight: 700, color: "var(--tashrif-ink)", margin: "2px 0", lineHeight: 1.5 }}>{currentBab.judulArab}</h2>
          <p style={{ fontSize: "11px", color: "var(--tashrif-muted)", margin: 0, fontWeight: 600 }}>{currentBab.judulIndo}</p>
        </div>

        <div style={{ width: "100%", overflow: "hidden" }}>
          <table dir="rtl" style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", textAlign: "center", border: "1.5px solid var(--tashrif-border-strong)" }}>
            <colgroup>
              {colWidths.map((w, idx) => (<col key={idx} style={{ width: w }} />))}
            </colgroup>
            <thead>
              <tr style={{ backgroundColor: "var(--tashrif-thead-bg)", borderBottom: "2px solid var(--tashrif-border-strong)" }}>
                {shortHeaders.map((label, colIdx) => (
                  <th key={colIdx} title={fullHeaders[colIdx]} style={{ padding: "6px 0px", borderLeft: colIdx === shortHeaders.length - 1 ? "none" : "1px solid var(--tashrif-border-cell)", fontWeight: 700, color: "var(--tashrif-text)", fontSize: "clamp(0.38rem, 1.22vw, 0.68rem)", letterSpacing: "-0.2px", lineHeight: 1.1, verticalAlign: "middle", whiteSpace: "nowrap", overflow: "hidden" }}>{label}</th>
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
                    const isLongSingleWord = !hasMultipleWords && arab.length >= 9;
                    return (
                      <td key={colIdx} onClick={() => setSelectedCell({ arab, arti, shighat: fullHeaders[colIdx] || "-", wazan: findNearestWazan(rowIdx, colIdx), isWazanRow: Boolean(row.isWazan) })} style={{ padding: "5px 0.5px", borderLeft: colIdx === row.items.length - 1 ? "none" : "1px solid var(--tashrif-border-cell)", backgroundColor: isSelected ? "var(--tashrif-cell-selected)" : undefined, cursor: "pointer", verticalAlign: "middle", userSelect: "none", overflow: "hidden" }}>
                        <div style={{ fontFamily: "Amiri, serif", color: "var(--tashrif-ink)", fontSize: hasMultipleWords ? "clamp(0.50rem, 1.7vw, 0.85rem)" : isLongSingleWord ? "clamp(0.55rem, 2.05vw, 0.96rem)" : isShortParticle ? "clamp(0.56rem, 2.0vw, 0.92rem)" : "clamp(0.64rem, 2.45vw, 1.12rem)", lineHeight: hasMultipleWords ? 1.2 : 1.45, whiteSpace: hasMultipleWords ? "normal" : "nowrap", wordBreak: "keep-all" }}>{arab}</div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCell && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, backgroundColor: "var(--tashrif-panel-bg)", color: "var(--tashrif-panel-text)", padding: "12px 14px", borderTop: "2px solid var(--tashrif-panel-border)", boxShadow: "0 -3px 10px rgba(0,0,0,0.25)", zIndex: 50 }}>
          <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--tashrif-panel-sub)" }}>
                <span style={{ padding: "2px 7px", backgroundColor: "var(--tashrif-panel-chip-bg)", borderRadius: "4px", fontWeight: 700, color: "var(--tashrif-panel-bright)" }}>{selectedCell.shighat}</span>
                {!selectedCell.isWazanRow && (
                  <span>- Wazan: <strong style={{ fontFamily: "Amiri, serif", fontSize: "15px", color: "var(--tashrif-panel-bright)" }}>{selectedCell.wazan}</strong></span>
                )}
              </div>
              <div style={{ fontSize: "13px", fontWeight: 600, marginTop: "4px" }}>{selectedCell.arti}</div>
              {(() => {
                const ilal = findIlalNote(selectedCell.arab);
                if (!ilal) return null;
                return (
                  <div style={{ marginTop: "6px", padding: "6px 8px", backgroundColor: "var(--tashrif-ilal-bg)", borderRight: "3px solid var(--tashrif-ilal-accent)", borderRadius: "4px", fontSize: "11px", lineHeight: 1.4, color: "var(--tashrif-panel-text)" }}>
                    <div style={{ fontWeight: 700, color: "var(--tashrif-ilal-accent)", marginBottom: "2px" }}>
                      Catatan I'lal ({ilal.kaidah}) - Asal: <span dir="rtl" style={{ fontFamily: "Amiri, serif", fontSize: "14px" }}>{ilal.asal}</span>
                    </div>
                    <div>{ilal.penjelasan}</div>
                  </div>
                );
              })()}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
              <span dir="rtl" style={{ fontFamily: "Amiri, serif", fontSize: "24px", fontWeight: 700, color: "var(--tashrif-panel-bright)" }}>{selectedCell.arab}</span>
              <button onClick={() => setSelectedCell(null)} style={{ padding: "5px 10px", fontSize: "11px", fontWeight: 700, backgroundColor: "var(--tashrif-panel-chip-bg)", color: "var(--tashrif-panel-text)", border: "1px solid var(--tashrif-panel-border)", borderRadius: "4px", cursor: "pointer" }}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default KitabTashrifReader;