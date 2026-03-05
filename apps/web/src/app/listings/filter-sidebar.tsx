"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

// ── URL helper: toggle a value inside a comma-separated single param ──────────
// roomCounts is stored as a single param with comma-separated values:
//   ?roomCounts=1%2B1%2C2%2B1   (URL-encoded commas)
function toggleCsvParam(
  base: URLSearchParams,
  key: string,
  value: string,
): URLSearchParams {
  const existing = (base.get(key) ?? "").split(",").filter(Boolean);
  const next = new URLSearchParams();
  for (const [k, v] of base.entries()) {
    if (k !== key) next.append(k, v);
  }
  const newValues = existing.includes(value)
    ? existing.filter((v) => v !== value)
    : [...existing, value];
  if (newValues.length > 0) {
    next.set(key, newValues.join(","));
  }
  return next;
}

// ── URL helper: toggle one value inside a repeated-key param ─────────────────
function toggleArrayParam(
  base: URLSearchParams,
  key: string,
  value: string,
): URLSearchParams {
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

// ── Debounced text/number input ───────────────────────────────────────────────
function DebouncedInput({
  paramKey,
  min,
  className,
}: {
  paramKey: string;
  min?: number;
  className?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [local, setLocal] = useState(searchParams.get(paramKey) ?? "");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setLocal(searchParams.get(paramKey) ?? "");
  }, [searchParams, paramKey]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setLocal(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (v !== "") {
        params.set(paramKey, v);
      } else {
        params.delete(paramKey);
      }
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
        "w-full rounded border border-zinc-300 px-2 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
      }
    />
  );
}

// ── Collapsible section wrapper ───────────────────────────────────────────────
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
    <div className="border-t border-zinc-100 pt-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between pb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500"
      >
        {title}
        <span className="text-zinc-400">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="space-y-2">{children}</div>}
    </div>
  );
}

