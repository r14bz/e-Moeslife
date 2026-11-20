import React, { useEffect, useMemo, useRef, useState } from "react";
import { daftarBabJurumiyah, semuaBabJurumiyah } from "../data/jurumiyah";
import type { JurumiyahBab } from "../types/jurumiyah.types";
import { ThemedSelect } from "./ThemedSelect";
import { FloatingPageNav } from "./FloatingPageNav";

interface KitabJurumiyahReaderProps {
  initialBabId?: number;
}

export const KitabJurumiyahReader: React.FC<KitabJurumiyahReaderProps> = ({
  initialBabId = 1,
}) => {
  const defaultBabId = semuaBabJurumiyah[0]?.id ?? 1;
  const [selectedBabId, setSelectedBabId] = useState<number>(initialBabId || defaultBabId);
  const [openAllArti, setOpenAllArti] = useState<boolean>(false);
  const [openItemIds, setOpenItemIds] = useState<Record<number, boolean>>({});
  const readingCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const valid = semuaBabJurumiyah.some((b) => b.id === initialBabId)
      ? initialBabId
      : defaultBabId;
    setSelectedBabId(valid);
    setOpenItemIds({});
  }, [initialBabId, defaultBabId]);

  const currentBabIndex = useMemo(
    () => semuaBabJurumiyah.findIndex((b) => b.id === selectedBabId),
    [selectedBabId]
  );

  const activeBab: JurumiyahBab | undefined =
    currentBabIndex >= 0 ? semuaBabJurumiyah[currentBabIndex] : semuaBabJurumiyah[0];

  const handleSelectBab = (id: number) => {
    setSelectedBabId(id);
    setOpenItemIds({});
    window.requestAnimationFrame(() => {
      readingCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const toggleSingleTerjemahan = (paragrafId: number) => {
    setOpenItemIds((prev) => ({
      ...prev,
      [paragrafId]: !(prev[paragrafId] ?? openAllArti),
    }));
  };

  const handleToggleAll = () => {
    const nextState = !openAllArti;
    setOpenAllArti(nextState);
    setOpenItemIds({});
  };

  const goToBabByIndex = (index: number) => {
    if (index >= 0 && index < semuaBabJurumiyah.length) {
      handleSelectBab(semuaBabJurumiyah[index].id);
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
      {/* Banner Header Hijau Zamrud (Senada Alfiyah, Imrithi & Tashrif) */}
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
          مَتْنُ الْآجُرُّومِيَّةِ
        </h1>
        <p style={{ color: "var(--tashrif-panel-sub)" }} className="text-xs font-semibold">
          Kitab Matan Al-Ajurrumiyah (Jurumiyah)
        </p>
      </div>

      {/* Panel Kontrol Dropdown Bab & Tombol Buka Arti */}
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
            ariaLabel="Pilih Bab Matan Al-Ajurumiyyah"
            kickerLabel="Daftar Bab Jurumiyah"
            value={activeBab?.id ?? selectedBabId}
            onChange={(val) => handleSelectBab(Number(val))}
            options={daftarBabJurumiyah.map((bab) => ({
              value: bab.id,
              label: `${bab.id}. ${bab.judulLatin}`,
              sublabel: bab.judulIndo || undefined,
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
          Ketuk poin matan untuk membuka arti
        </p>
      </div>

      {/* Bingkai Utama Kitab dengan Double Border */}
      {activeBab && (
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
              BAB {activeBab.id} • {activeBab.isi.length} POIN
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
            <p style={{ color: "var(--tashrif-muted)" }} className="text-xs font-semibold">
              {activeBab.judulLatin}
            </p>
            {activeBab.judulIndo && (
              <p style={{ color: "var(--tashrif-muted)" }} className="mt-0.5 text-[11px] opacity-90">
                {activeBab.judulIndo}
              </p>
            )}
          </div>

          <div>
            {activeBab.isi.map((item) => {
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
                    className="block w-full cursor-pointer px-3.5 py-3 transition-colors hover:bg-emerald-900/5 dark:hover:bg-amber-400/5"
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
                        {item.id}
                      </span>
                      {item.arab}
                    </p>
                  </button>

                  {isOpen && (
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
                          [{item.id}]
                        </span>
                        {item.terjemahan}
                      </div>

                      {item.catatan && (
                        <div
                          style={{
                            borderTop: "1px dotted var(--tashrif-border-cell)",
                            color: "var(--tashrif-muted)",
                          }}
                          className="mt-1.5 pt-1.5 text-[11px]"
                        >
                          <strong style={{ color: "var(--tashrif-accent)" }}>Catatan:</strong>{" "}
                          {item.catatan}
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

      {/* Navigasi Mengambang Sebelumnya / Selanjutnya */}
      <FloatingPageNav
        ariaLabel="Navigasi antar bab Matan Al-Ajurumiyyah"
        onPrev={() => goToBabByIndex(currentBabIndex - 1)}
        onNext={() => goToBabByIndex(currentBabIndex + 1)}
        canPrev={currentBabIndex > 0}
        canNext={currentBabIndex < semuaBabJurumiyah.length - 1}
        centerText={`${Math.max(1, currentBabIndex + 1)} / ${semuaBabJurumiyah.length}`}
      />
    </div>
  );
};

export default KitabJurumiyahReader;
