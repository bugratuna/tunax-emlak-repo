"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createListing } from "@/lib/api/listings";
import type { CreateListingDto } from "@/lib/api/listings";
import { ApiErrorMessage } from "@/components/api-error-message";
import { ApiRequestError } from "@/lib/api/client";

const DISTRICTS = [
  "Muratpaşa", "Kepez", "Konyaaltı", "Döşemealtı", "Aksu",
  "Alanya", "Manavgat", "Serik", "Kemer", "Kumluca",
  "Finike", "Kaş", "Demre", "Elmalı", "Korkuteli",
  "Akseki", "Gündoğmuş", "İbradı", "Gazipaşa",
];

const HEATING_TYPES = [
  { value: "", label: "Belirtilmemiş" },
  { value: "MERKEZI", label: "Merkezi" },
  { value: "KOMBI", label: "Kombi" },
  { value: "KLIMA", label: "Klima" },
  { value: "YERDEN_ISITMA", label: "Yerden Isıtma" },
  { value: "YOK", label: "Yok" },
];

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Daire",
  VILLA: "Villa",
  HOUSE: "Müstakil Ev",
  LAND: "Arsa",
  COMMERCIAL: "İşyeri",
  OTHER: "Diğer",
};

export function ListingForm({
  mode,
  consultantId: initialConsultantId = "",
}: {
  mode: "create" | "edit";
  consultantId?: string;
}) {
  const router = useRouter();

  // --- Basic info ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"RENT" | "SALE">("SALE");
  const [propertyType, setPropertyType] = useState<
    "APARTMENT" | "VILLA" | "HOUSE" | "LAND" | "COMMERCIAL" | "OTHER"
  >("APARTMENT");
  const [consultantId, setConsultantId] = useState(initialConsultantId);

  // --- Price ---
  const [priceAmount, setPriceAmount] = useState("");
  const [priceCurrency, setPriceCurrency] = useState<"TRY" | "USD" | "EUR">("TRY");
  const [isNegotiable, setIsNegotiable] = useState(false);

  // --- Specifications ---
  const [grossArea, setGrossArea] = useState("");
  const [netArea, setNetArea] = useState("");
  const [roomCount, setRoomCount] = useState("");
  const [bathroomCount, setBathroomCount] = useState("");
  const [floorNumber, setFloorNumber] = useState("");
  const [totalFloors, setTotalFloors] = useState("");
  const [buildingAge, setBuildingAge] = useState("");
  const [balcony, setBalcony] = useState(false);
  const [parking, setParking] = useState(false);
  const [heatingType, setHeatingType] = useState("");
  const [imageCount, setImageCount] = useState("");

  // --- Location ---
  const [district, setDistrict] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!title.trim() || title.trim().length < 10)
      e.title = "Başlık en az 10 karakter olmalıdır.";
    if (!description.trim() || description.trim().length < 50)
      e.description = "Açıklama en az 50 karakter olmalıdır.";
    if (!district)
      e.district = "İlçe zorunludur.";
    if (!neighborhood.trim())
      e.neighborhood = "Mahalle zorunludur.";
    if (!grossArea || Number(grossArea) < 1)
      e.grossArea = "Brüt alan en az 1 m² olmalıdır.";
    if (roomCount === "" || Number(roomCount) < 0)
      e.roomCount = "Oda sayısı zorunludur.";
    if (bathroomCount === "" || Number(bathroomCount) < 0)
      e.bathroomCount = "Banyo sayısı zorunludur.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const dto: CreateListingDto = {
        title: title.trim(),
        consultantId: consultantId.trim() || undefined,
        description: description.trim() || undefined,
        category,
        propertyType,
        price: priceAmount
          ? { amount: Number(priceAmount), currency: priceCurrency, isNegotiable }
          : undefined,
        location: district
          ? {
              city: "Antalya",
              district,
              neighborhood: neighborhood.trim() || undefined,
              coordinates:
                lat && lng
                  ? { latitude: Number(lat), longitude: Number(lng) }
                  : undefined,
            }
          : undefined,
        specifications: {
          roomCount: roomCount !== "" ? Number(roomCount) : undefined,
          bathroomCount: bathroomCount !== "" ? Number(bathroomCount) : undefined,
          floorNumber: floorNumber !== "" ? Number(floorNumber) : undefined,
          totalFloors: totalFloors !== "" ? Number(totalFloors) : undefined,
          grossArea: grossArea !== "" ? Number(grossArea) : undefined,
          netArea: netArea !== "" ? Number(netArea) : undefined,
          buildingAge: buildingAge !== "" ? Number(buildingAge) : undefined,
          hasParking: parking || undefined,
          hasBalcony: balcony || undefined,
          heatingType: heatingType || undefined,
        },
        imageCount: imageCount !== "" ? Number(imageCount) : undefined,
      };

      const listing = await createListing(dto);
      router.push(`/consultant/listings/${listing.id}`);
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

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
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
            className={input()}
          />
        </Field>

        <Field label="Açıklama" required error={errors.description}>
          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            minLength={50}
            maxLength={5000}
            placeholder="İlanı detaylı biçimde tanımlayın (en az 50 karakter)…"
            className={input()}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="İlan Türü">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as typeof category)}
              className={input()}
            >
              <option value="SALE">Satılık</option>
              <option value="RENT">Kiralık</option>
            </select>
          </Field>
          <Field label="Emlak Tipi">
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value as typeof propertyType)}
              className={input()}
            >
              {(["APARTMENT", "VILLA", "HOUSE", "LAND", "COMMERCIAL", "OTHER"] as const).map(
                (t) => (
                  <option key={t} value={t}>
                    {PROPERTY_TYPE_LABELS[t]}
                  </option>
                ),
              )}
            </select>
          </Field>
        </div>

        <Field label="Danışman Kimliği">
          <input
            type="text"
            value={consultantId}
            onChange={(e) => setConsultantId(e.target.value)}
            placeholder="Örn: c-001"
            className={input()}
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
              className={input()}
            />
          </Field>
          <Field label="Para Birimi">
            <select
              value={priceCurrency}
              onChange={(e) => setPriceCurrency(e.target.value as typeof priceCurrency)}
              className={input()}
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
              className={input()}
            />
          </Field>
          <Field label="Net m²">
            <input
              type="number"
              min={1}
              max={100000}
              value={netArea}
              onChange={(e) => setNetArea(e.target.value)}
              className={input()}
            />
          </Field>
          <Field label="Oda Sayısı" required error={errors.roomCount}>
            <input
              type="number"
              min={0}
              max={20}
              value={roomCount}
              onChange={(e) => setRoomCount(e.target.value)}
              className={input()}
            />
          </Field>
          <Field label="Banyo Sayısı" required error={errors.bathroomCount}>
            <input
              type="number"
              min={0}
              max={20}
              value={bathroomCount}
              onChange={(e) => setBathroomCount(e.target.value)}
              className={input()}
            />
          </Field>
          <Field label="Bulunduğu Kat">
            <input
              type="number"
              value={floorNumber}
              onChange={(e) => setFloorNumber(e.target.value)}
              className={input()}
            />
          </Field>
          <Field label="Toplam Kat">
            <input
              type="number"
              min={1}
              value={totalFloors}
              onChange={(e) => setTotalFloors(e.target.value)}
              className={input()}
            />
          </Field>
          <Field label="Bina Yaşı (yıl)">
            <input
              type="number"
              min={0}
              max={200}
              value={buildingAge}
              onChange={(e) => setBuildingAge(e.target.value)}
              className={input()}
            />
          </Field>
          <Field label="Isıtma Tipi">
            <select
              value={heatingType}
              onChange={(e) => setHeatingType(e.target.value)}
              className={input()}
            >
              {HEATING_TYPES.map((h) => (
                <option key={h.value} value={h.value}>
                  {h.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fotoğraf Sayısı">
            <input
              type="number"
              min={0}
              max={100}
              value={imageCount}
              onChange={(e) => setImageCount(e.target.value)}
              placeholder="0"
              className={input()}
            />
          </Field>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-zinc-600">
            <input
              type="checkbox"
              checked={balcony}
              onChange={(e) => setBalcony(e.target.checked)}
              className="rounded border-zinc-300"
            />
            Balkon
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-600">
            <input
              type="checkbox"
              checked={parking}
              onChange={(e) => setParking(e.target.checked)}
              className="rounded border-zinc-300"
            />
            Otopark
          </label>
        </div>
      </Section>

      {/* Konum */}
      <Section title="Konum">
        <p className="text-xs text-zinc-400">Şehir Antalya olarak sabitlenmiştir.</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="İlçe" required error={errors.district}>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className={input()}
            >
              <option value="">İlçe seçin…</option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Mahalle" required error={errors.neighborhood}>
            <input
              type="text"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Mahalle adı"
              className={input()}
            />
          </Field>
          <Field label="Enlem (isteğe bağlı)">
            <input
              type="number"
              step="0.00000001"
              placeholder="36.88…"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className={input()}
            />
          </Field>
          <Field label="Boylam (isteğe bağlı)">
            <input
              type="number"
              step="0.00000001"
              placeholder="30.70…"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className={input()}
            />
          </Field>
        </div>
        <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-xs text-zinc-400">
          Harita konumu — yakında
        </div>
      </Section>

      {/* Medya */}
      <Section title="Medya">
        <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-xs text-zinc-400">
          Fotoğraf yükleme — yakında (fotoğraf sayısını yukarıdan girin)
        </div>
      </Section>

      {apiError && <ApiErrorMessage error={apiError} />}

      {/* Aksiyon butonu */}
      <div className="flex items-center justify-end gap-3 border-t border-zinc-200 pt-6">
        <button
          type="button"
          disabled
          className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-400 cursor-not-allowed"
          title="Taslak Kaydetme — henüz desteklenmiyor"
        >
          Taslak Olarak Kaydet
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {loading ? "Gönderiliyor…" : "İncelemeye Gönder"}
        </button>
      </div>
    </form>
  );
}

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

function input() {
  return "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400";
}
