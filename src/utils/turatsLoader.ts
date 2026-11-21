import type { BabKitab, DataKitabTurats } from "../types/kitabTurats";

export type TuratsSlug =
  | "qarib"
  | "fathul-muin"
  | "kasyifatus-saja"
  | "bahjatul-wasail"
  | "alhikam";

export const TURATS_BOOK_SLUGS: ReadonlyArray<TuratsSlug> = [
  "qarib",
  "fathul-muin",
  "kasyifatus-saja",
  "bahjatul-wasail",
  "alhikam",
];

function normalisasiJudulBab(judul: string): string {
  return judul
    .replace(/\s*\((lanjutan|bagian\s*\d+|part\s*\d+)\)\s*$/i, "")
    .replace(/\s*[-–]\s*(bagian|part)\s*\d+\s*$/i, "")
    .trim();
}

export function gabungkanMenjadiBabUtuh(kitab: DataKitabTurats): DataKitabTurats {
  const hasilBab: BabKitab[] = [];
  let halAwalBab = 1;

  for (const lembaran of kitab.daftarLembaran) {
    const judulNorm =
      normalisasiJudulBab(lembaran.judulLatin) || `Halaman ${lembaran.nomorLembaran}`;
    const babTerakhir = hasilBab[hasilBab.length - 1];

    if (babTerakhir && babTerakhir.judulLatin.toLowerCase() === judulNorm.toLowerCase()) {
      for (const p of lembaran.paragraf) {
        const nomorBaru = babTerakhir.paragraf.length + 1;
        babTerakhir.paragraf.push({
          id: `${babTerakhir.id}-p${nomorBaru}`,
          nomor: nomorBaru,
          arab: p.arab,
          arti: p.arti,
        });
      }
      babTerakhir.rentangHalaman =
        halAwalBab === lembaran.nomorLembaran
          ? `Hal ${halAwalBab}`
          : `Hal ${halAwalBab}–${lembaran.nomorLembaran}`;
    } else {
      const nomorBab = hasilBab.length + 1;
      const babId = `${kitab.id}-bab-${String(nomorBab).padStart(3, "0")}`;
      halAwalBab = lembaran.nomorLembaran;
      hasilBab.push({
        id: babId,
        nomorBab,
        judulArab: lembaran.judulArab,
        judulLatin: judulNorm,
        rentangHalaman: `Hal ${lembaran.nomorLembaran}`,
        paragraf: lembaran.paragraf.map((p, idx) => ({
          id: `${babId}-p${idx + 1}`,
          nomor: idx + 1,
          arab: p.arab,
          arti: p.arti,
        })),
      });
    }
  }

  return {
    ...kitab,
    daftarBab: hasilBab,
  };
}

const turatsCache: Partial<Record<TuratsSlug, DataKitabTurats>> = {};

export async function loadTuratsBook(slug: TuratsSlug): Promise<DataKitabTurats> {
  const cached = turatsCache[slug];
  if (cached) return cached;

  let raw: DataKitabTurats;
  switch (slug) {
    case "qarib": {
      const { kitabFathulQarib } = await import("../data/fathulQarib");
      raw = kitabFathulQarib;
      break;
    }
    case "fathul-muin": {
      const { kitabFathulMuin } = await import("../data/fathulMuin");
      raw = kitabFathulMuin;
      break;
    }
    case "kasyifatus-saja": {
      const { kitabKasyifatusSaja } = await import("../data/kasyifatusSaja");
      raw = kitabKasyifatusSaja;
      break;
    }
    case "bahjatul-wasail": {
      const { kitabBahjatulWasail } = await import("../data/bahjatulWasail");
      raw = kitabBahjatulWasail;
      break;
    }
    case "alhikam": {
      const { kitabAlHikam } = await import("../data/alHikam");
      raw = kitabAlHikam;
      break;
    }
  }

  const merged = gabungkanMenjadiBabUtuh(raw);
  turatsCache[slug] = merged;
  return merged;
}
