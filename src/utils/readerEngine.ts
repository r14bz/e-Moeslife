import type { ClassicSection } from "../data/sections";
import type { ClassicPage, CollectionKind } from "../types/emoeslife";

export const CONTENTS_GROUPS: ReadonlyArray<{
  key: CollectionKind;
  title: string;
  matches: (section: Partial<ClassicSection>) => boolean;
}> = [
  { key: "tahlil", title: "Tahlil", matches: (s) => !s.quranSurah && !s.collection },
  { key: "yasin", title: "Surah Yasin", matches: (s) => s.quranSurah === 36 },
  { key: "rahman", title: "Surah Ar-Rahman", matches: (s) => s.quranSurah === 55 },
  { key: "dzikir", title: "Dzikir", matches: (s) => s.collection === "dzikir" },
];

export function findCollectionStart(sections: ClassicSection[], kind: CollectionKind): number {
  return sections.findIndex((section) => {
    if (kind === "tahlil") return !section.quranSurah && !section.collection;
    if (kind === "dzikir") return section.collection === "dzikir";
    if (kind === "yasin") return section.quranSurah === 36;
    if (kind === "rahman") return section.quranSurah === 55;
    return false;
  });
}

export function getReadingGroup(page?: Partial<ClassicSection>): string {
  if (page?.quranSurah) return `quran-${page.quranSurah}`;
  return page?.collection === "dzikir" ? "dzikir" : "tahlil";
}

export function getReadingGroupBounds(pages: ClassicPage[], index: number): { start: number; end: number } {
  if (!Array.isArray(pages) || pages.length === 0) return { start: 0, end: -1 };
  const safeIndex = Math.max(0, Math.min(Number.isInteger(index) ? index : 0, pages.length - 1));
  const group = getReadingGroup(pages[safeIndex]);
  let start = safeIndex;
  let end = safeIndex;
  while (start > 0 && getReadingGroup(pages[start - 1]) === group) start -= 1;
  while (end + 1 < pages.length && getReadingGroup(pages[end + 1]) === group) end += 1;
  return { start, end };
}

export function getPageProgress(
  index: number,
  bounds: { start: number; end: number }
): { current: number; total: number; percent: number } {
  const total = Math.max(0, bounds.end - bounds.start + 1);
  const current = total ? Math.max(1, Math.min(index - bounds.start + 1, total)) : 0;
  return {
    current,
    total,
    percent: total ? Math.round((current / total) * 100) : 0,
  };
}

export function getSwipeDirection({
  dx,
  dy,
  duration,
  minDistance = 48,
  maxDuration = 900,
  axisRatio = 1.25,
}: {
  dx: number;
  dy: number;
  duration: number;
  minDistance?: number;
  maxDuration?: number;
  axisRatio?: number;
}): "next" | "prev" | null {
  if (![dx, dy, duration].every(Number.isFinite)) return null;
  if (Math.abs(dx) < minDistance || Math.abs(dx) < Math.abs(dy) * axisRatio || duration > maxDuration) {
    return null;
  }
  return dx < 0 ? "next" : "prev";
}

export function filterReadingSections(
  sections: ClassicSection[],
  query = "",
  predicate: (s: ClassicSection) => boolean = () => true
): Array<{ s: ClassicSection; i: number }> {
  const normalizedQuery = String(query).trim().toLocaleLowerCase("id");
  return sections
    .map((section, index) => ({ s: section, i: index }))
    .filter(
      ({ s }) =>
        predicate(s) &&
        (!normalizedQuery || String(s.title || "").toLocaleLowerCase("id").includes(normalizedQuery))
    );
}

export function applyDzikirOverrides(
  sections: ClassicSection[],
  data: { sections?: Array<{ text?: string }> } | null
): number {
  if (!Array.isArray(data?.sections)) return 0;
  const dzikir = sections.filter((section) => section.collection === "dzikir");
  let applied = 0;
  data.sections.forEach((item, index) => {
    if (dzikir[index] && typeof item?.text === "string" && item.text.trim()) {
      dzikir[index].text = item.text;
      applied += 1;
    }
  });
  return applied;
}

export function isValidManualDzikirLayout(layout: Record<string, unknown> | null): boolean {
  return Boolean(
    layout &&
      layout.format === "etahlil-dzikir-page-layout" &&
      layout.scope === "dzikir-ba-da-shalat" &&
      Number.isSafeInteger(Number(layout.sectionIndex)) &&
      Number(layout.sectionIndex) >= 0 &&
      typeof layout.text === "string" &&
      layout.text.includes("[[HALAMAN BARU]]")
  );
}

