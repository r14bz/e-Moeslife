import React, { useState } from 'react';
import { TASHRIF_LUGHAWI_DATA } from '../data/tashrifLughawiData';
import { findIlalNote } from '../data/ilalNotes';

export const TashrifLughawiView: React.FC = () => {
  const [currentBabIndex, setCurrentBabIndex] = useState<number>(0);
  const [selectedCell, setSelectedCell] = useState<{
    arab: string;
    rowArab: string;
    rowIndo: string;
    colArab: string;
    colIndo: string;
    direction: 'vertical' | 'horizontal';
  } | null>(null);

  const currentBab = TASHRIF_LUGHAWI_DATA[currentBabIndex] || TASHRIF_LUGHAWI_DATA[0];
  const colCount = currentBab.colHeadersArab.length;
  const labelColWidth = '14%';
  const dataColWidth = `${(86 / colCount).toFixed(2)}%`;

  const handleSelectBab = (idx: number) => {
    setCurrentBabIndex(idx);
    setSelectedCell(null);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--tashrif-bg)', color: 'var(--tashrif-text)', padding: '10px 4px 110px 4px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto 10px auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <select
          value={currentBabIndex}
          onChange={(e) => handleSelectBab(Number(e.target.value))}
          style={{ width: '100%', backgroundColor: 'var(--tashrif-control-bg)', color: 'var(--tashrif-text)', border: '2px solid var(--tashrif-border-strong)', borderRadius: '6px', padding: '8px 10px', fontSize: '13px', fontWeight: 700 }}
        >
          {TASHRIF_LUGHAWI_DATA.map((bab, index) => (
            <option key={bab.id} value={index}>
              {index + 1}. {bab.judulIndo} ({bab.halamanKitab})
            </option>
          ))}
        </select>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <button
            disabled={currentBabIndex === 0}
            onClick={() => handleSelectBab(currentBabIndex - 1)}
            style={{ flex: 1, padding: '7px 10px', fontSize: '12px', fontWeight: 700, backgroundColor: currentBabIndex === 0 ? 'var(--tashrif-btn-disabled)' : 'var(--tashrif-btn-bg)', color: currentBabIndex === 0 ? 'var(--tashrif-btn-disabled-text)' : 'var(--tashrif-btn-text)', border: 'none', borderRadius: '5px', cursor: currentBabIndex === 0 ? 'not-allowed' : 'pointer' }}
          >
            &larr; Sebelumnya
          </button>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--tashrif-muted)', padding: '0 6px' }}>
            {currentBabIndex + 1} / {TASHRIF_LUGHAWI_DATA.length}
          </span>
          <button
            disabled={currentBabIndex === TASHRIF_LUGHAWI_DATA.length - 1}
            onClick={() => handleSelectBab(currentBabIndex + 1)}
            style={{ flex: 1, padding: '7px 10px', fontSize: '12px', fontWeight: 700, backgroundColor: currentBabIndex === TASHRIF_LUGHAWI_DATA.length - 1 ? 'var(--tashrif-btn-disabled)' : 'var(--tashrif-btn-bg)', color: currentBabIndex === TASHRIF_LUGHAWI_DATA.length - 1 ? 'var(--tashrif-btn-disabled-text)' : 'var(--tashrif-btn-text)', border: 'none', borderRadius: '5px', cursor: currentBabIndex === TASHRIF_LUGHAWI_DATA.length - 1 ? 'not-allowed' : 'pointer' }}
          >
            Selanjutnya &rarr;
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', border: '4px double var(--tashrif-border-strong)', backgroundColor: 'var(--tashrif-paper)', padding: '8px 3px', boxShadow: '0 2px 6px rgba(16, 61, 44, 0.10)' }}>
        <div style={{ textAlign: 'center', borderBottom: '2px solid var(--tashrif-border-strong)', paddingBottom: '6px', marginBottom: '8px' }}>
          <div style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', backgroundColor: currentBab.direction === 'vertical' ? 'var(--tashrif-btn-bg)' : 'var(--tashrif-accent)', color: currentBab.direction === 'vertical' ? 'var(--tashrif-btn-text)' : 'var(--tashrif-accent-text)', fontSize: '10px', fontWeight: 700, marginBottom: '3px' }}>
            {'\u2193 Arah Baca: Atas ke Bawah (Per Kolom)'}
          </div>
          <h2 dir="rtl" style={{ fontFamily: 'Amiri, serif', fontSize: 'clamp(1.1rem, 4.2vw, 1.55rem)', fontWeight: 700, color: 'var(--tashrif-ink)', margin: '2px 0', lineHeight: 1.5 }}>
            {currentBab.judulArab}
          </h2>
          <p style={{ fontSize: '11px', color: 'var(--tashrif-muted)', margin: 0, fontWeight: 600 }}>
            {currentBab.judulIndo} ({currentBab.halamanKitab})
          </p>
        </div>

        <div style={{ width: '100%', overflow: 'hidden' }}>
          <table dir="rtl" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', textAlign: 'center', border: '1.5px solid var(--tashrif-border-strong)' }}>
            <colgroup>
              <col style={{ width: labelColWidth }} />
              {currentBab.colHeadersArab.map((_, idx) => (
                <col key={idx} style={{ width: dataColWidth }} />
              ))}
            </colgroup>
            <thead>
              <tr style={{ backgroundColor: 'var(--tashrif-thead-bg)', borderBottom: '2px solid var(--tashrif-border-strong)' }}>
                <th style={{ backgroundColor: 'var(--tashrif-dhamir-head-bg)', padding: '4px 1px', borderLeft: '2px solid var(--tashrif-border-strong)', fontWeight: 700, color: 'var(--tashrif-text)', fontSize: 'clamp(0.45rem, 1.5vw, 0.72rem)', lineHeight: 1.15, overflow: 'hidden' }}>
                  {currentBab.direction === 'vertical' ? 'Dhamir' : 'Bentuk'}
                </th>
                {currentBab.colHeadersArab.map((hArab, cIdx) => (
                  <th
                    key={cIdx}
                    style={{
                      padding: '4px 1px',
                      borderLeft: cIdx === colCount - 1 ? 'none' : '1px solid var(--tashrif-border-cell)',
                      color: 'var(--tashrif-ink)',
                      verticalAlign: 'middle',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ fontFamily: 'Amiri, serif', fontSize: 'clamp(0.55rem, 2.0vw, 0.92rem)', fontWeight: 700, lineHeight: 1.2 }}>
                      {hArab}
                    </div>
                    <div style={{ fontSize: 'clamp(0.38rem, 1.15vw, 0.62rem)', fontWeight: 600, color: 'var(--tashrif-muted)', lineHeight: 1.1, marginTop: '1px' }}>
                      {currentBab.colHeadersIndo[cIdx]}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentBab.rows.map((row, rIdx) => {
                const isGroupBreak = currentBab.direction === 'vertical' && (rIdx === 3 || rIdx === 6 || rIdx === 9 || rIdx === 12);
                const rowBg = rIdx % 2 === 0 ? 'var(--tashrif-paper)' : 'var(--tashrif-row-alt)';
                return (
                  <tr key={rIdx} style={{ backgroundColor: rowBg, borderTop: isGroupBreak ? '2px solid var(--tashrif-group-break)' : undefined, borderBottom: '1px solid var(--tashrif-border-cell)' }}>
                    <td style={{ backgroundColor: 'var(--tashrif-wazan-bg)', padding: '5px 1px', borderLeft: '2px solid var(--tashrif-border-strong)', fontWeight: 700, color: 'var(--tashrif-text)', verticalAlign: 'middle', overflow: 'hidden' }}>
                      <div style={{ fontFamily: 'Amiri, serif', fontSize: 'clamp(0.62rem, 2.2vw, 0.98rem)', lineHeight: 1.25 }}>
                        {row.rowLabelArab}
                      </div>
                      <div style={{ fontSize: 'clamp(0.36rem, 1.05vw, 0.56rem)', fontWeight: 600, color: 'var(--tashrif-muted)', lineHeight: 1.1 }}>
                        {row.rowLabelIndo}
                      </div>
                    </td>
                    {row.cells.map((cellArab, cIdx) => {
                      const isSelected =
                        selectedCell?.arab === cellArab &&
                        selectedCell?.rowArab === row.rowLabelArab &&
                        selectedCell?.colArab === currentBab.colHeadersArab[cIdx];
                      const isLong = cellArab.length >= 8;

                      return (
                        <td
                          key={cIdx}
                          onClick={() =>
                            setSelectedCell({
                              arab: cellArab,
                              rowArab: row.rowLabelArab,
                              rowIndo: row.rowLabelIndo,
                              colArab: currentBab.colHeadersArab[cIdx],
                              colIndo: currentBab.colHeadersIndo[cIdx],
                              direction: currentBab.direction,
                            })
                          }
                          style={{
                            padding: '5px 0.5px',
                            borderLeft: cIdx === colCount - 1 ? 'none' : '1px solid var(--tashrif-border-cell)',
                            backgroundColor: isSelected ? 'var(--tashrif-cell-selected)' : undefined,
                            cursor: 'pointer',
                            verticalAlign: 'middle',
                            userSelect: 'none',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              fontFamily: 'Amiri, serif',
                              fontSize: isLong
                                ? 'clamp(0.62rem, 2.3vw, 1.05rem)'
                                : 'clamp(0.72rem, 2.8vw, 1.22rem)',
                              fontWeight: 700,
                              color: 'var(--tashrif-ink)',
                              lineHeight: 1.4,
                              whiteSpace: 'nowrap',
                              wordBreak: 'keep-all',
                            }}
                          >
                            {cellArab}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCell && (
  <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'var(--tashrif-panel-bg)', color: 'var(--tashrif-panel-text)', padding: '12px 14px', borderTop: '2px solid var(--tashrif-panel-border)', boxShadow: '0 -3px 10px rgba(0,0,0,0.25)', zIndex: 50 }}>
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--tashrif-panel-sub)' }}>
          <span style={{ padding: '2px 7px', backgroundColor: 'var(--tashrif-panel-chip-bg)', borderRadius: '4px', fontWeight: 700, color: 'var(--tashrif-panel-bright)' }}>{selectedCell.colIndo} ({selectedCell.colArab})</span>
          <span>- {selectedCell.rowIndo}</span>
        </div>
        <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '4px', color: 'var(--tashrif-panel-text)' }}>
          {selectedCell.direction === 'vertical' ? 'Pola: Tashrif Vertikal (Atas ke Bawah)' : 'Pola: Tashrif Horizontal (Kanan ke Kiri)'}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <span dir='rtl' style={{ fontFamily: 'Amiri, serif', fontSize: '24px', fontWeight: 700, color: 'var(--tashrif-panel-bright)' }}>{selectedCell.arab}</span>
        <button onClick={() => setSelectedCell(null)} style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 700, backgroundColor: 'var(--tashrif-panel-chip-bg)', color: 'var(--tashrif-panel-text)', border: '1px solid var(--tashrif-panel-border)', borderRadius: '4px', cursor: 'pointer' }}>Tutup</button>
      </div>
    </div>
  </div>
)}
</div>
);
};
export default TashrifLughawiView;