"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createListing, updateListing, resubmitListing } from "@/lib/api/listings";
import type { Listing } from "@/lib/types";
import { ApiErrorMessage } from "@/components/api-error-message";
import { ApiRequestError } from "@/lib/api/client";
import { NeighborhoodCombobox } from "@/components/neighborhood-combobox";
import { RichTextEditor } from "@/components/rich-text-editor";
import {
  PROPERTY_TYPES,
  HEATING_TYPES,
  KITCHEN_STATES,
  ROOM_COUNT_OPTIONS,
  FEATURE_GROUPS,
  FEATURE_GROUP_LABELS,
  FILTER_FEATURE_GROUP_NAMES,
  getCat2Options,
  getCat3Options,
  cat2ToCategory,
  type FeatureGroup,
} from "@/lib/taxonomy";

const DISTRICTS = [
  "Muratpaşa", "Kepez", "Konyaaltı", "Döşemealtı", "Aksu",
  "Alanya", "Manavgat", "Serik", "Kemer", "Kumluca",
  "Finike", "Kaş", "Demre", "Elmalı", "Korkuteli",
  "Akseki", "Gündoğmuş", "İbradı", "Gazipaşa",
];

interface ListingFormProps {
  mode: "create" | "edit";
  initialValues?: Listing;
  listingId?: string;
}

