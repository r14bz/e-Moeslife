import React, { useEffect, useMemo, useRef, useState } from "react";
import { allImrithiBaits, imrithiBabs } from "../data/imrithi";
import { ThemedSelect } from "./ThemedSelect";
import { FloatingPageNav } from "./FloatingPageNav";

interface KitabImrithiReaderProps {
  initialBabId?: string;
}

export const KitabImrithiReader: React.FC<KitabImrithiReaderProps> = ({
  initialBabId = "muqaddimah",
}) => {
  const [selectedBabId, setSelectedBabId] = useState<string>(initialBabId);
  const [openAllArti, setOpenAllArti] = useState<boolean>(false);
  const [openBaitIds, setOpenBaitIds] = useState<Record<number, boolean>>({});
  const [turnDir, setTurnDir] = useState<"next" | "prev" | "fade">("fade");
  const readingCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const valid = imrithiBabs.some((b) => b.id === initialBabId)
      ? initialBabId
      : imrithiBabs[0]?.id || "muqaddimah";
    setSelectedBabId(valid);
    setOpenBaitIds({});
  }, [initialBabId]);

  const currentBabIndex = useMemo(
    () => imrithiBabs.findIndex((b) => b.id === selectedBabId),
    [selectedBabId]
  );

  const activeBab =
    currentBabIndex >= 0 ? imrithiBabs[currentBabIndex] : imrithiBabs[0];

  const babBaits = useMemo(
    () => allImrithiBaits.filter((bait) => bait.babId === activeBab?.id),
    [activeBab?.id]
  );

  const toggleSingleBait = (id: number) => {
    setOpenBaitIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleToggleAll = () => {
    const nextState = !openAllArti;
    setOpenAllArti(nextState);
    if (!nextState) {
      setOpenBaitIds({});
    }
  };

  const scrollToReadingCard = () => {
    window.requestAnimationFrame(() => {
      readingCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleSelectBabId = (id: string) => {
    const nextIdx = imrithiBabs.findIndex((b) => b.id === id);
    if (currentBabIndex >= 0 && nextIdx >= 0) {
      setTurnDir(nextIdx > currentBabIndex ? "next" : nextIdx < currentBabIndex ? "prev" : "fade");
    } else {
      setTurnDir("fade");
    }
    setSelectedBabId(id);
    setOpenBaitIds({});
    scrollToReadingCard();
  };

  const goToBabByIndex = (index: number) => {
    if (index >= 0 && index < imrithiBabs.length) {
      handleSelectBabId(imrithiBabs[index].id);
    }
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
      {/* Banner Header Hijau Zamrud (Senada Alfiyah) */}
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
          نَظْمُ الْعِمْرِيطِي
        </h1>
        <p
          style={{ color: "var(--tashrif-panel-sub)" }}
          className="text-xs font-semibold"
        >
          Kitab Nadhom Al-Imrithi
        </p>
      </div>

      {/* Panel Kontrol Dropdown & Tombol */}
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
            ariaLabel="Pilih Bab Nadhom Imrithi"
            kickerLabel="Daftar Bab Al-Imrithi"
            value={activeBab?.id || selectedBabId}
            onChange={(val) => handleSelectBabId(String(val))}
            options={imrithiBabs.map((bab) => ({
              value: bab.id,
              label: `${bab.urutan}. ${bab.judulIndo}`,
              sublabel: `Bait ${bab.rentangBait[0]}–${bab.rentangBait[1]}`,
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
          Ketuk bait untuk membuka arti
        </p>
      </div>

      {/* Bingkai Utama Kitab dengan Double Border */}
      {activeBab && (
        <div
          ref={readingCardRef}
          key={activeBab.id}
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
              BAB {activeBab.urutan} • BAIT {activeBab.rentangBait[0]}–{activeBab.rentangBait[1]}
            </span>
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
              {activeBab.judulArab}
            </h2>
            <p
              style={{ color: "var(--tashrif-muted)" }}
              className="text-xs font-semibold"
            >
              {activeBab.judulIndo}
            </p>
          </div>

          <div>
            {babBaits.map((bait) => {
              const isArtiOpen = openAllArti || Boolean(openBaitIds[bait.id]);

              return (
                <div
                  key={bait.id}
                  style={{ borderBottom: "1px solid var(--tashrif-border-cell)" }}
                  className="last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() => toggleSingleBait(bait.id)}
                    aria-expanded={isArtiOpen}
                    dir="rtl"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      width: "100%",
                      textAlign: "center",
                      background: "transparent",
                      border: "none",
                    }}
                    className="cursor-pointer items-stretch transition-colors hover:bg-[var(--tashrif-dropdown-hover)]"
                  >
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

                  {isArtiOpen && (
                    <div
                      style={{
                        borderTop: "1px dashed var(--tashrif-group-break)",
                        backgroundColor: "var(--tashrif-wazan-bg)",
                        color: "var(--tashrif-text)",
                      }}
                      className="px-3.5 py-2.5 text-xs leading-relaxed sm:text-[13px]"
                    >
                      <div>
                        <span
                          style={{ color: "var(--tashrif-accent)" }}
                          className="mr-1.5 font-mono-tabular font-bold"
                        >
                          [{bait.id}]
                        </span>
                        {bait.terjemah}
                      </div>
                      {bait.catatan && (
                        <div
                          style={{
                            borderTop: "1px dotted var(--tashrif-border-cell)",
                            color: "var(--tashrif-muted)",
                          }}
                          className="mt-1.5 pt-1.5 text-[11px]"
                        >
                          <strong style={{ color: "var(--tashrif-accent)" }}>Kaidah:</strong>{" "}
                          {bait.catatan}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <FloatingPageNav
        onPrev={() => goToBabByIndex(currentBabIndex - 1)}
        onNext={() => goToBabByIndex(currentBabIndex + 1)}
        canPrev={currentBabIndex > 0}
        canNext={currentBabIndex < imrithiBabs.length - 1}
        centerText={`${Math.max(1, currentBabIndex + 1)} / ${imrithiBabs.length}`}
        ariaLabel="Navigasi antar bab Nadhom Al-Imrithi"
      />
    </div>
  );
};

export default KitabImrithiReader;
