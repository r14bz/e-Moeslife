import React from "react";
import {
  BookMarked,
  BookOpen,
  Droplets,
  HandHeart,
  Library,
  Sparkles,
} from "lucide-react";
import type { LocalBookMeta } from "../types/emoeslife";

export type CollectionIconId =
  | "tahlil"
  | "yasin"
  | "rahman"
  | "wudhu-shalat"
  | "dzikir"
  | "doa"
  | "quran"
  | "tafsir"
  | "kitab";

interface CollectionVisualStyle {
  subtitle: string;
  boxClass: string;
  arrowClass: string;
  icon: React.ReactNode;
}

const RubElHizbIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="5" y="5" width="14" height="14" rx="1.5" />
    <rect x="5" y="5" width="14" height="14" rx="1.5" transform="rotate(45 12 12)" />
    <circle cx="12" cy="12" r="2.1" fill="currentColor" stroke="none" />
  </svg>
);

const MushafOpenIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M2 5.5A2.5 2.5 0 0 1 4.5 3H11a2 2 0 0 1 2 2v15a1.5 1.5 0 0 0-1.5-1.5H4.5A2.5 2.5 0 0 1 2 16V5.5Z" />
    <path d="M22 5.5A2.5 2.5 0 0 0 19.5 3H13a2 2 0 0 0-2 2v15a1.5 1.5 0 0 1 1.5-1.5h7A2.5 2.5 0 0 0 22 16V5.5Z" />
    <path d="M5.5 7.5h3M5.5 11h3M15.5 7.5h3M15.5 11h3" />
  </svg>
);

const TasbihIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="12" cy="5.2" r="1.7" />
    <circle cx="17.2" cy="7.5" r="1.5" />
    <circle cx="18.6" cy="12.6" r="1.5" />
    <circle cx="15.8" cy="17.2" r="1.5" />
    <circle cx="8.2" cy="17.2" r="1.5" />
    <circle cx="5.4" cy="12.6" r="1.5" />
    <circle cx="6.8" cy="7.5" r="1.5" />
    <path d="M12 18.5v3" />
    <circle cx="12" cy="18.2" r="1.8" fill="currentColor" stroke="none" />
  </svg>
);

export const COLLECTION_VISUALS: Record<CollectionIconId, CollectionVisualStyle> = {
  tahlil: {
    subtitle: "Tawasul, tahlil & doa",
    boxClass:
      "border-[#cde2d7] bg-[#ebf5ef] text-[#134a35] dark:border-[#1f4235] dark:bg-[#142b23] dark:text-[#74d6ab]",
    arrowClass:
      "bg-[#eef5f1] text-[#134a35] dark:bg-[#182942] dark:text-[#E2B354]",
    icon: <RubElHizbIcon className="h-5 w-5" />,
  },
  yasin: {
    subtitle: "83 ayat & keutamaan",
    boxClass:
      "border-[#e8d9b4] bg-[#fbf5e6] text-[#8d6820] dark:border-[#42351b] dark:bg-[#272011] dark:text-[#E2B354]",
    arrowClass:
      "bg-[#f8f3e6] text-[#8d6820] dark:bg-[#182942] dark:text-[#E2B354]",
    icon: <MushafOpenIcon className="h-5 w-5" />,
  },
  rahman: {
    subtitle: "78 ayat · Arab & arti",
    boxClass:
      "border-[#e8d9b4] bg-[#fbf5e6] text-[#8d6820] dark:border-[#42351b] dark:bg-[#272011] dark:text-[#E2B354]",
    arrowClass:
      "bg-[#f8f3e6] text-[#8d6820] dark:bg-[#182942] dark:text-[#E2B354]",
    icon: <Sparkles className="h-5 w-5" />,
  },
  "wudhu-shalat": {
    subtitle: "Tata cara, bacaan & gambar",
    boxClass:
      "border-[#cce0dd] bg-[#ecf5f4] text-[#184f4a] dark:border-[#1e3e3d] dark:bg-[#122828] dark:text-[#6ecbc3]",
    arrowClass:
      "bg-[#eef5f4] text-[#184f4a] dark:bg-[#182942] dark:text-[#E2B354]",
    icon: <Droplets className="h-5 w-5" />,
  },
  dzikir: {
    subtitle: "Wirid seusai shalat",
    boxClass:
      "border-[#cde2d7] bg-[#ebf5ef] text-[#134a35] dark:border-[#1f4235] dark:bg-[#142b23] dark:text-[#74d6ab]",
    arrowClass:
      "bg-[#eef5f1] text-[#134a35] dark:bg-[#182942] dark:text-[#E2B354]",
    icon: <TasbihIcon className="h-5 w-5" />,
  },
  doa: {
    subtitle: "Do'a pilihan harian",
    boxClass:
      "border-[#cce0dd] bg-[#ecf5f4] text-[#184f4a] dark:border-[#1e3e3d] dark:bg-[#122828] dark:text-[#6ecbc3]",
    arrowClass:
      "bg-[#eef5f4] text-[#184f4a] dark:bg-[#182942] dark:text-[#E2B354]",
    icon: <HandHeart className="h-5 w-5" />,
  },
  quran: {
    subtitle: "30 juz + audio qari",
    boxClass:
      "border-[#e8d9b4] bg-[#fbf5e6] text-[#8d6820] dark:border-[#42351b] dark:bg-[#272011] dark:text-[#E2B354]",
    arrowClass:
      "bg-[#f8f3e6] text-[#8d6820] dark:bg-[#182942] dark:text-[#E2B354]",
    icon: <BookOpen className="h-5 w-5" />,
  },
  tafsir: {
    subtitle: "Tafsir per surah",
    boxClass:
      "border-[#cce0dd] bg-[#ecf5f4] text-[#184f4a] dark:border-[#1e3e3d] dark:bg-[#122828] dark:text-[#6ecbc3]",
    arrowClass:
      "bg-[#eef5f4] text-[#184f4a] dark:bg-[#182942] dark:text-[#E2B354]",
    icon: <BookMarked className="h-5 w-5" />,
  },
  kitab: {
    subtitle: "18 kitab & syarah",
    boxClass:
      "border-[#0f3b2a] bg-[#134a35] text-[#f3d896] dark:border-[#c99b3c] dark:bg-[#E2B354] dark:text-[#0B111A]",
    arrowClass:
      "bg-[#eef5f1] text-[#134a35] dark:bg-[#182942] dark:text-[#E2B354]",
    icon: <Library className="h-5 w-5" />,
  },
};