export function ListingForm({ mode, initialValues, listingId }: ListingFormProps) {
  const router = useRouter();

  // --- Category cascade (cat1 → cat2 → cat3) ---
  const [cat1, setCat1] = useState(() => initialValues?.propertyType ?? "");
  const [cat2, setCat2] = useState(() => {
    if (!initialValues?.category || !initialValues?.propertyType) return "";
    const opts = getCat2Options(initialValues.propertyType);
    return opts.find((opt) => cat2ToCategory(opt) === initialValues.category) ?? "";
  });
  const [cat3, setCat3] = useState(() => initialValues?.subtype ?? "");

  const cat2Options = useMemo(() => getCat2Options(cat1), [cat1]);
  const cat3Options = useMemo(() => getCat3Options(cat1, cat2), [cat1, cat2]);

  // --- Basic info ---
  const [title, setTitle] = useState(() => initialValues?.title ?? "");
  const [description, setDescription] = useState(() => initialValues?.description ?? "");

  // --- Price ---
  const [priceAmount, setPriceAmount] = useState(() =>
    initialValues?.price?.amount != null ? String(initialValues.price.amount) : ""
  );
  const [priceCurrency, setPriceCurrency] = useState<"TRY" | "USD" | "EUR">(() =>
    (initialValues?.price?.currency as "TRY" | "USD" | "EUR") ?? "TRY"
  );
  const [isNegotiable, setIsNegotiable] = useState(() => initialValues?.price?.isNegotiable ?? false);

  // --- Specifications ---
  const s = initialValues?.specifications;
  const [grossArea, setGrossArea] = useState(() => s?.grossArea != null ? String(s.grossArea) : "");
  const [netArea, setNetArea] = useState(() => s?.netArea != null ? String(s.netArea) : "");
  const [roomCountIdx, setRoomCountIdx] = useState(() => s?.roomCount != null ? String(s.roomCount) : "");
  const [bathroomCount, setBathroomCount] = useState(() => s?.bathroomCount != null ? String(s.bathroomCount) : "");
  const [floorNumber, setFloorNumber] = useState(() => s?.floorNumber != null ? String(s.floorNumber) : "");
  const [totalFloors, setTotalFloors] = useState(() => s?.totalFloors != null ? String(s.totalFloors) : "");
  const [buildingAge, setBuildingAge] = useState(() => s?.buildingAge != null ? String(s.buildingAge) : "");
  const [heatingType, setHeatingType] = useState(() => s?.heatingType ?? "");
  const [kitchenState, setKitchenState] = useState(() => s?.kitchenState ?? "");
  const [isFurnished, setIsFurnished] = useState(() => s?.isFurnished ?? false);
  const [hasBalcony, setHasBalcony] = useState(() => s?.hasBalcony ?? false);
  const [hasElevator, setHasElevator] = useState(() => s?.hasElevator ?? false);
  const [inComplex, setInComplex] = useState(() => s?.inComplex ?? false);
  const [hasParking, setHasParking] = useState(() => s?.hasParking ?? false);
  const [isLoanEligible, setIsLoanEligible] = useState(() => s?.isLoanEligible ?? false);
  const [isSwapAvailable, setIsSwapAvailable] = useState(() => s?.isSwapAvailable ?? false);
  const [duesAmount, setDuesAmount] = useState(() => s?.duesAmount != null ? String(s.duesAmount) : "");
  const [imageCount, setImageCount] = useState(() =>
    initialValues?.imageCount != null ? String(initialValues.imageCount) : ""
  );

  // --- Detail infos (feature groups) ---
  const [detailInfos, setDetailInfos] = useState<Record<string, string[]>>(() =>
    initialValues?.detailInfos ?? {}
  );

  function toggleFeature(group: string, value: string) {
    setDetailInfos((prev) => {
      const existing = prev[group] ?? [];
      return {
        ...prev,
        [group]: existing.includes(value)
          ? existing.filter((v) => v !== value)
          : [...existing, value],
      };
    });
  }

  // --- Location ---
  const [district, setDistrict] = useState(() => initialValues?.location?.district ?? "");
  const [neighborhood, setNeighborhood] = useState(() => initialValues?.location?.neighborhood ?? "");
  // Track whether neighborhood was selected from the canonical list
  const [neighborhoodValid, setNeighborhoodValid] = useState(
    () => !!initialValues?.location?.neighborhood,
  );
  const [lat, setLat] = useState(() =>
    initialValues?.location?.coordinates?.latitude != null
      ? String(initialValues.location.coordinates.latitude)
      : ""
  );
  const [lng, setLng] = useState(() =>
    initialValues?.location?.coordinates?.longitude != null
      ? String(initialValues.location.coordinates.longitude)
      : ""
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!title.trim() || title.trim().length < 10)
      e.title = "Başlık en az 10 karakter olmalıdır.";
    const descText = description.replace(/<[^>]*>/g, "").trim();
    if (!descText || descText.length < 50)
      e.description = "Açıklama en az 50 karakter olmalıdır.";
    // Location is only required in edit mode — on create it is added later during review
    if (mode === "edit") {
      if (!district) e.district = "İlçe zorunludur.";
      if (!neighborhood.trim()) e.neighborhood = "Mahalle zorunludur.";
      else if (!neighborhoodValid) e.neighborhood = "Listeden bir mahalle seçin.";
    }
    if (!grossArea || Number(grossArea) < 1)
      e.grossArea = "Brüt alan en az 1 m² olmalıdır.";
    return e;
  }

  function buildDto() {
    const category = cat2ToCategory(cat2) ?? undefined;
    // Location is only included in edit mode — on create it is provided later during review
    const locationDto =
      mode === "edit" && district
        ? {
            city: "Antalya",
            district,
            neighborhood: neighborhood.trim() || undefined,
            coordinates:
              lat && lng
                ? { latitude: Number(lat), longitude: Number(lng) }
                : undefined,
          }
        : undefined;
    return {
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      propertyType: cat1 || undefined,
      subtype: cat3 || undefined,
      price: priceAmount
        ? { amount: Number(priceAmount), currency: priceCurrency, isNegotiable }
        : undefined,
      location: locationDto,
      specifications: {
        roomCount: roomCountIdx !== "" ? Number(roomCountIdx) : undefined,
        bathroomCount: bathroomCount !== "" ? Number(bathroomCount) : undefined,
        floorNumber: floorNumber !== "" ? Number(floorNumber) : undefined,
        totalFloors: totalFloors !== "" ? Number(totalFloors) : undefined,
        grossArea: grossArea !== "" ? Number(grossArea) : undefined,
        netArea: netArea !== "" ? Number(netArea) : undefined,
        buildingAge: buildingAge !== "" ? Number(buildingAge) : undefined,
        hasParking: hasParking || undefined,
        hasBalcony: hasBalcony || undefined,
        heatingType: heatingType || undefined,
        kitchenState: kitchenState || undefined,
        isFurnished: isFurnished || undefined,
        hasElevator: hasElevator || undefined,
        inComplex: inComplex || undefined,
        isLoanEligible: isLoanEligible || undefined,
        isSwapAvailable: isSwapAvailable || undefined,
        duesAmount: duesAmount !== "" ? Number(duesAmount) : undefined,
      },
      detailInfos: Object.keys(detailInfos).length > 0 ? detailInfos : undefined,
      imageCount: imageCount !== "" ? Number(imageCount) : undefined,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const dto = buildDto();

      if (mode === "edit" && listingId) {
        await updateListing(listingId, dto);
        if (initialValues?.status === "NEEDS_CHANGES") {
          await resubmitListing(listingId);
        }
        router.push(`/consultant/listings/${listingId}`);
      } else {
        const listing = await createListing(dto);
        router.push(`/consultant/listings/${listing.id}`);
      }
    } catch (err) {
      if (err instanceof ApiRequestError) {
        const msg = Array.isArray(err.body.message)
          ? err.body.message.join(", ")
          : err.body.message;
        setApiError(msg);
      } else {
        setApiError("Sunucuya ulaşılamıyor.");
      }
    } finally {
      setLoading(false);
    }
  }

  const submitLabel =
    mode === "edit"
      ? initialValues?.status === "NEEDS_CHANGES"
        ? "Kaydet & İncelemeye Gönder"
        : "Değişiklikleri Kaydet"
      : "İncelemeye Gönder";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {/* Kategori Seçimi */}
      <Section title="Kategori Seçimi">
        <p className="text-xs text-zinc-400 -mt-2 mb-2">
          Emlak tipini ve işlem türünü seçerek ilana özgü alanlar belirlenir.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Emlak Tipi">
            <select
              value={cat1}
              onChange={(e) => {
                setCat1(e.target.value);
                setCat2("");
                setCat3("");
              }}
              className={inputCls()}
            >
              <option value="">Seçin…</option>
              {PROPERTY_TYPES.map((pt) => (
                <option key={pt} value={pt}>
                  {pt}
                </option>
              ))}
            </select>
          </Field>

          {cat1 && cat2Options.length > 0 && (
            <Field label="İşlem Türü">
              <select
                value={cat2}
                onChange={(e) => {
                  setCat2(e.target.value);
                  setCat3("");
                }}
                className={inputCls()}
              >
                <option value="">Seçin…</option>
                {cat2Options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {cat1 && cat2 && cat3Options.length > 0 && (
            <Field label="Alt Tip">
              <select
                value={cat3}
                onChange={(e) => setCat3(e.target.value)}
                className={inputCls()}
              >
                <option value="">Seçin…</option>
                {cat3Options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </div>
      </Section>

      {/* Temel Bilgiler */}
      <Section title="Temel Bilgiler">
        <Field label="İlan Başlığı" required error={errors.title}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            minLength={10}
            maxLength={200}
            placeholder="Örn: Lüks 3+1 Daire, Muratpaşa Merkez"
            className={inputCls()}
          />
        </Field>

        <Field label="Açıklama" required error={errors.description}>
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder="İlanı detaylı biçimde tanımlayın (en az 50 karakter)…"
          />
        </Field>
      </Section>

      {/* Fiyat */}
      <Section title="Fiyat">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Tutar">
            <input
              type="number"
              min={0}
              step="1"
              value={priceAmount}
              onChange={(e) => setPriceAmount(e.target.value)}
              placeholder="0"
              className={inputCls()}
            />
          </Field>
          <Field label="Para Birimi">
            <select
              value={priceCurrency}
              onChange={(e) =>
                setPriceCurrency(e.target.value as typeof priceCurrency)
              }
              className={inputCls()}
            >
              <option>TRY</option>
              <option>USD</option>
              <option>EUR</option>
            </select>
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-600">
          <input
            type="checkbox"
            checked={isNegotiable}
            onChange={(e) => setIsNegotiable(e.target.checked)}
            className="rounded border-zinc-300"
          />
          Pazarlığa açık
        </label>
      </Section>

      {/* Özellikler */}
      <Section title="Özellikler">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Brüt m²" required error={errors.grossArea}>
            <input
              type="number"
              min={1}
              max={100000}
              value={grossArea}
              onChange={(e) => setGrossArea(e.target.value)}
              className={inputCls()}
            />
          </Field>
          <Field label="Net m²">
            <input
              type="number"
              min={1}
              max={100000}
              value={netArea}
              onChange={(e) => setNetArea(e.target.value)}
              className={inputCls()}
            />
          </Field>

          <Field label="Oda Sayısı">
            <select
              value={roomCountIdx}
              onChange={(e) => setRoomCountIdx(e.target.value)}
              className={inputCls()}
            >
              <option value="">Belirtilmemiş</option>
              {ROOM_COUNT_OPTIONS.map(({ value, label }) => (
                <option key={value} value={String(value)}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Banyo Sayısı">
            <input
              type="number"
              min={0}
              max={20}
              value={bathroomCount}
              onChange={(e) => setBathroomCount(e.target.value)}
              className={inputCls()}
            />
          </Field>
          <Field label="Bulunduğu Kat">
            <input
              type="number"
              value={floorNumber}
              onChange={(e) => setFloorNumber(e.target.value)}
              className={inputCls()}
            />
          </Field>
          <Field label="Toplam Kat">
            <input
              type="number"
              min={1}
              value={totalFloors}
              onChange={(e) => setTotalFloors(e.target.value)}
              className={inputCls()}
            />
          </Field>
          <Field label="Bina Yaşı (yıl)">
            <input
              type="number"
              min={0}
              max={200}
              value={buildingAge}
              onChange={(e) => setBuildingAge(e.target.value)}
              className={inputCls()}
            />
          </Field>
          <Field label="Isıtma Tipi">
            <select
              value={heatingType}
              onChange={(e) => setHeatingType(e.target.value)}
              className={inputCls()}
            >
              <option value="">Belirtilmemiş</option>
              {HEATING_TYPES.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Mutfak Durumu">
            <select
              value={kitchenState}
              onChange={(e) => setKitchenState(e.target.value)}
              className={inputCls()}
            >
              <option value="">Belirtilmemiş</option>
              {KITCHEN_STATES.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Aidat (TRY/ay)">
            <input
              type="number"
              min={0}
              value={duesAmount}
              onChange={(e) => setDuesAmount(e.target.value)}
              placeholder="0"
              className={inputCls()}
            />
          </Field>
          <Field label="Fotoğraf Sayısı">
            <input
              type="number"
              min={0}
              max={100}
              value={imageCount}
              onChange={(e) => setImageCount(e.target.value)}
              placeholder="0"
              className={inputCls()}
            />
          </Field>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
          {(
            [
              { key: "isFurnished", label: "Eşyalı", val: isFurnished, set: setIsFurnished },
              { key: "hasBalcony", label: "Balkon", val: hasBalcony, set: setHasBalcony },
              { key: "hasElevator", label: "Asansör", val: hasElevator, set: setHasElevator },
              { key: "inComplex", label: "Site İçinde", val: inComplex, set: setInComplex },
              { key: "hasParking", label: "Otopark", val: hasParking, set: setHasParking },
              { key: "isLoanEligible", label: "Krediye Uygun", val: isLoanEligible, set: setIsLoanEligible },
              { key: "isSwapAvailable", label: "Takas", val: isSwapAvailable, set: setIsSwapAvailable },
            ] as const
          ).map(({ key, label, val, set }) => (
            <label
              key={key}
              className="flex items-center gap-2 text-sm text-zinc-600"
            >
              <input
                type="checkbox"
                checked={val}
                onChange={(e) => (set as (v: boolean) => void)(e.target.checked)}
                className="rounded border-zinc-300"
              />
              {label}
            </label>
          ))}
        </div>
      </Section>

      {/* Detaylı Özellikler */}
      <Section title="Detaylı Özellikler">
        <p className="text-xs text-zinc-400 -mt-2 mb-3">
          İlana ait özellikleri seçin (isteğe bağlı).
        </p>
        <div className="space-y-2">
          {FILTER_FEATURE_GROUP_NAMES.map((group) => {
            const options = FEATURE_GROUPS[group] ?? [];
            const selected = detailInfos[group] ?? [];
            return (
              <FeatureGroupField
                key={group}
                group={group}
                label={FEATURE_GROUP_LABELS[group]}
                options={options}
                selected={selected}
                onToggle={(v) => toggleFeature(group, v)}
              />
            );
          })}
        </div>
      </Section>

      {/* Konum — only shown in edit mode; skipped on create (added later during review) */}
      {mode === "edit" && (
        <Section title="Konum">
          <p className="text-xs text-zinc-400">Şehir Antalya olarak sabitlenmiştir.</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="İlçe" required error={errors.district}>
              <select
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value);
                  setNeighborhood("");
                  setNeighborhoodValid(false);
                }}
                className={inputCls()}
              >
                <option value="">İlçe seçin…</option>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Mahalle" required>
              <NeighborhoodCombobox
                district={district}
                value={neighborhood}
                onChange={setNeighborhood}
                onValidChange={setNeighborhoodValid}
                disabled={!district}
                placeholder={district ? "Mahalle seçin…" : "Önce ilçe seçin"}
                error={errors.neighborhood}
              />
            </Field>
            <Field label="Enlem (isteğe bağlı)">
              <input
                type="number"
                step="0.00000001"
                placeholder="36.88…"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className={inputCls()}
              />
            </Field>
            <Field label="Boylam (isteğe bağlı)">
              <input
                type="number"
                step="0.00000001"
                placeholder="30.70…"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className={inputCls()}
              />
            </Field>
          </div>
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-xs text-zinc-400">
            Harita konumu — yakında
          </div>
        </Section>
      )}

      {/* Create-mode info note */}
      {mode === "create" && (
        <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>Konum ve fotoğraflar</strong> ilan oluşturulduktan sonra ilan
          detay sayfasından eklenebilir.
        </div>
      )}

      {apiError && <ApiErrorMessage error={apiError} />}

      <div className="flex items-center justify-end gap-3 border-t border-zinc-200 pt-6">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {loading ? "Gönderiliyor…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

// ── Feature group field (collapsible chip grid) ───────────────────────────────

function FeatureGroupField({
  label,
  options,
  selected,
  onToggle,
}: {
  group: FeatureGroup;
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const count = selected.length;

  return (
    <div className="rounded border border-zinc-200">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-sm text-zinc-700"
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
        <div className="border-t border-zinc-100 px-3 py-2 flex flex-wrap gap-1.5">
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

// ── Shared helpers ────────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-zinc-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function inputCls() {
  return "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400";
}
