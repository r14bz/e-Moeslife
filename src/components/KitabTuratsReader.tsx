import React, { useEffect, useMemo, useRef, useState } from "react";
import type { BabKitab, DataKitabTurats } from "../types/kitabTurats";
import { loadTuratsBook, type TuratsSlug } from "../utils/turatsLoader";
import { ThemedSelect } from "./ThemedSelect";
import { FloatingPageNav } from "./FloatingPageNav";

interface KitabTuratsReaderProps {
  slug: TuratsSlug;
  initialBabIndex?: number;
}

export const KitabTuratsReader: React.FC<KitabTuratsReaderProps> = ({
  slug,
  initialBabIndex = 0,
}) => {
  const [kitab, setKitab] = useState<DataKitabTurats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(Math.max(0, initialBabIndex || 0));
  const [openAllArti, setOpenAllArti] = useState<boolean>(false);
  const [openItemIds, setOpenItemIds] = useState<Record<string, boolean>>({});
  const readingCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setKitab(null);

    loadTuratsBook(slug)
      .then((loaded) => {
        if (!active) return;
        setKitab(loaded);
        const total = loaded.daftarBab?.length ?? 0;
        const clamped =
          typeof initialBabIndex === "number" && initialBabIndex >= 0 && initialBabIndex < total
            ? initialBabIndex
            : 0;
        setSelectedIndex(clamped);
        setOpenItemIds({});
      })
      .catch(() => {
        if (!active) return;
        setError("Gagal memuat naskah kitab. Silakan coba kembali.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug, initialBabIndex]);

  const daftarBab: BabKitab[] = useMemo(() => kitab?.daftarBab ?? [], [kitab]);

  const safeIndex = useMemo(() => {
    if (!daftarBab.length) return 0;
    return Math.min(Math.max(0, selectedIndex), daftarBab.length - 1);
  }, [daftarBab.length, selectedIndex]);

  const activeBab: BabKitab | undefined = daftarBab[safeIndex];

  const scrollToReadingCard = () => {
    window.requestAnimationFrame(() => {
      readingCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleSelectBab = (idx: number) => {
    if (idx >= 0 && idx < daftarBab.length) {
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

  if (loading) {
    return (
      <div
        style={{
          padding: "1.5rem 0.75rem",
          backgroundColor: "var(--tashrif-bg)",
          color: "var(--tashrif-muted)",
        }}
        className="mx-auto max-w-2xl"
      >
        <div
          style={{
            backgroundColor: "var(--tashrif-paper)",
            border: "1px solid var(--tashrif-border-cell)",
            borderRadius: "0.75rem",
          }}
          className="p-6 text-center text-xs font-semibold shadow-xs"
        >
          Memuat naskah kitab…
        </div>
      </div>
    );
  }

  if (error || !kitab) {
    return (
      <div
        style={{
          padding: "1.5rem 0.75rem",
          backgroundColor: "var(--tashrif-bg)",
          color: "var(--tashrif-text)",
        }}
        className="mx-auto max-w-2xl"
      >
        <div
          style={{
            backgroundColor: "var(--tashrif-paper)",
            border: "1px solid var(--tashrif-border-cell)",
            borderRadius: "0.75rem",
          }}
          className="p-6 text-center text-xs font-semibold shadow-xs"
        >
          {error || "Data kitab belum tersedia."}
        </div>
      </div>
    );
  }

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
          {kitab.judulArab}
        </h1>
        <p style={{ color: "var(--tashrif-panel-sub)" }} className="text-xs font-semibold">
          {kitab.judulLatin} — {kitab.pengarang} ({daftarBab.length} Bab)
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
            ariaLabel={`Pilih Bab ${kitab.judulLatin}`}
            kickerLabel={`Daftar Bab ${kitab.judulLatin}`}
            value={safeIndex}
            onChange={(val) => handleSelectBab(Number(val))}
            options={daftarBab.map((bab, idx) => ({
              value: idx,
              label: `${bab.nomorBab}. ${bab.judulLatin}`,
              sublabel: bab.rentangHalaman,
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
              BAB {activeBab.nomorBab} / {daftarBab.length} • {activeBab.paragraf.length} POIN •{" "}
              {activeBab.rentangHalaman}
            </span>
            {activeBab.judulArab && (
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
            )}
            <p style={{ color: "var(--tashrif-muted)" }} className="text-xs font-semibold">
              {activeBab.judulLatin}
            </p>
          </div>

          <div>
            {activeBab.paragraf.map((item) => {
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
        ariaLabel={`Navigasi antar bab ${kitab.judulLatin}`}
        onPrev={() => handleSelectBab(safeIndex - 1)}
        onNext={() => handleSelectBab(safeIndex + 1)}
        canPrev={safeIndex > 0}
        canNext={safeIndex < daftarBab.length - 1}
        centerText={`${safeIndex + 1} / ${daftarBab.length}`}
      />
    </div>
  );
};

export default KitabTuratsReader;