interface KitabCoverTheme {
  gradient: string;
  arabicBadge: string;
}

function getKitabCoverTheme(category: string): KitabCoverTheme {
  const key = category.toLocaleLowerCase("id");
  if (key.includes("keluarga") || key.includes("fikih & adab")) {
    return {
      gradient: "from-[#6a2e3e] to-[#491d29]",
      arabicBadge: "أسرة",
    };
  }
  if (key.includes("fiqih") || key.includes("fikih")) {
    return {
      gradient: "from-[#14523b] to-[#0c3525]",
      arabicBadge: "فقه",
    };
  }
  if (key.includes("hadis") || key.includes("hadits")) {
    return {
      gradient: "from-[#1d3b66] to-[#122644]",
      arabicBadge: "حديث",
    };
  }
  if (key.includes("tasawuf")) {
    return {
      gradient: "from-[#633c29] to-[#432619]",
      arabicBadge: "تصوف",
    };
  }
  if (key.includes("tafsir")) {
    return {
      gradient: "from-[#4e5b27] to-[#364019]",
      arabicBadge: "تفسير",
    };
  }
  if (key.includes("aqidah")) {
    return {
      gradient: "from-[#1a4e52] to-[#103437]",
      arabicBadge: "عقيدة",
    };
  }
  if (key.includes("adab")) {
    return {
      gradient: "from-[#6f4f24] to-[#4d3516]",
      arabicBadge: "أدب",
    };
  }
  if (key.includes("alat") || key.includes("nahwu") || key.includes("bahasa")) {
    return {
      gradient: "from-[#2b4c5c] to-[#1a323e]",
      arabicBadge: "نحو",
    };
  }
  return {
    gradient: "from-[#27483b] to-[#172e25]",
    arabicBadge: "كتاب",
  };
}

export const KitabCoverMini: React.FC<{ category: string; size?: "sm" | "md" | "lg" }> = ({
  category,
  size = "md",
}) => {
  const cover = getKitabCoverTheme(category);
  const sizeClass =
    size === "lg"
      ? "h-15 w-11 sm:h-16 sm:w-12"
      : size === "sm"
      ? "h-10.5 w-8 sm:h-11.5 sm:w-8.5"
      : "h-12 w-9 sm:h-13 sm:w-10";
  const badgeTextClass =
    size === "lg" ? "text-xs sm:text-sm" : size === "sm" ? "text-[10px] sm:text-[11px]" : "text-[11px] sm:text-xs";

  return (
    <div
      aria-hidden="true"
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-r-md rounded-l-[3px] bg-gradient-to-br ${cover.gradient} ${sizeClass} shadow-xs ring-1 ring-black/10 transition-transform duration-200 group-hover:scale-[1.03]`}
    >
      {/* Binding spine ridge */}
      <span className="absolute inset-y-0 left-0 w-[5px] bg-black/25" />
      <span className="absolute inset-y-0 left-[5px] w-[1px] bg-white/20" />
      {/* Gold leaf inner frame */}
      <span className="pointer-events-none absolute inset-[3.5px] left-[7px] rounded-[2px] border border-[#e7c97f]/45" />
      {/* White page block hint along right edge */}
      <span className="absolute inset-y-[2px] right-0 w-[2px] bg-white/85" />
      <span className={`font-arabic pl-1 leading-none font-bold text-[#f3d99d] select-none ${badgeTextClass}`}>
        {cover.arabicBadge}
      </span>
    </div>
  );
};

export function getKitabSubtitle(book: LocalBookMeta): string {
  if (book.source === "local") {
    return `${book.category} · Kitab Lokal`;
  }
  return `${book.category} · Referensi`;
}
