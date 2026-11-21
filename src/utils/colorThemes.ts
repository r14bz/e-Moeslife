import type { ColorThemeId, ThemeMode } from "../types/emoeslife";

export interface ColorThemeMeta {
  id: ColorThemeId;
  name: string;
  subtitle: string;
  swatchPrimary: string;
  swatchAccent: string;
  swatchDarkSurface: string;
  swatchDarkAccent: string;
  metaThemeColorLight: string;
  metaThemeColorDark: string;
}

export const DEFAULT_COLOR_THEME: ColorThemeId = "emerald";

export const COLOR_THEMES: ReadonlyArray<ColorThemeMeta> = [
  {
    id: "emerald",
    name: "Zamrud Emas",
    subtitle: "Hijau pesantren & aksen emas",
    swatchPrimary: "#134a35",
    swatchAccent: "#c99b3c",
    swatchDarkSurface: "#0f1722",
    swatchDarkAccent: "#e2b354",
    metaThemeColorLight: "#134a35",
    metaThemeColorDark: "#0a1018",
  },
  {
    id: "sapphire",
    name: "Biru Nilam",
    subtitle: "Biru malam & pasir madinah",
    swatchPrimary: "#1a3e6e",
    swatchAccent: "#b88a3a",
    swatchDarkSurface: "#0f1a2b",
    swatchDarkAccent: "#7bb3f8",
    metaThemeColorLight: "#1a3e6e",
    metaThemeColorDark: "#080f1a",
  },
  {
    id: "teal",
    name: "Toska Kubah",
    subtitle: "Toska zamrud & perunggu",
    swatchPrimary: "#0e5256",
    swatchAccent: "#b27d3c",
    swatchDarkSurface: "#0e1f23",
    swatchDarkAccent: "#54cfc2",
    metaThemeColorLight: "#0e5256",
    metaThemeColorDark: "#071316",
  },
  {
    id: "maroon",
    name: "Delima Turats",
    subtitle: "Merah marun jilid kitab",
    swatchPrimary: "#682231",
    swatchAccent: "#c99b3c",
    swatchDarkSurface: "#1e1118",
    swatchDarkAccent: "#e4b45c",
    metaThemeColorLight: "#682231",
    metaThemeColorDark: "#140b10",
  },
  {
    id: "sepia",
    name: "Perkamen Klasik",
    subtitle: "Kertas gading & cokelat kayu",
    swatchPrimary: "#5c3f28",
    swatchAccent: "#a97d32",
    swatchDarkSurface: "#1e1812",
    swatchDarkAccent: "#dfb367",
    metaThemeColorLight: "#5c3f28",
    metaThemeColorDark: "#14100c",
  },
];

export function isColorThemeId(value: string | null | undefined): value is ColorThemeId {
  return COLOR_THEMES.some((item) => item.id === value);
}

export function getColorThemeMeta(id: ColorThemeId): ColorThemeMeta {
  return COLOR_THEMES.find((item) => item.id === id) ?? COLOR_THEMES[0];
}

export function getThemeMetaColor(id: ColorThemeId, mode: ThemeMode): string {
  const meta = getColorThemeMeta(id);
  return mode === "dark" ? meta.metaThemeColorDark : meta.metaThemeColorLight;
}
