import React, { useEffect, useMemo, useRef, useState } from "react";
import { kitabNashoihulIbad, type BabNashoihulIbad } from "../data/nashoihul-ibad";
import { ThemedSelect } from "./ThemedSelect";
import { FloatingPageNav } from "./FloatingPageNav";

interface KitabNashoihulIbadReaderProps {
  initialBabId?: string;
}

export const KitabNashoihulIbadReader: React.FC<KitabNashoihulIbadReaderProps> = ({
  initialBabId = "bab-1",
}) => {
  const defaultBabId = kitabNashoihulIbad[0]?.id ?? "bab-1";
  const [selectedBabId, setSelectedBabId] = useState<string>(initialBabId || defaultBabId);
  const [openAllArti, setOpenAllArti] = useState<boolean>(false);
  const [openItemIds, setOpenItemIds] = useState<Record<string, boolean>>({});
  const readingCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const valid = kitabNashoihulIbad.some((b) => b.id === initialBabId)
      ? initialBabId
      : defaultBabId;
    setSelectedBabId(valid);
    setOpenItemIds({});
  }, [initialBabId, defaultBabId]);

  const currentBabIndex = useMemo(
    () => kitabNashoihulIbad.findIndex((b) => b.id === selectedBabId),
    [selectedBabId]
  );

  const activeBab: BabNashoihulIbad | undefined =
    currentBabIndex >= 0 ? kitabNashoihulIbad[currentBabIndex] : kitabNashoihulIbad[0];

  const handleSelectBab = (id: string) => {
    setSelectedBabId(id);
    setOpenItemIds({});
    window.requestAnimationFrame(() => {
      readingCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const toggleSingleTerjemahan = (maqalahId: string) => {
    setOpenItemIds((prev) => ({
      ...prev,
      [maqalahId]: !(prev[maqalahId] ?? openAllArti),
    }));
  };

  const handleToggleAll = () => {
    const nextState = !openAllArti;
    setOpenAllArti(nextState);
    setOpenItemIds({});
  };

  const goToBabByIndex = (index: number) => {
    if (index >= 0 && index < kitabNashoihulIbad.length) {
      handleSelectBab(kitabNashoihulIbad[index].id);
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
      {/* Banner Header Hijau Zamrud (Senada Jurumiyah, Alfiyah, Imrithi & Tashrif) */}
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
          نَصَائِحُ الْعِبَادِ
        </h1>
        <p style={{ color: "var(--tashrif-panel-sub)" }} className="text-xs font-semibold">
          Kitab Nashoihul Ibad — Syekh Muhammad Nawawi al-Bantani
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
            ariaLabel="Pilih Bab Kitab Nashoihul Ibad"
            kickerLabel="Daftar Bab Nashoihul Ibad"
            value={activeBab?.id ?? selectedBabId}
            onChange={(val) => handleSelectBab(String(val))}
            options={kitabNashoihulIbad.map((bab) => ({
              value: bab.id,
              label: bab.judulIndonesia,
              sublabel: bab.judulLatin,
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
          Ketuk maqalah untuk membuka arti, rincian perkara &amp; syarah
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
              BAB {activeBab.nomorBab} • {activeBab.daftarMaqalah.length} MAQALAH
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
            <p style={{ color: "var(--tashrif-muted)" }} className="mt-0.5 text-[11px] font-medium opacity-95">
              {activeBab.judulIndonesia}
            </p>
            {activeBab.deskripsiSingkat && (
              <p style={{ color: "var(--tashrif-muted)" }} className="mt-1 text-[11px] leading-relaxed opacity-85">
                {activeBab.deskripsiSingkat}
              </p>
            )}
          </div>

          <div>
            {activeBab.daftarMaqalah.map((maqalah) => {
              const isOpen = openItemIds[maqalah.id] ?? openAllArti;

              return (
                <div
                  key={maqalah.id}
                  style={{ borderBottom: "1px solid var(--tashrif-border-cell)" }}
                  className="last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() => toggleSingleTerjemahan(maqalah.id)}
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
                        {maqalah.nomorMaqalah}
                      </span>
                      {maqalah.arabUtama}
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
                      {maqalah.sumber && (
                        <div
                          style={{ color: "var(--tashrif-accent)" }}
                          className="mb-1 text-[11px] font-bold"
                        >
                          Maqalah {maqalah.nomorMaqalah} · {maqalah.sumber}
                        </div>
                      )}

                      {maqalah.latinUtama && (
                        <p
                          style={{ color: "var(--tashrif-muted)" }}
                          className="mb-1.5 text-[11px] italic leading-relaxed sm:text-xs"
                        >
                          {maqalah.latinUtama}
                        </p>
                      )}

                      <div>
                        <span
                          style={{ color: "var(--tashrif-accent)" }}
                          className="mr-1.5 font-mono-tabular font-bold"
                        >
                          [{maqalah.nomorMaqalah}]
                        </span>
                        {maqalah.terjemahUtama}
                      </div>

                      {maqalah.poinPerkara && maqalah.poinPerkara.length > 0 && (
                        <div
                          style={{ borderTop: "1px dotted var(--tashrif-border-cell)" }}
                          className="mt-2 pt-2"
                        >
                          <span
                            style={{ color: "var(--tashrif-accent)" }}
                            className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider"
                          >
                            Rincian Perkara:
                          </span>
                          <div className="space-y-1.5">
                            {maqalah.poinPerkara.map((poin, idx) => (
                              <div
                                key={`${maqalah.id}-poin-${poin.nomor ?? idx}`}
                                style={{
                                  backgroundColor: "var(--tashrif-paper)",
                                  border: "1px solid var(--tashrif-border-cell)",
                                }}
                                className="rounded-lg px-2.5 py-2"
                              >
                                <p
                                  dir="rtl"
                                  lang="ar"
                                  style={{
                                    color: "var(--tashrif-ink)",
                                    lineHeight: "1.9",
                                  }}
                                  className="font-arabic text-right text-base sm:text-lg"
                                >
                                  <span
                                    style={{
                                      backgroundColor: "var(--tashrif-wazan-bg)",
                                      border: "1px solid var(--tashrif-border-cell)",
                                      color: "var(--tashrif-accent)",
                                    }}
                                    className="ml-1.5 inline-block rounded px-1.5 py-0.5 align-middle font-mono-tabular text-[10px] font-bold"
                                  >
                                    {poin.nomor ?? idx + 1}
                                  </span>
                                  {poin.arab}
                                </p>
                                {poin.latin && (
                                  <p
                                    style={{ color: "var(--tashrif-muted)" }}
                                    className="mt-0.5 text-[11px] italic"
                                  >
                                    {poin.latin}
                                  </p>
                                )}
                                <p
                                  style={{ color: "var(--tashrif-text)" }}
                                  className="mt-1 text-xs font-semibold"
                                >
                                  {poin.arti}
                                </p>
                                {poin.penjelasan && (
                                  <p
                                    style={{ color: "var(--tashrif-muted)" }}
                                    className="mt-0.5 text-[11px] leading-relaxed"
                                  >
                                    {poin.penjelasan}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {maqalah.syarah && (
                        <div
                          style={{
                            borderTop: "1px dotted var(--tashrif-border-cell)",
                            color: "var(--tashrif-muted)",
                          }}
                          className="mt-2 pt-1.5 text-[11px] leading-relaxed"
                        >
                          <strong style={{ color: "var(--tashrif-accent)" }}>
                            Syarah Syekh Nawawi:
                          </strong>{" "}
                          {maqalah.syarah}
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
        ariaLabel="Navigasi antar bab Nashoihul Ibad"
        onPrev={() => goToBabByIndex(currentBabIndex - 1)}
        onNext={() => goToBabByIndex(currentBabIndex + 1)}
        canPrev={currentBabIndex > 0}
        canNext={currentBabIndex < kitabNashoihulIbad.length - 1}
        centerText={`${Math.max(1, currentBabIndex + 1)} / ${kitabNashoihulIbad.length}`}
      />
    </div>
  );
};

export default KitabNashoihulIbadReader;