export function prepareReadingSections(
  sections: ClassicSection[],
  pageLayout: Record<number, string> = {}
): Array<ClassicSection & { originalIndex: number }> {
  const manualDzikirLayoutIndex = Object.keys(pageLayout)
    .map(Number)
    .find(
      (index) =>
        sections[index]?.collection === "dzikir" &&
        typeof pageLayout[index] === "string" &&
        pageLayout[index].includes("[[HALAMAN BARU]]")
    );

  return sections.flatMap((section, index) => {
    if (
      manualDzikirLayoutIndex !== undefined &&
      section.collection === "dzikir" &&
      index !== manualDzikirLayoutIndex
    ) {
      return [];
    }
    const item: ClassicSection & { originalIndex: number } = { ...section, originalIndex: index };
    if (Object.prototype.hasOwnProperty.call(pageLayout, index) && typeof pageLayout[index] === "string") {
      item.pageLayoutText = pageLayout[index];
    }
    return [item];
  });
}

export function completeSectionStarts(sectionStarts: Array<number | undefined>, sectionCount: number): number[] {
  const completed = Array.from({ length: sectionCount }, (_, index) => sectionStarts[index]);
  let pageCursor = 0;
  return completed.map((start) => {
    const resolved = start === undefined ? Math.max(0, pageCursor) : start;
    pageCursor = resolved;
    return resolved;
  });
}

export function splitSectionForScreen(
  section: ClassicSection,
  sectionIndex: number,
  availableHeight: number,
  width: number,
  textElement: HTMLElement
): ClassicPage[] {
  const out: ClassicPage[] = [];
  let chunk = "";
  const computed = window.getComputedStyle(textElement);
  const probe = textElement.cloneNode(false) as HTMLElement;
  probe.removeAttribute("id");
  probe.style.cssText = [
    "position:fixed",
    "left:-10000px",
    "top:0",
    "visibility:hidden",
    "display:block",
    "flex:none",
    "min-height:0",
    "height:auto",
    "max-height:none",
    "overflow:visible",
    `width:${width}px`,
    `font-family:${computed.fontFamily}`,
    `font-size:${computed.fontSize}`,
    `line-height:${computed.lineHeight}`,
    `white-space:pre-wrap`,
    `text-align:${section.quranSurah ? "justify" : computed.textAlign}`,
    "direction:rtl",
  ].join(";");
  document.body.appendChild(probe);

  const measure = (value: string) => {
    probe.textContent = value;
    return probe.scrollHeight;
  };
  const push = (value: string) => {
    if (value.trim()) {
      out.push({ ...section, text: value.trim(), sectionIndex, continuation: out.length > 0 });
    }
  };
  const addWords = (value: string) => {
    const words = value.split(/\s+/u).filter(Boolean);
    let part = "";
    for (const word of words) {
      const candidate = part ? `${part} ${word}` : word;
      if (measure(candidate) > availableHeight && part) {
        push(part);
        part = word;
      } else {
        part = candidate;
      }
    }
    if (part) push(part);
  };

  if (typeof section.pageLayoutText === "string" && section.pageLayoutText.includes("[[HALAMAN BARU]]")) {
    const groups = section.pageLayoutText
      .split(/\n[ \t]*\[\[HALAMAN BARU\]\][ \t]*\n/u)
      .map((x) => x.trim())
      .filter(Boolean);
    for (const group of groups) {
      if (measure(group) <= availableHeight) {
        push(group);
        continue;
      }
      const lines = group.split(/(?<=\n)/u);
      let lineChunk = "";
      for (const line of lines) {
        const candidate = lineChunk + line;
        if (lineChunk && measure(candidate.trim()) > availableHeight) {
          push(lineChunk);
          lineChunk = line;
        } else {
          lineChunk = candidate;
        }
      }
      if (lineChunk.trim()) push(lineChunk);
    }
    probe.remove();
    return out.length ? out : [{ ...section, sectionIndex, continuation: false }];
  }

  const units = section.quranSurah
    ? (section.text.match(/[\s\S]*?۝[٠-٩۰-۹0-9]{1,3}|[\s\S]+$/gu) || [section.text])
        .map((x) => x.trim())
        .filter(Boolean)
    : section.preserveAyat
    ? section.text.split(/(?<=۝)/u).map((x) => x.trim()).filter(Boolean)
    : section.tahlilGroup || section.preserveSeparators
    ? section.text.split(/\n{2,}/u).map((x) => x.trim()).filter(Boolean)
    : section.text.split(/\n+/u).map((x) => x.trim()).filter(Boolean);

  for (const unit of units) {
    const separator = section.quranSurah
      ? " "
      : section.tahlilGroup || section.preserveSeparators
      ? "\n\n\n"
      : "\n";
    const candidate = chunk ? chunk + separator + unit : unit;
    if (measure(candidate) > availableHeight && chunk) {
      push(chunk);
      chunk = "";
    }
    if (measure(unit) > availableHeight) {
      if (chunk) {
        push(chunk);
        chunk = "";
      }
      if (section.quranSurah || section.preserveAyat) {
        push(unit);
      } else {
        addWords(unit);
      }
    } else {
      chunk = chunk ? chunk + separator + unit : unit;
    }
  }

  if (chunk) push(chunk);
  probe.remove();
  return out.length ? out : [{ ...section, sectionIndex, continuation: false }];
}
