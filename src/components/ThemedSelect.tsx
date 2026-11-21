import React, { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface ThemedSelectOption<T extends string | number = string> {
  value: T;
  label: string;
  sublabel?: string;
  disabled?: boolean;
}

interface ThemedSelectProps<T extends string | number = string> {
  value: T;
  options: ReadonlyArray<ThemedSelectOption<T>>;
  onChange: (value: T) => void;
  ariaLabel: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  kickerLabel?: string;
  className?: string;
}

export function ThemedSelect<T extends string | number = string>({
  value,
  options,
  onChange,
  ariaLabel,
  id,
  placeholder = "Pilih item…",
  disabled = false,
  kickerLabel,
  className = "flex-1",
}: ThemedSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedOptionRef = useRef<HTMLButtonElement | null>(null);
  const listboxId = useId();

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  useEffect(() => {
    if (!open) return;

    const updatePlacement = () => {
      const el = rootRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setOpenUpward(spaceBelow < 240 && spaceAbove > spaceBelow);
    };

    updatePlacement();

    const frame = window.requestAnimationFrame(() => {
      selectedOptionRef.current?.scrollIntoView({ block: "nearest" });
    });

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, { passive: true });
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updatePlacement);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updatePlacement);
    };
  }, [open]);

  const handleToggle = () => {
    if (disabled || options.length === 0) return;
    setOpen((prev) => !prev);
  };

  const handleSelect = (option: ThemedSelectOption<T>) => {
    if (option.disabled) return;
    onChange(option.value);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={ariaLabel}
        style={{
          border: "1.5px solid var(--tashrif-border-strong)",
          backgroundColor: "var(--tashrif-control-bg)",
          color: "var(--tashrif-text)",
          boxShadow: open ? "0 0 0 3px var(--tashrif-floating-border)" : undefined,
        }}
        className="flex min-h-[42px] w-full items-center justify-between gap-2 rounded-xl px-3 py-1.5 text-left text-xs font-bold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-55 sm:text-[13px]"
      >
        <span className="min-w-0 flex-1 truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span
          style={{
            backgroundColor: "var(--tashrif-wazan-bg)",
            border: "1px solid var(--tashrif-border-cell)",
            color: "var(--tashrif-accent)",
          }}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
        >
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-150 ${
              open ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          style={{
            backgroundColor: "var(--tashrif-paper)",
            border: "1.5px solid var(--tashrif-border-strong)",
            boxShadow: "var(--tashrif-dropdown-shadow)",
          }}
          className={`absolute left-0 right-0 z-50 overflow-hidden rounded-xl ${
            openUpward ? "bottom-full mb-1.5" : "top-full mt-1.5"
          }`}
        >
          <div
            style={{
              backgroundColor: "var(--tashrif-wazan-bg)",
              borderBottom: "1px solid var(--tashrif-border-cell)",
            }}
            className="flex items-center justify-between gap-2 px-3 py-2"
          >
            <span
              style={{ color: "var(--tashrif-accent)" }}
              className="truncate text-[11px] font-bold tracking-wider uppercase"
            >
              {kickerLabel || ariaLabel}
            </span>
            <span
              style={{ color: "var(--tashrif-muted)" }}
              className="font-mono-tabular shrink-0 text-[11px] font-semibold"
            >
              {options.length} pilihan
            </span>
          </div>

          <div className="max-h-[min(54vh,300px)] space-y-0.5 overflow-y-auto p-1.5">
            {options.map((opt, idx) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={`${String(opt.value)}-${idx}`}
                  ref={isSelected ? selectedOptionRef : undefined}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={opt.disabled}
                  onClick={() => handleSelect(opt)}
                  style={
                    isSelected
                      ? {
                          backgroundColor: "var(--tashrif-btn-bg)",
                          color: "var(--tashrif-btn-text)",
                        }
                      : { color: "var(--tashrif-text)" }
                  }
                  className={`flex min-h-[40px] w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors disabled:opacity-45 ${
                    isSelected
                      ? "font-bold"
                      : "font-semibold hover:bg-[var(--tashrif-dropdown-hover)]"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <span className="block truncate">{opt.label}</span>
                    {opt.sublabel && (
                      <span
                        style={!isSelected ? { color: "var(--tashrif-muted)" } : undefined}
                        className={`mt-0.5 block truncate text-[11px] ${
                          isSelected ? "opacity-85" : ""
                        }`}
                      >
                        {opt.sublabel}
                      </span>
                    )}
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ThemedSelect;
