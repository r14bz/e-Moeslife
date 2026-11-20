import React, { useEffect, useRef, useState } from "react";
import { ALFIYAH_DATA } from "../data/alfiyah";
import { AlfiyahBaitCard } from "./AlfiyahBaitCard";
import { ThemedSelect } from "./ThemedSelect";
import { FloatingPageNav } from "./FloatingPageNav";

const LABEL_RENTANG: Record<number, string> = {
  1: "1-250",
  2: "251-500",
  3: "501-750",
  4: "751-1002",
};

interface KitabAlfiyahReaderProps {
  initialJuz?: number;
  initialBabIndex?: number;
}

export const KitabAlfiyahReader: React.FC<KitabAlfiyahReaderProps> = ({
  initialJuz = 1,
  initialBabIndex = 0,
}) => {
  const [selectedJuz, setSelectedJuz] = useState<number>(initialJuz);
  const [selectedBabIndex, setSelectedBabIndex] = useState<number>(initialBabIndex);
  const [showAllTranslation, setShowAllTranslation] = useState<boolean>(false);
  const [openBaitIds, setOpenBaitIds] = useState<Record<number, boolean>>({});
  const readingCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const validJuz = ALFIYAH_DATA.some((j) => j.juz === initialJuz) ? initialJuz : 1;
    const juzObj = ALFIYAH_DATA.find((j) => j.juz === validJuz) || ALFIYAH_DATA[0];
    const safeBab =
      initialBabIndex >= 0 && initialBabIndex < juzObj.babList.length ? initialBabIndex : 0;
    setSelectedJuz(validJuz);
    setSelectedBabIndex(safeBab);
    setOpenBaitIds({});
  }, [initialJuz, initialBabIndex]);

  const currentJuzData =
    ALFIYAH_DATA.find((item) => item.juz === selectedJuz) || ALFIYAH_DATA[0];
  const babList = currentJuzData.babList;
  const currentBab = babList[selectedBabIndex] || babList[0];

  const scrollToReadingCard = () => {
    window.requestAnimationFrame(() => {
      readingCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleSelectJuz = (juzNumber: number) => {
    setSelectedJuz(juzNumber);
    setSelectedBabIndex(0);
    setOpenBaitIds({});
    scrollToReadingCard();
  };

  const handleToggleSingleBait = (id: number) => {
    setOpenBaitIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleToggleAll = () => {
    const nextState = !showAllTranslation;
    setShowAllTranslation(nextState);
    if (!nextState) {
      setOpenBaitIds({});
    }
  };

  const handlePrevBab = () => {
    if (selectedBabIndex > 0) {
      setSelectedBabIndex(selectedBabIndex - 1);
    } else if (selectedJuz > 1) {
      const prevJuz = ALFIYAH_DATA.find((j) => j.juz === selectedJuz - 1);
      if (prevJuz) {
        setSelectedJuz(prevJuz.juz);
        setSelectedBabIndex(prevJuz.babList.length - 1);
      }
    }
    setOpenBaitIds({});
    scrollToReadingCard();
  };

  const handleNextBab = () => {
    if (selectedBabIndex < babList.length - 1) {
      setSelectedBabIndex(selectedBabIndex + 1);
    } else if (selectedJuz < ALFIYAH_DATA.length) {
      const nextJuz = ALFIYAH_DATA.find((j) => j.juz === selectedJuz + 1);
      if (nextJuz) {
        setSelectedJuz(nextJuz.juz);
        setSelectedBabIndex(0);
      }
    }
    setOpenBaitIds({});
    scrollToReadingCard();
  };

  const isFirstBabOverall = selectedJuz === 1 && selectedBabIndex === 0;
  const isLastBabOverall =
    selectedJuz === ALFIYAH_DATA.length &&
    selectedBabIndex === babList.length - 1;

  const firstBaitId = currentBab?.baitList[0]?.id;
  const lastBaitId =
    currentBab?.baitList[currentBab.baitList.length - 1]?.id;

  return (
    <div
      style={{
        padding: "0.75rem",
        backgroundColor: "var(--tashrif-bg)",
        color: "var(--tashrif-text)",
      }}
      className="mx-auto max-w-2xl"
    >
      {/* Header Nama Kitab */}
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
          أَلْفِيَّةُ ابْنِ مَالِكٍ
        </h1>
        <p
          style={{ color: "var(--tashrif-panel-sub)" }}
          className="text-xs font-semibold"
        >
          Kitab Alfiyah Ibnu Malik
        </p>
      </div>

      {/* 4 Tombol Pilihan Rentang: 1-250, 251-500, 501-750, 751-1002 */}
      <div
        style={{
          padding: "0.35rem",
          marginBottom: "0.75rem",
          backgroundColor: "var(--tashrif-panel-bg)",
          border: "1px solid var(--tashrif-panel-border)",
          borderRadius: "0.75rem",
        }}
        className="grid grid-cols-4 gap-1.5 shadow-xs"
      >
        {ALFIYAH_DATA.map((item) => {
          const isActive = selectedJuz === item.juz;
          return (
            <button
              key={item.juz}
              type="button"
              onClick={() => handleSelectJuz(item.juz)}
              style={{
                backgroundColor: isActive
                  ? "var(--tashrif-tab-active-bg)"
                  : "transparent",
                color: isActive
                  ? "var(--tashrif-tab-active-text)"
                  : "var(--tashrif-panel-text)",
                borderRadius: "0.5rem",
                cursor: "pointer",
              }}
              className="font-mono-tabular py-2 text-xs font-bold transition"
            >
              {LABEL_RENTANG[item.juz] || item.judul}
            </button>
          );
        })}
      </div>

      {/* Kartu Pemilihan Judul Bab */}
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
            ariaLabel="Pilih Bab Alfiyah"
            kickerLabel="Daftar Bab Alfiyah"
            value={selectedBabIndex}
            onChange={(val) => {
              setSelectedBabIndex(Number(val));
              setOpenBaitIds({});
              scrollToReadingCard();
            }}
            options={babList.map((bab, idx) => ({
              value: idx,
              label: `${idx + 1}. ${bab.judulIndo}`,
              sublabel: bab.baitList.length > 0
                ? `Bait ${bab.baitList[0].id}–${bab.baitList[bab.baitList.length - 1].id}`
                : undefined,
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
            {showAllTranslation ? "Tutup Arti" : "Buka Arti"}
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

      {/* Tampilan 1 Bab per Halaman dengan Bingkai Ganda */}
      {currentBab && (
        <div
          ref={readingCardRef}
          style={{
            marginBottom: "0.95rem",
            backgroundColor: "var(--tashrif-paper)",
            border: "4px double var(--tashrif-border-strong)",
            borderRadius: "0.75rem",
          }}
          className="scroll-mt-20 overflow-hidden shadow-xs"
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
              BAB {selectedBabIndex + 1} • BAIT {firstBaitId}–{lastBaitId}
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
              {currentBab.judulArab}
            </h2>
            <p
              style={{ color: "var(--tashrif-muted)" }}
              className="text-xs font-semibold"
            >
              {currentBab.judulIndo}
            </p>
          </div>

          <div>
            {currentBab.baitList.map((bait) => (
              <AlfiyahBaitCard
                key={bait.id}
                bait={bait}
                isVisible={showAllTranslation || Boolean(openBaitIds[bait.id])}
                onToggle={handleToggleSingleBait}
              />
            ))}
          </div>
        </div>
      )}

      <FloatingPageNav
        onPrev={handlePrevBab}
        onNext={handleNextBab}
        canPrev={!isFirstBabOverall}
        canNext={!isLastBabOverall}
        centerText={`${selectedBabIndex + 1} / ${babList.length}`}
        ariaLabel="Navigasi antar bab Alfiyah Ibnu Malik"
      />
    </div>
  );
};

export default KitabAlfiyahReader;
