import React, { useEffect, useMemo, useRef, useState } from "react";
import { kitabQathrulGhaits } from "../data/qathrulGhaits";
import type { LembaranQathrulGhaits } from "../types/qathrulGhaits";
import { ThemedSelect } from "./ThemedSelect";
import { FloatingPageNav } from "./FloatingPageNav";

interface KitabQathrulGhaitsReaderProps {
  initialIndex?: number;
}

export const KitabQathrulGhaitsReader: React.FC<KitabQathrulGhaitsReaderProps> = ({
  initialIndex = 0,
}) => {
  const daftarLembaran = kitabQathrulGhaits.daftarLembaran;
  const clampIndex = (idx: number) =>
    daftarLembaran.length ? Math.min(Math.max(0, idx), daftarLembaran.length - 1) : 0;

  const [selectedIndex, setSelectedIndex] = useState<number>(() => clampIndex(initialIndex));
  const [openAllArti, setOpenAllArti] = useState<boolean>(false);
  const [openItemIds, setOpenItemIds] = useState<Record<string, boolean>>({});
  const [turnDir, setTurnDir] = useState<"next" | "prev" | "fade">("fade");
  const readingCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSelectedIndex(
      typeof initialIndex === "number" && initialIndex >= 0 && initialIndex < daftarLembaran.length
        ? initialIndex
        : 0
    );
    setOpenItemIds({});
  }, [initialIndex, daftarLembaran.length]);

  const activeLembaran: LembaranQathrulGhaits | undefined = useMemo(
    () => daftarLembaran[selectedIndex] ?? daftarLembaran[0],
    [daftarLembaran, selectedIndex]
  );

  const scrollToReadingCard = () => {
    window.requestAnimationFrame(() => {
      readingCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleSelectLembaran = (idx: number) => {
    if (idx >= 0 && idx < daftarLembaran.length) {
      setTurnDir(idx > selectedIndex ? "next" : idx < selectedIndex ? "prev" : "fade");
      setSelectedIndex(idx);
      setOpenItemIds({});
      scrollToReadingCard();
    }
  };

  const toggleSingleTerjemahan = (itemId: string) => {
    setOpenItemIds((prev) => ({
      ...prev,
      [itemId]: !(prev[itemId] ?? openAllArti),
    }));
  };

  const handleToggleAll = () => {
    const nextState = !openAllArti;
    setOpenAllArti(nextState);
    setOpenItemIds({});
  };

  return (
    <div
      style={{
        padding: "0.75rem",
        backgroundColor: "var(--tashrif-bg)",
        color: "var(--tashrif-text)",
      }}
      className="mx-auto max-w-2xl"
    >
      {/* Banner Header Hijau Zamrud */}
      <div
        style={{
          padding: "0.95rem 0.75rem",
          marginBottom: "0.75rem",
          backgroundColor: "var(--tashrif-panel-bg)",
          border: "1px solid var(--tashrif-panel-border)",
          borderRadius: "0.75rem",
        }}
        className="text-center shadow-xs"
      >
        <h1
          dir="rtl"
          lang="ar"
          style={{
            color: "var(--tashrif-panel-bright)",
            lineHeight: "1.8",
            marginBottom: "0.15rem",
          }}
          className="font-arabic text-2xl font-bold"
        >
          {kitabQathrulGhaits.judulArab}
        </h1>
        <p style={{ color: "var(--tashrif-panel-sub)" }} className="text-xs font-semibold">
          Kitab Qathrul Ghaits — {kitabQathrulGhaits.pengarang} ({daftarLembaran.length} Lembaran)
        </p>
      </div>

      {/* Panel Kontrol Dropdown Lembaran & Tombol Buka Arti */}
      <div
        style={{
          padding: "0.75rem",
          marginBottom: "0.85rem",
          backgroundColor: "var(--tashrif-paper)",
          border: "1px solid var(--tashrif-border-cell)",
          borderRadius: "0.75rem",
        }}
        className="shadow-xs"
      >
        <div className="flex items-center gap-2.5">
          <ThemedSelect
            ariaLabel="Pilih Lembaran Kitab Qathrul Ghaits"
            kickerLabel="Daftar Lembaran Qathrul Ghaits"
            value={selectedIndex}
            onChange={(val) => handleSelectLembaran(Number(val))}
            options={daftarLembaran.map((item, idx) => ({
              value: idx,
              label: item.dropdownLabel,
            }))}
          />

          <button
            type="button"
            onClick={handleToggleAll}
            style={{
              whiteSpace: "nowrap",
              padding: "0.58rem 0.9rem",
              backgroundColor: "var(--tashrif-btn-bg)",
              color: "var(--tashrif-btn-text)",
              borderRadius: "0.5rem",
              cursor: "pointer",
            }}
            className="text-xs font-bold"
          >
            {openAllArti ? "Tutup Arti" : "Buka Arti"}
          </button>
        </div>

        <p
          style={{
            marginTop: "0.5rem",
            paddingLeft: "0.15rem",
            color: "var(--tashrif-muted)",
          }}
          className="text-[11px]"
        >
          Ketuk paragraf Arab untuk membuka atau menutup terjemahan
        </p>
      </div>

      {/* Bingkai Utama Kitab dengan Double Border */}
      {activeLembaran && (
        <div
          ref={readingCardRef}
          key={selectedIndex}
          style={{
            marginBottom: "0.95rem",
            backgroundColor: "var(--tashrif-paper)",
            border: "4px double var(--tashrif-border-strong)",
            borderRadius: "0.75rem",
          }}
          className={`scroll-mt-20 overflow-hidden shadow-xs page-enter-${turnDir}`}
        >
          <div
            style={{
              borderBottom: "1px solid var(--tashrif-border-cell)",
              backgroundColor: "var(--tashrif-wazan-bg)",
              padding: "0.9rem 0.75rem",
            }}
            className="text-center"
          >
            <span
              style={{
                color: "var(--tashrif-accent)",
                letterSpacing: "0.06em",
                marginBottom: "0.3rem",
              }}
              className="block font-mono-tabular text-[11px] font-bold uppercase"
            >
              LEMBARAN {activeLembaran.nomorLembaran} / {daftarLembaran.length} •{" "}
              {activeLembaran.paragraf.length} PARAGRAF
            </span>
            {activeLembaran.judulArab && (
              <h2
                dir="rtl"
                lang="ar"
                style={{
                  color: "var(--tashrif-ink)",
                  lineHeight: "2.0",
                  marginBottom: "0.2rem",
                }}
                className="font-arabic text-xl font-bold sm:text-2xl"
              >
                {activeLembaran.judulArab}
              </h2>
            )}
            <p style={{ color: "var(--tashrif-muted)" }} className="text-xs font-semibold">
              {activeLembaran.judulLatin}
            </p>
          </div>

          <div>
            {activeLembaran.paragraf.map((item) => {
              const isOpen = openItemIds[item.id] ?? openAllArti;

              return (
                <div
                  key={item.id}
                  style={{ borderBottom: "1px solid var(--tashrif-border-cell)" }}
                  className="last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() => toggleSingleTerjemahan(item.id)}
                    aria-expanded={isOpen}
                    dir="rtl"
                    style={{
                      width: "100%",
                      textAlign: "right",
                      background: "transparent",
                      border: "none",
                    }}
                    className="block w-full cursor-pointer px-3.5 py-3 transition-colors hover:bg-[var(--tashrif-dropdown-hover)]"
                  >
                    <p
                      dir="rtl"
                      lang="ar"
                      style={{
                        color: "var(--tashrif-ink)",
                        fontSize: "var(--arabic-reader-size)",
                        lineHeight: "2.05",
                      }}
                      className="font-arabic text-right break-words"
                    >
                      <span
                        style={{
                          backgroundColor: "var(--tashrif-wazan-bg)",
                          border: "1px solid var(--tashrif-border-cell)",
                          color: "var(--tashrif-accent)",
                        }}
                        className="ml-2 inline-block rounded px-1.5 py-0.5 align-middle font-mono-tabular text-[11px] font-bold"
                      >
                        {item.nomor}
                      </span>
                      {item.arab}
                    </p>
                  </button>

                  {isOpen && item.arti && (
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
                        [{item.nomor}]
                      </span>
                      {item.arti}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigasi Mengambang Sebelumnya / Selanjutnya */}
      <FloatingPageNav
        ariaLabel="Navigasi antar lembaran Qathrul Ghaits"
        onPrev={() => handleSelectLembaran(selectedIndex - 1)}
        onNext={() => handleSelectLembaran(selectedIndex + 1)}
        canPrev={selectedIndex > 0}
        canNext={selectedIndex < daftarLembaran.length - 1}
        centerText={`${selectedIndex + 1} / ${daftarLembaran.length}`}
      />
    </div>
  );
};

export default KitabQathrulGhaitsReader;