// ── Feature group accordion (lazy render chips) ───────────────────────────────
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
    <div className="border-t border-zinc-100 first:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-2 text-sm text-zinc-700"
      >
        <span className="font-medium">
          {label}
          {count > 0 && (
            <span className="ml-1.5 rounded-full bg-zinc-800 px-1.5 py-0.5 text-xs text-white">
              {count}
            </span>
          )}
        </span>
        <span className="text-zinc-400 text-xs">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="pb-2 flex flex-wrap gap-1.5">
          {options.map((opt) => {
            const active = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onToggle(opt)}
                className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                  active
                    ? "border-zinc-800 bg-zinc-800 text-white"
                    : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function FilterSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const subtype = searchParams.get("subtype") ?? undefined;
  const blocked = useMemo(() => getBlockedFilters(subtype), [subtype]);

  // ── Generic single-value update ───────────────────────────────────────────
  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push("?" + params.toString());
    },
    [router, searchParams],
  );

  // ── propertyType cascade ──────────────────────────────────────────────────
  function handlePropertyTypeChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("propertyType", value);
    } else {
      params.delete("propertyType");
    }
    params.delete("subtype");
    router.push("?" + params.toString());
  }

  // ── subtype cascade ───────────────────────────────────────────────────────
  function handleSubtypeChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("subtype", value);
    } else {
      params.delete("subtype");
    }
    const newBlocked = getBlockedFilters(value || undefined);
    for (const k of newBlocked) {
      params.delete(k);
    }
    router.push("?" + params.toString());
  }

  // ── district cascade ──────────────────────────────────────────────────────
  function handleDistrictChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("district", value);
    } else {
      params.delete("district");
    }
    params.delete("neighborhood");
    router.push("?" + params.toString());
  }

  // ── boolean flag toggle ───────────────────────────────────────────────────
  function toggleBool(key: string, checked: boolean) {
    update(key, checked ? "true" : "");
  }

  // ── roomCounts multi-select (comma-separated) ─────────────────────────────
  function toggleRoomCount(label: string) {
    const next = toggleCsvParam(
      new URLSearchParams(searchParams.toString()),
      "roomCounts",
      label,
    );
    router.push("?" + next.toString());
  }

  // ── feature group multi-select (repeated params) ──────────────────────────
  function toggleFeature(group: FeatureGroup, value: string) {
    const next = toggleArrayParam(
      new URLSearchParams(searchParams.toString()),
      group,
      value,
    );
    router.push("?" + next.toString());
  }

  // ── derived state ─────────────────────────────────────────────────────────
  const propertyType = searchParams.get("propertyType") ?? "";
  const district = searchParams.get("district") ?? "";
  const subtypes = getSubtypes(propertyType || undefined);
  const neighborhoods = district ? (NEIGHBORHOODS[district] ?? []) : [];

  // Active roomCounts (comma-separated → string[])
  const selectedRoomCounts = (searchParams.get("roomCounts") ?? "")
    .split(",")
    .filter(Boolean);

  const activeCount = useMemo(() => {
    let n = 0;
    for (const [k, v] of searchParams.entries()) {
      if (k !== "bbox" && v) n++;
    }
    return n;
  }, [searchParams]);

  const hasAnyFilter = activeCount > 0 || searchParams.has("bbox");

  const inputCls =
    "w-full rounded border border-zinc-300 px-2 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400";
  const selectCls = inputCls;
  const checkboxLabelCls =
    "flex items-center gap-2 text-sm text-zinc-600 cursor-pointer select-none";

  const body = (
    <div className="space-y-0">
      {/* ── Emlak Tipi + Kategori + Alt Tip ── */}
      <SidebarSection title="Emlak Tipi">
        <select
          value={propertyType}
          onChange={(e) => handlePropertyTypeChange(e.target.value)}
          className={selectCls}
        >
          <option value="">Tüm tipler</option>
          {PROPERTY_TYPES.map((pt) => (
            <option key={pt} value={pt}>
              {pt}
            </option>
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
              <option key={st} value={st}>
                {st}
              </option>
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

      {/* ── Konum ── */}
      <SidebarSection title="Konum">
        <select
          value={district}
          onChange={(e) => handleDistrictChange(e.target.value)}
          className={selectCls}
        >
          <option value="">Tüm ilçeler</option>
          {DISTRICTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
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
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        )}
      </SidebarSection>

      {/* ── Fiyat ── */}
      <SidebarSection title="Fiyat (TRY)">
        <div className="flex items-center gap-2">
          <DebouncedInput paramKey="minPrice" min={0} />
          <span className="text-zinc-400 shrink-0">–</span>
          <DebouncedInput paramKey="maxPrice" min={0} />
        </div>
      </SidebarSection>

      {/* ── Emlak Bilgileri ── */}
      <SidebarSection title="Emlak Bilgileri" defaultOpen={false}>
        {/* Oda Sayısı — multi-select chips (comma-separated in URL) */}
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
                    className={`rounded border px-2.5 py-1 text-xs transition-colors ${
                      active
                        ? "border-zinc-800 bg-zinc-800 text-white"
                        : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Banyo Sayısı */}
        {!blocked.has("bathroomCount") && (
          <div>
            <p className="mb-1 text-xs text-zinc-500">Banyo Sayısı</p>
            <DebouncedInput paramKey="bathroomCount" min={0} />
          </div>
        )}

        {/* Brüt m² */}
        <div>
          <p className="mb-1 text-xs text-zinc-500">Brüt m²</p>
          <div className="flex items-center gap-2">
            <DebouncedInput paramKey="minM2Gross" min={0} />
            <span className="text-zinc-400 shrink-0">–</span>
            <DebouncedInput paramKey="maxM2Gross" min={0} />
          </div>
        </div>

        {/* Net m² */}
        <div>
          <p className="mb-1 text-xs text-zinc-500">Net m²</p>
          <div className="flex items-center gap-2">
            <DebouncedInput paramKey="minM2Net" min={0} />
            <span className="text-zinc-400 shrink-0">–</span>
            <DebouncedInput paramKey="maxM2Net" min={0} />
          </div>
        </div>

        {/* Bina Yaşı */}
        {!blocked.has("minBuildingAge") && (
          <div>
            <p className="mb-1 text-xs text-zinc-500">Bina Yaşı (yıl)</p>
            <div className="flex items-center gap-2">
              <DebouncedInput paramKey="minBuildingAge" min={0} />
              <span className="text-zinc-400 shrink-0">–</span>
              <DebouncedInput paramKey="maxBuildingAge" min={0} />
            </div>
          </div>
        )}

        {/* Kat No / Toplam Kat */}
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

        {/* Isıtma Tipi */}
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
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Mutfak Durumu */}
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
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Aidat */}
        {!blocked.has("minDues") && (
          <div>
            <p className="mb-1 text-xs text-zinc-500">Aidat (TRY/ay)</p>
            <div className="flex items-center gap-2">
              <DebouncedInput paramKey="minDues" min={0} />
              <span className="text-zinc-400 shrink-0">–</span>
              <DebouncedInput paramKey="maxDues" min={0} />
            </div>
          </div>
        )}
      </SidebarSection>

      {/* ── Özellikler ── */}
      <SidebarSection title="Özellikler" defaultOpen={false}>
        <div className="space-y-2">
          {!blocked.has("isFurnished") && (
            <label className={checkboxLabelCls}>
              <input
                type="checkbox"
                checked={searchParams.get("isFurnished") === "true"}
                onChange={(e) => toggleBool("isFurnished", e.target.checked)}
              />
              Eşyalı
            </label>
          )}
          {!blocked.has("hasBalcony") && (
            <label className={checkboxLabelCls}>
              <input
                type="checkbox"
                checked={searchParams.get("hasBalcony") === "true"}
                onChange={(e) => toggleBool("hasBalcony", e.target.checked)}
              />
              Balkon
            </label>
          )}
          {!blocked.has("hasElevator") && (
            <label className={checkboxLabelCls}>
              <input
                type="checkbox"
                checked={searchParams.get("hasElevator") === "true"}
                onChange={(e) => toggleBool("hasElevator", e.target.checked)}
              />
              Asansör
            </label>
          )}
          {!blocked.has("inComplex") && (
            <label className={checkboxLabelCls}>
              <input
                type="checkbox"
                checked={searchParams.get("inComplex") === "true"}
                onChange={(e) => toggleBool("inComplex", e.target.checked)}
              />
              Site İçinde
            </label>
          )}
          <label className={checkboxLabelCls}>
            <input
              type="checkbox"
              checked={searchParams.get("isLoanEligible") === "true"}
              onChange={(e) => toggleBool("isLoanEligible", e.target.checked)}
            />
            Krediye Uygun
          </label>
          <label className={checkboxLabelCls}>
            <input
              type="checkbox"
              checked={searchParams.get("isSwapAvailable") === "true"}
              onChange={(e) => toggleBool("isSwapAvailable", e.target.checked)}
            />
            Takas
          </label>
          <label className={checkboxLabelCls}>
            <input
              type="checkbox"
              checked={searchParams.get("carPark") === "true"}
              onChange={(e) => toggleBool("carPark", e.target.checked)}
            />
            Otopark
          </label>
        </div>
      </SidebarSection>

      {/* ── Detaylar (feature groups from detailedFeaturesData) ── */}
      <SidebarSection title="Detaylar" defaultOpen={false}>
        <div className="divide-y divide-zinc-100">
          {FILTER_FEATURE_GROUP_NAMES.filter((g) => !blocked.has(g)).map(
            (group) => (
              <FeatureGroupAccordion
                key={group}
                group={group}
                selected={searchParams.getAll(group)}
                onToggle={(value) => toggleFeature(group, value)}
              />
            ),
          )}
        </div>
      </SidebarSection>

      {/* ── Sıralama ── */}
      <SidebarSection title="Sıralama" defaultOpen={false}>
        <select
          value={searchParams.get("sortBy") ?? "newest"}
          onChange={(e) =>
            update("sortBy", e.target.value === "newest" ? "" : e.target.value)
          }
          className={selectCls}
        >
          <option value="newest">En Yeni</option>
          <option value="oldest">En Eski</option>
          <option value="price_asc">Fiyat: Düşükten Yükseğe</option>
          <option value="price_desc">Fiyat: Yüksekten Düşüğe</option>
        </select>
      </SidebarSection>

      {/* ── Reset ── */}
      {hasAnyFilter && (
        <div className="pt-4">
          <button
            type="button"
            onClick={() => router.push("?")}
            className="w-full rounded border border-zinc-200 py-2 text-xs text-zinc-500 hover:bg-zinc-50"
          >
            Filtreleri Sıfırla
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-md"
      >
        Filtrele
        {activeCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-xs text-white">
            {activeCount}
          </span>
        )}
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-y-0 left-0 z-50 w-80 overflow-y-auto bg-white p-4 shadow-xl lg:hidden">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-700">
              Filtreler
            </span>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="text-zinc-400 hover:text-zinc-600"
            >
              ✕
            </button>
          </div>
          {body}
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Filtreler
          </h2>
          {body}
        </div>
      </aside>
    </>
  );
}
