"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from "lucide-react";
import { DISTRICTS, NEIGHBORHOODS } from "@/lib/geo/antalya";
import {
  FEATURE_GROUP_LABELS,
  FILTER_FEATURE_GROUP_NAMES,
  FEATURE_GROUPS,
  HEATING_TYPES,
  KITCHEN_STATES,
  PROPERTY_TYPES,
  ROOM_COUNT_CHIP_OPTIONS,
  getBlockedFilters,
  getSubtypes,
  type FeatureGroup,
} from "@/lib/taxonomy";

// ── URL helpers ───────────────────────────────────────────────────────────────

function toggleCsvParam(base: URLSearchParams, key: string, value: string): URLSearchParams {
  const existing = (base.get(key) ?? "").split(",").filter(Boolean);
  const next = new URLSearchParams();
  for (const [k, v] of base.entries()) {
    if (k !== key) next.append(k, v);
  }
  const newValues = existing.includes(value)
    ? existing.filter((v) => v !== value)
    : [...existing, value];
  if (newValues.length > 0) next.set(key, newValues.join(","));
  return next;
}

function toggleArrayParam(base: URLSearchParams, key: string, value: string): URLSearchParams {
  const existing = base.getAll(key);
  const next = new URLSearchParams();
  for (const [k, v] of base.entries()) {
    if (k !== key) next.append(k, v);
  }
  if (existing.includes(value)) {
    for (const v of existing) {
      if (v !== value) next.append(key, v);
    }
  } else {
    for (const v of existing) next.append(key, v);
    next.append(key, value);
  }
  return next;
}

// ── Debounced number input ─────────────────────────────────────────────────────

function DebouncedInput({ paramKey, min, className }: { paramKey: string; min?: number; className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlValue = searchParams.get(paramKey) ?? "";
  const [prevUrlValue, setPrevUrlValue] = useState(urlValue);
  const [local, setLocal] = useState(urlValue);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Derived-state sync: when the URL value changes externally, reset local input.
  // getDerivedStateFromProps pattern for function components — no effect needed.
  if (prevUrlValue !== urlValue) {
    setPrevUrlValue(urlValue);
    setLocal(urlValue);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setLocal(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (v !== "") params.set(paramKey, v);
      else params.delete(paramKey);
      router.push("?" + params.toString());
    }, 400);
  }

  return (
    <input
      type="number"
      min={min}
      value={local}
      onChange={handleChange}
      suppressHydrationWarning
      className={
        className ??
        "w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-zinc-700 shadow-xs transition focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100"
      }
    />
  );
}

// ── Animated collapsible section ──────────────────────────────────────────────

function SidebarSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-stone-100 pt-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between pb-2 text-xs font-semibold uppercase tracking-widest text-amber-700/70 transition hover:text-amber-700"
      >
        {title}
        <motion.span
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ duration: 0.2 }}
          className="text-amber-400"
        >
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pb-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Feature group accordion ────────────────────────────────────────────────────

