import React, { useRef, useState } from 'react';
import { TASHRIF_LUGHAWI_DATA } from '../data/tashrifLughawiData';
import { findIlalNote } from '../data/ilalNotes';
import { ThemedSelect } from './ThemedSelect';
import { FloatingPageNav } from './FloatingPageNav';

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

  const readingCardRef = useRef<HTMLDivElement | null>(null);

  const currentBab = TASHRIF_LUGHAWI_DATA[currentBabIndex] || TASHRIF_LUGHAWI_DATA[0];
  const colCount = currentBab.colHeadersArab.length;
  const labelColWidth = '14%';
  const dataColWidth = `${(86 / colCount).toFixed(2)}%`;

  const handleSelectBab = (idx: number) => {
    setCurrentBabIndex(idx);
    setSelectedCell(null);
    window.requestAnimationFrame(() => {
      readingCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--tashrif-bg)', color: 'var(--tashrif-text)', padding: selectedCell ? '10px 3px 110px 3px' : '10px 3px 24px 3px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '980px', margin: '0 auto 10px auto' }}>
        <ThemedSelect
          className="w-full"
          ariaLabel="Pilih Bab Tashrif Lughawi"
          kickerLabel="Daftar Bab Tashrif Lughawi"
          value={currentBabIndex}
          onChange={(val) => handleSelectBab(Number(val))}
          options={TASHRIF_LUGHAWI_DATA.map((bab, index) => ({
            value: index,
            label: `${index + 1}. ${bab.judulIndo}`,
            sublabel: bab.halamanKitab,
          }))}
        />
      </div>

      <div ref={readingCardRef} style={{ maxWidth: '980px', margin: '0 auto', scrollMarginTop: '5rem', border: '4px double var(--tashrif-border-strong)', backgroundColor: 'var(--tashrif-paper)', padding: '8px 2px', boxShadow: '0 2px 6px rgba(16, 61, 44, 0.10)' }}>
        <div style={{ textAlign: 'center', borderBottom: '2px solid var(--tashrif-border-strong)', paddingBottom: '6px', marginBottom: '8px' }}>
          <div style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', backgroundColor: currentBab.direction === 'vertical' ? 'var(--tashrif-btn-bg)' : 'var(--tashrif-accent)', color: currentBab.direction === 'vertical' ? 'var(--tashrif-btn-text)' : 'var(--tashrif-accent-text)', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>
            {'\u2193 Arah Baca: Atas ke Bawah (Per Kolom)'}
          </div>
          <h2 dir="rtl" style={{ fontFamily: 'Amiri, serif', fontSize: 'clamp(1.28rem, 4.6vw, 1.8rem)', fontWeight: 700, color: 'var(--tashrif-ink)', margin: '2px 0', lineHeight: 1.55 }}>
            {currentBab.judulArab}
          </h2>
          <p style={{ fontSize: '12.5px', color: 'var(--tashrif-muted)', margin: 0, fontWeight: 600 }}>
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
                <th style={{ backgroundColor: 'var(--tashrif-dhamir-head-bg)', padding: '5px 1px', borderLeft: '2px solid var(--tashrif-border-strong)', fontWeight: 700, color: 'var(--tashrif-text)', fontSize: 'clamp(0.52rem, 1.65vw, 0.82rem)', lineHeight: 1.2, overflow: 'hidden' }}>
                  {currentBab.direction === 'vertical' ? 'Dhamir' : 'Bentuk'}
                </th>
                {currentBab.colHeadersArab.map((hArab, cIdx) => (
                  <th
                    key={cIdx}
                    style={{
                      padding: '5px 1px',
                      borderLeft: cIdx === colCount - 1 ? 'none' : '1px solid var(--tashrif-border-cell)',
                      color: 'var(--tashrif-ink)',
                      verticalAlign: 'middle',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ fontFamily: 'Amiri, serif', fontSize: 'clamp(0.64rem, 2.2vw, 1.08rem)', fontWeight: 700, lineHeight: 1.3 }}>
                      {hArab}
                    </div>
                    <div style={{ fontSize: 'clamp(0.45rem, 1.3vw, 0.72rem)', fontWeight: 600, color: 'var(--tashrif-muted)', lineHeight: 1.15, marginTop: '2px' }}>
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
                    <td style={{ backgroundColor: 'var(--tashrif-wazan-bg)', padding: '6px 1px', borderLeft: '2px solid var(--tashrif-border-strong)', fontWeight: 700, color: 'var(--tashrif-text)', verticalAlign: 'middle', overflow: 'hidden' }}>
                      <div style={{ fontFamily: 'Amiri, serif', fontSize: 'clamp(0.70rem, 2.35vw, 1.12rem)', lineHeight: 1.35 }}>
                        {row.rowLabelArab}
                      </div>
                      <div style={{ fontSize: 'clamp(0.43rem, 1.22vw, 0.68rem)', fontWeight: 600, color: 'var(--tashrif-muted)', lineHeight: 1.15 }}>
                        {row.rowLabelIndo}
                      </div>
                    </td>
                    {row.cells.map((cellArab, cIdx) => {
                      const isSelected =
                        selectedCell?.arab === cellArab &&
                        selectedCell?.rowArab === row.rowLabelArab &&
                        selectedCell?.colArab === currentBab.colHeadersArab[cIdx];
                      const hasMultipleWords = cellArab.includes(' ');
                      const baseLen = cellArab.replace(/[\u064B-\u065F\u0670]/g, '').length;
                      const isVeryLong = !hasMultipleWords && baseLen >= 7;
                      const isMedium = !hasMultipleWords && baseLen >= 5;
                      const cellFontSize = hasMultipleWords
                        ? 'clamp(0.70rem, 2.4vw, 1.20rem)'
                        : isVeryLong
                        ? 'clamp(0.70rem, 2.45vw, 1.20rem)'
                        : isMedium
                        ? 'clamp(0.78rem, 2.85vw, 1.32rem)'
                        : 'clamp(0.86rem, 3.2vw, 1.44rem)';

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
                            padding: '6px 1px',
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
                              fontSize: cellFontSize,
                              fontWeight: 700,
                              color: 'var(--tashrif-ink)',
                              lineHeight: hasMultipleWords ? 1.35 : 1.5,
                              whiteSpace: hasMultipleWords ? 'normal' : 'nowrap',
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

      <FloatingPageNav
        maxWidthClass="max-w-[980px]"
        hidden={Boolean(selectedCell)}
        onPrev={() => handleSelectBab(currentBabIndex - 1)}
        onNext={() => handleSelectBab(currentBabIndex + 1)}
        canPrev={currentBabIndex > 0}
        canNext={currentBabIndex < TASHRIF_LUGHAWI_DATA.length - 1}
        centerText={`${currentBabIndex + 1} / ${TASHRIF_LUGHAWI_DATA.length}`}
        ariaLabel="Navigasi antar bab Tashrif Lughawi"
      />

      {selectedCell && (
  <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'var(--tashrif-panel-bg)', color: 'var(--tashrif-panel-text)', padding: '12px 14px', borderTop: '2px solid var(--tashrif-panel-border)', boxShadow: '0 -3px 10px rgba(0,0,0,0.25)', zIndex: 50 }}>
    <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--tashrif-panel-sub)' }}>
          <span style={{ padding: '2px 7px', backgroundColor: 'var(--tashrif-panel-chip-bg)', borderRadius: '4px', fontWeight: 700, color: 'var(--tashrif-panel-bright)' }}>{selectedCell.colIndo} ({selectedCell.colArab})</span>
          <span>- {selectedCell.rowIndo}</span>
        </div>
        <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px', color: 'var(--tashrif-panel-text)' }}>
          {selectedCell.direction === 'vertical' ? 'Pola: Tashrif Vertikal (Atas ke Bawah)' : 'Pola: Tashrif Horizontal (Kanan ke Kiri)'}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <span dir='rtl' style={{ fontFamily: 'Amiri, serif', fontSize: '28px', fontWeight: 700, color: 'var(--tashrif-panel-bright)' }}>{selectedCell.arab}</span>
        <button onClick={() => setSelectedCell(null)} style={{ padding: '6px 11px', fontSize: '12px', fontWeight: 700, backgroundColor: 'var(--tashrif-panel-chip-bg)', color: 'var(--tashrif-panel-text)', border: '1px solid var(--tashrif-panel-border)', borderRadius: '4px', cursor: 'pointer' }}>Tutup</button>
      </div>
    </div>
  </div>
)}
</div>
);
};
export default TashrifLughawiView;