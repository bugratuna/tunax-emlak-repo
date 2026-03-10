"use client";

import { useRef, useState, useCallback, useId } from "react";
import { ChevronDown, MapPin, X } from "lucide-react";
import { NEIGHBORHOODS } from "@/lib/geo/antalya";

// ── Turkish character normalizer for fuzzy matching ───────────────────────────

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/İ/g, "i")
    .replace(/Ş/g, "s")
    .replace(/Ğ/g, "g")
    .replace(/Ü/g, "u")
    .replace(/Ö/g, "o")
    .replace(/Ç/g, "c");
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Option {
  neighborhood: string;
  district: string;
}

export interface NeighborhoodComboboxProps {
  /** When set, only shows neighborhoods for this district. */
  district?: string;
  value: string;
  onChange: (neighborhood: string) => void;
  /** Fires true when the current value is a canonical list member, false otherwise. */
  onValidChange?: (valid: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Error message to show below the input. */
  error?: string;
  id?: string;
}

// ── Build flat option list ────────────────────────────────────────────────────

function buildOptions(district?: string): Option[] {
  if (district && NEIGHBORHOODS[district]) {
    return NEIGHBORHOODS[district].map((n) => ({ neighborhood: n, district }));
  }
  // No district selected — return all (for hero search)
  return Object.entries(NEIGHBORHOODS).flatMap(([d, ns]) =>
    ns.map((n) => ({ neighborhood: n, district: d })),
  );
}

function isCanonical(value: string, district?: string): boolean {
  if (!value) return false;
  const opts = buildOptions(district);
  return opts.some(
    (o) => o.neighborhood.toLowerCase() === value.toLowerCase(),
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function NeighborhoodCombobox({
  district,
  value,
  onChange,
  onValidChange,
  placeholder = "Mahalle seçin…",
  disabled = false,
  error,
  id: externalId,
}: NeighborhoodComboboxProps) {
  const generatedId = useId();
  const inputId = externalId ?? generatedId;

  const [prevValue, setPrevValue] = useState(value);
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Derived-state sync: reset query/activeIdx when controlled value changes externally.
  // getDerivedStateFromProps pattern — no effect needed.
  if (prevValue !== value) {
    setPrevValue(value);
    setQuery(value);
    setActiveIdx(-1);
  }

  const options = buildOptions(district);
  const filtered =
    query.trim() === ""
      ? options.slice(0, 50)
      : options
          .filter((o) =>
            normalize(o.neighborhood).includes(normalize(query)),
          )
          .slice(0, 50);

  function select(opt: Option) {
    onChange(opt.neighborhood);
    setQuery(opt.neighborhood);
    onValidChange?.(true);
    setOpen(false);
    setActiveIdx(-1);
  }

  function clear() {
    onChange("");
    setQuery("");
    onValidChange?.(false);
    setOpen(false);
    setActiveIdx(-1);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    setOpen(true);
    setActiveIdx(-1);
    // Validate canonical state
    const valid = isCanonical(val, district);
    onChange(val);
    onValidChange?.(valid);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      if (filtered[activeIdx]) select(filtered[activeIdx]);
    }
  }

  // Scroll active item into view
  useEffect(() => {
    if (activeIdx >= 0 && listRef.current) {
      const item = listRef.current.children[activeIdx] as HTMLElement | undefined;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIdx]);

  // Close on outside click
  const handleBlur = useCallback((e: React.FocusEvent) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setOpen(false);
      // If user typed something not in list, revert display to current valid value
      // but do not clear onChange — the parent already knows
    }
  }, []);

  const listboxId = `${inputId}-listbox`;
  const activeDescendant =
    activeIdx >= 0 ? `${inputId}-option-${activeIdx}` : undefined;

  return (
    <div ref={containerRef} className="relative" onBlur={handleBlur}>
      <div className="relative flex items-center">
        <MapPin
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
        />
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={activeDescendant}
          autoComplete="off"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full rounded-lg border py-2.5 pl-9 pr-8 text-sm transition-colors focus:outline-none focus:ring-2 ${
            error
              ? "border-red-400 focus:ring-red-300"
              : "border-zinc-300 focus:ring-blue-300"
          } ${disabled ? "cursor-not-allowed bg-zinc-50 text-zinc-400" : "bg-white text-zinc-900"}`}
        />
        {query ? (
          <button
            type="button"
            aria-label="Temizle"
            onClick={clear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-zinc-400 hover:text-zinc-600"
          >
            <X size={14} />
          </button>
        ) : (
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
          />
        )}
      </div>

      {open && filtered.length > 0 && (
        <ul
          id={listboxId}
          ref={listRef}
          role="listbox"
          aria-label="Mahalle listesi"
          className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg z-999"
        >
          {filtered.map((opt, i) => (
            <li
              key={`${opt.district}-${opt.neighborhood}`}
              id={`${inputId}-option-${i}`}
              role="option"
              aria-selected={i === activeIdx}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent blur before click
                select(opt);
              }}
              className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm ${
                i === activeIdx
                  ? "bg-blue-50 text-blue-900"
                  : "text-zinc-800 hover:bg-zinc-50"
              }`}
            >
              <span>{opt.neighborhood}</span>
              {!district && (
                <span className="ml-2 shrink-0 text-xs text-zinc-400">
                  {opt.district}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {open && query.trim() !== "" && filtered.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-400 shadow-lg">
          Sonuç bulunamadı
        </div>
      )}

      {error && (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