function FeatureGroupAccordion({
  group,
  selected,
  onToggle,
}: {
  group: FeatureGroup;
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const options = FEATURE_GROUPS[group] ?? [];
  const label = FEATURE_GROUP_LABELS[group];
  const count = selected.length;

  return (
    <div className="border-t border-stone-100 first:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between py-2.5 text-sm text-zinc-700"
      >
        <span className="font-medium flex items-center gap-1.5">
          {label}
          <AnimatePresence>
            {count > 0 && (
              <motion.span
                key="badge"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                className="rounded-full bg-amber-500 px-1.5 py-0.5 text-xs text-white"
              >
                {count}
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        <span className="text-amber-400 text-xs">
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="chips"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="pb-3 flex flex-wrap gap-1.5">
              {options.map((opt, i) => {
                const active = selected.includes(opt);
                return (
                  <motion.button
                    key={opt}
                    type="button"
                    onClick={() => onToggle(opt)}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.025, duration: 0.18 }}
                    className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                      active
                        ? "border-amber-500 bg-amber-500 text-white shadow-sm"
                        : "border-stone-200 bg-white text-zinc-600 hover:border-amber-300 hover:bg-amber-50"
                    }`}
                  >
                    {opt}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Shared class strings ───────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-zinc-700 shadow-xs transition focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100";
const selectCls = inputCls + " cursor-pointer";
const checkboxLabelCls =
  "flex items-center gap-2 text-sm text-zinc-600 cursor-pointer select-none accent-amber-500";

// ── Main component ─────────────────────────────────────────────────────────────

export function FilterSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const subtype = searchParams.get("subtype") ?? undefined;
  const blocked = useMemo(() => getBlockedFilters(subtype), [subtype]);

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push("?" + params.toString());
    },
    [router, searchParams],
  );

  function handlePropertyTypeChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("propertyType", value);
    else params.delete("propertyType");
    params.delete("subtype");
    router.push("?" + params.toString());
  }

  function handleSubtypeChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("subtype", value);
    else params.delete("subtype");
    const newBlocked = getBlockedFilters(value || undefined);
    for (const k of newBlocked) params.delete(k);
    router.push("?" + params.toString());
  }

  function handleDistrictChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("district", value);
    else params.delete("district");
    params.delete("neighborhood");
    router.push("?" + params.toString());
  }

  function toggleBool(key: string, checked: boolean) {
    update(key, checked ? "true" : "");
  }

  function toggleRoomCount(label: string) {
    const next = toggleCsvParam(new URLSearchParams(searchParams.toString()), "roomCounts", label);
    router.push("?" + next.toString());
  }

  function toggleFeature(group: FeatureGroup, value: string) {
    const next = toggleArrayParam(new URLSearchParams(searchParams.toString()), group, value);
    router.push("?" + next.toString());
  }

  const propertyType = searchParams.get("propertyType") ?? "";
  const district = searchParams.get("district") ?? "";
  const subtypes = getSubtypes(propertyType || undefined);
  const neighborhoods = district ? (NEIGHBORHOODS[district] ?? []) : [];
  const selectedRoomCounts = (searchParams.get("roomCounts") ?? "").split(",").filter(Boolean);

  const UI_ONLY_PARAMS = new Set(["bbox", "page", "limit", "sortBy", "viewMode"]);

  const activeCount = useMemo(() => {
    let n = 0;
    for (const [k, v] of searchParams.entries()) {
      if (!UI_ONLY_PARAMS.has(k) && v) n++;
    }
    return n;
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasAnyFilter = activeCount > 0 || searchParams.has("bbox");

  // ── Filter panel body ──────────────────────────────────────────────────────

  const body = (
    <div className="space-y-0">
      {/* Emlak Tipi */}
      <SidebarSection title="Emlak Tipi">
        <select
          value={propertyType}
          onChange={(e) => handlePropertyTypeChange(e.target.value)}
          className={selectCls}
        >
          <option value="">Tüm tipler</option>
          {PROPERTY_TYPES.map((pt) => (
            <option key={pt} value={pt}>{pt}</option>
          ))}
        </select>

        {subtypes.length > 0 && (
          <select
            value={subtype ?? ""}
            onChange={(e) => handleSubtypeChange(e.target.value)}
            className={selectCls}
          >
            <option value="">Tüm alt tipler</option>
            {subtypes.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        )}

        <fieldset>
          <div className="flex gap-3">
            {[
              { value: "", label: "Tümü" },
              { value: "SALE", label: "Satılık" },
              { value: "RENT", label: "Kiralık" },
            ].map((opt) => (
              <label key={opt.value} className={checkboxLabelCls}>
                <input
                  type="radio"
                  name="category"
                  value={opt.value}
                  checked={(searchParams.get("category") ?? "") === opt.value}
                  onChange={() => update("category", opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </fieldset>
      </SidebarSection>

      {/* Konum */}
      <SidebarSection title="Konum">
        <select
          value={district}
          onChange={(e) => handleDistrictChange(e.target.value)}
          className={selectCls}
        >
          <option value="">Tüm ilçeler</option>
          {DISTRICTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {district && neighborhoods.length > 0 && (
          <select
            value={searchParams.get("neighborhood") ?? ""}
            onChange={(e) => update("neighborhood", e.target.value)}
            className={selectCls}
          >
            <option value="">Tüm mahalleler</option>
            {neighborhoods.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        )}
      </SidebarSection>

      {/* Fiyat */}
      <SidebarSection title="Fiyat (TRY)">
        <div className="flex items-center gap-2">
          <DebouncedInput paramKey="minPrice" min={0} />
          <span className="shrink-0 text-stone-400">–</span>
          <DebouncedInput paramKey="maxPrice" min={0} />
        </div>
      </SidebarSection>

      {/* Emlak Bilgileri */}
      <SidebarSection title="Emlak Bilgileri" defaultOpen={false}>
        {!blocked.has("roomCount") && (
          <div>
            <p className="mb-1.5 text-xs text-zinc-500">Oda Sayısı</p>
            <div className="flex flex-wrap gap-1">
              {ROOM_COUNT_CHIP_OPTIONS.map((label) => {
                const active = selectedRoomCounts.includes(label);
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleRoomCount(label)}
                    className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                      active
                        ? "border-amber-500 bg-amber-500 text-white shadow-sm"
                        : "border-stone-200 bg-white text-zinc-600 hover:border-amber-300 hover:bg-amber-50"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {!blocked.has("bathroomCount") && (
          <div>
            <p className="mb-1 text-xs text-zinc-500">Banyo Sayısı</p>
            <DebouncedInput paramKey="bathroomCount" min={0} />
          </div>
        )}

        <div>
          <p className="mb-1 text-xs text-zinc-500">Brüt m²</p>
          <div className="flex items-center gap-2">
            <DebouncedInput paramKey="minM2Gross" min={0} />
            <span className="shrink-0 text-stone-400">–</span>
            <DebouncedInput paramKey="maxM2Gross" min={0} />
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs text-zinc-500">Net m²</p>
          <div className="flex items-center gap-2">
            <DebouncedInput paramKey="minM2Net" min={0} />
            <span className="shrink-0 text-stone-400">–</span>
            <DebouncedInput paramKey="maxM2Net" min={0} />
          </div>
        </div>

        {!blocked.has("minBuildingAge") && (
          <div>
            <p className="mb-1 text-xs text-zinc-500">Bina Yaşı (yıl)</p>
            <div className="flex items-center gap-2">
              <DebouncedInput paramKey="minBuildingAge" min={0} />
              <span className="shrink-0 text-stone-400">–</span>
              <DebouncedInput paramKey="maxBuildingAge" min={0} />
            </div>
          </div>
        )}

        {!blocked.has("floorNumber") && (
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="mb-1 text-xs text-zinc-500">Kat No</p>
              <DebouncedInput paramKey="floorNumber" />
            </div>
            <div className="flex-1">
              <p className="mb-1 text-xs text-zinc-500">Toplam Kat</p>
              <DebouncedInput paramKey="totalFloors" min={1} />
            </div>
          </div>
        )}

        {!blocked.has("heatingType") && (
          <div>
            <p className="mb-1 text-xs text-zinc-500">Isıtma Tipi</p>
            <select
              value={searchParams.get("heatingType") ?? ""}
              onChange={(e) => update("heatingType", e.target.value)}
              className={selectCls}
            >
              <option value="">Fark etmez</option>
              {HEATING_TYPES.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
        )}

        {!blocked.has("kitchenState") && (
          <div>
            <p className="mb-1 text-xs text-zinc-500">Mutfak</p>
            <select
              value={searchParams.get("kitchenState") ?? ""}
              onChange={(e) => update("kitchenState", e.target.value)}
              className={selectCls}
            >
              <option value="">Fark etmez</option>
              {KITCHEN_STATES.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
        )}

        {!blocked.has("minDues") && (
          <div>
            <p className="mb-1 text-xs text-zinc-500">Aidat (TRY/ay)</p>
            <div className="flex items-center gap-2">
              <DebouncedInput paramKey="minDues" min={0} />
              <span className="shrink-0 text-stone-400">–</span>
              <DebouncedInput paramKey="maxDues" min={0} />
            </div>
          </div>
        )}
      </SidebarSection>

      {/* Özellikler */}
      <SidebarSection title="Özellikler" defaultOpen={false}>
        <div className="space-y-2">
          {!blocked.has("isFurnished") && (
            <label className={checkboxLabelCls}>
              <input type="checkbox" checked={searchParams.get("isFurnished") === "true"} onChange={(e) => toggleBool("isFurnished", e.target.checked)} />
              Eşyalı
            </label>
          )}
          {!blocked.has("hasBalcony") && (
            <label className={checkboxLabelCls}>
              <input type="checkbox" checked={searchParams.get("hasBalcony") === "true"} onChange={(e) => toggleBool("hasBalcony", e.target.checked)} />
              Balkon
            </label>
          )}
          {!blocked.has("hasElevator") && (
            <label className={checkboxLabelCls}>
              <input type="checkbox" checked={searchParams.get("hasElevator") === "true"} onChange={(e) => toggleBool("hasElevator", e.target.checked)} />
              Asansör
            </label>
          )}
          {!blocked.has("inComplex") && (
            <label className={checkboxLabelCls}>
              <input type="checkbox" checked={searchParams.get("inComplex") === "true"} onChange={(e) => toggleBool("inComplex", e.target.checked)} />
              Site İçinde
            </label>
          )}
          <label className={checkboxLabelCls}>
            <input type="checkbox" checked={searchParams.get("isLoanEligible") === "true"} onChange={(e) => toggleBool("isLoanEligible", e.target.checked)} />
            Krediye Uygun
          </label>
          <label className={checkboxLabelCls}>
            <input type="checkbox" checked={searchParams.get("isSwapAvailable") === "true"} onChange={(e) => toggleBool("isSwapAvailable", e.target.checked)} />
            Takas
          </label>
          <label className={checkboxLabelCls}>
            <input type="checkbox" checked={searchParams.get("carPark") === "true"} onChange={(e) => toggleBool("carPark", e.target.checked)} />
            Otopark
          </label>
        </div>
      </SidebarSection>

      {/* Detaylar (feature groups) */}
      <SidebarSection title="Detaylar" defaultOpen={false}>
        <div className="divide-y divide-stone-100">
          {FILTER_FEATURE_GROUP_NAMES.filter((g) => !blocked.has(g)).map((group) => (
            <FeatureGroupAccordion
              key={group}
              group={group}
              selected={searchParams.getAll(group)}
              onToggle={(value) => toggleFeature(group, value)}
            />
          ))}
        </div>
      </SidebarSection>

      {/* Reset */}
      <AnimatePresence>
        {hasAnyFilter && (
          <motion.div
            key="reset"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.18 }}
            className="pt-4"
          >
            <button
              type="button"
              onClick={() => router.push("?")}
              className="w-full cursor-pointer rounded-lg border border-amber-200 bg-amber-50 py-2 text-xs font-medium text-amber-700 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              Filtreleri Sıfırla
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-4 left-4 z-40 flex cursor-pointer items-center gap-2 rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-medium text-amber-700 shadow-lg transition hover:bg-amber-50"
      >
        <SlidersHorizontal size={15} />
        Filtrele
        <AnimatePresence>
          {activeCount > 0 && (
            <motion.span
              key="count"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs text-white"
            >
              {activeCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="drawer"
            initial={{ x: -320, opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed inset-y-0 left-0 z-50 w-80 overflow-y-auto bg-white p-4 shadow-2xl lg:hidden"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
                <SlidersHorizontal size={15} className="text-amber-500" />
                Filtreler
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Filtreleri kapat"
                className="cursor-pointer rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <X size={16} />
              </button>
            </div>
            {body}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
          <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-700/70">
            <SlidersHorizontal size={13} />
            Filtreler
            <AnimatePresence>
              {activeCount > 0 && (
                <motion.span
                  key="badge"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="ml-auto rounded-full bg-amber-500 px-1.5 py-0.5 text-xs text-white"
                >
                  {activeCount}
                </motion.span>
              )}
            </AnimatePresence>
          </h2>
          {body}
        </div>
      </aside>
    </>
  );
}
