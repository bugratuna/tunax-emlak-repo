"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createListing } from "@/lib/api/listings";
import { ApiErrorMessage } from "@/components/api-error-message";
import { ApiRequestError } from "@/lib/api/client";

const DISTRICTS = [
  "Muratpaşa", "Kepez", "Konyaaltı", "Döşemealtı", "Aksu",
  "Alanya", "Manavgat", "Serik", "Kemer", "Kumluca",
  "Finike", "Kaş", "Demre", "Elmalı", "Korkuteli",
  "Akseki", "Gündoğmuş", "İbradı", "Gazipaşa",
];

export function ListingForm({
  mode,
  consultantId = "anonymous",
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

  // --- Price ---
  const [priceAmount, setPriceAmount] = useState("");
  const [priceCurrency, setPriceCurrency] = useState<"TRY" | "USD" | "EUR">("TRY");
  const [isNegotiable, setIsNegotiable] = useState(false);

  // --- Specifications ---
  const [squareMeters, setSquareMeters] = useState("");
  const [roomCount, setRoomCount] = useState("");
  const [bathroomCount, setBathroomCount] = useState("");
  const [floorNumber, setFloorNumber] = useState("");
  const [totalFloors, setTotalFloors] = useState("");
  const [buildYear, setBuildYear] = useState("");
  const [furnished, setFurnished] = useState(false);
  const [balcony, setBalcony] = useState(false);
  const [parking, setParking] = useState(false);
  const [elevator, setElevator] = useState(false);
  const [pool, setPool] = useState(false);
  const [seaView, setSeaView] = useState(false);

  // --- Location ---
  const [district, setDistrict] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  // --- Contact ---
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!title.trim() || title.trim().length < 10)
      e.title = "Title must be at least 10 characters.";
    if (!description.trim() || description.trim().length < 50)
      e.description = "Description must be at least 50 characters.";
    if (!district) e.district = "District is required.";
    if (!neighborhood.trim()) e.neighborhood = "Neighborhood is required.";
    if (!squareMeters || Number(squareMeters) < 1)
      e.squareMeters = "Square meters must be at least 1.";
    if (roomCount === "" || Number(roomCount) < 0)
      e.roomCount = "Room count is required.";
    if (bathroomCount === "" || Number(bathroomCount) < 0)
      e.bathroomCount = "Bathroom count is required.";
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
      /**
       * NOTE: Current API (POST /api/listings) only accepts { title, consultantId }.
       * All remaining form fields are collected and validated client-side but NOT sent
       * until the endpoint is expanded to accept the full listing payload.
       * TODO: send full body when API supports it.
       */
      const listing = await createListing(title.trim(), consultantId);
      
      router.push(`/consultant/listings/${listing.id}`);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        const msg = Array.isArray(err.body.message)
          ? err.body.message.join(", ")
          : err.body.message;
        setApiError(msg);
      } else {
        console.log(err);
        setApiError("Unable to reach server.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {/* Basic info */}
      <Section title="Basic Information">
        <Field label="Title" required error={errors.title}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            minLength={10}
            maxLength={200}
            className={input()}
          />
        </Field>

        <Field label="Description" required error={errors.description}>
          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            minLength={50}
            maxLength={5000}
            className={input()}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className={input()}>
              <option value="SALE">SALE</option>
              <option value="RENT">RENT</option>
            </select>
          </Field>
          <Field label="Property type">
            <select value={propertyType} onChange={(e) => setPropertyType(e.target.value as typeof propertyType)} className={input()}>
              {["APARTMENT", "VILLA", "HOUSE", "LAND", "COMMERCIAL", "OTHER"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      {/* Price */}
      <Section title="Price">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Amount" required>
            <input
              type="number"
              min={0}
              step="0.01"
              value={priceAmount}
              onChange={(e) => setPriceAmount(e.target.value)}
              className={input()}
            />
          </Field>
          <Field label="Currency">
            <select value={priceCurrency} onChange={(e) => setPriceCurrency(e.target.value as typeof priceCurrency)} className={input()}>
              <option>TRY</option>
              <option>USD</option>
              <option>EUR</option>
            </select>
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-600">
          <input type="checkbox" checked={isNegotiable} onChange={(e) => setIsNegotiable(e.target.checked)} className="rounded border-zinc-300" />
          Price is negotiable
        </label>
      </Section>

      {/* Specifications */}
      <Section title="Specifications">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Area (m²)" required error={errors.squareMeters}>
            <input type="number" min={1} max={100000} value={squareMeters} onChange={(e) => setSquareMeters(e.target.value)} className={input()} />
          </Field>
          <Field label="Rooms" required error={errors.roomCount}>
            <input type="number" min={0} max={20} value={roomCount} onChange={(e) => setRoomCount(e.target.value)} className={input()} />
          </Field>
          <Field label="Bathrooms" required error={errors.bathroomCount}>
            <input type="number" min={0} max={20} value={bathroomCount} onChange={(e) => setBathroomCount(e.target.value)} className={input()} />
          </Field>
          <Field label="Floor no.">
            <input type="number" value={floorNumber} onChange={(e) => setFloorNumber(e.target.value)} className={input()} />
          </Field>
          <Field label="Total floors">
            <input type="number" value={totalFloors} onChange={(e) => setTotalFloors(e.target.value)} className={input()} />
          </Field>
          <Field label="Build year">
            <input type="number" min={1800} max={new Date().getFullYear() + 1} value={buildYear} onChange={(e) => setBuildYear(e.target.value)} className={input()} />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {[
            { label: "Furnished", val: furnished, set: setFurnished },
            { label: "Balcony", val: balcony, set: setBalcony },
            { label: "Parking", val: parking, set: setParking },
            { label: "Elevator", val: elevator, set: setElevator },
            { label: "Pool", val: pool, set: setPool },
            { label: "Sea view", val: seaView, set: setSeaView },
          ].map(({ label, val, set }) => (
            <label key={label} className="flex items-center gap-1.5 text-xs text-zinc-600">
              <input type="checkbox" checked={val} onChange={(e) => set(e.target.checked)} className="rounded border-zinc-300" />
              {label}
            </label>
          ))}
        </div>
      </Section>

      {/* Location */}
      <Section title="Location">
        <p className="text-xs text-zinc-400">City is fixed to Antalya.</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="District" required error={errors.district}>
            <select value={district} onChange={(e) => setDistrict(e.target.value)} className={input()}>
              <option value="">Select district…</option>
              {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Neighborhood (Mahalle)" required error={errors.neighborhood}>
            <input type="text" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className={input()} />
          </Field>
          <Field label="Latitude (optional)">
            <input type="number" step="0.00000001" placeholder="36.88…" value={lat} onChange={(e) => setLat(e.target.value)} className={input()} />
          </Field>
          <Field label="Longitude (optional)">
            <input type="number" step="0.00000001" placeholder="30.70…" value={lng} onChange={(e) => setLng(e.target.value)} className={input()} />
          </Field>
        </div>
        <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-xs text-zinc-400">
          Map pin placement — coming soon
        </div>
      </Section>

      {/* Contact */}
      <Section title="Contact (optional)">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Phone">
            <input type="tel" placeholder="+90…" value={phone} onChange={(e) => setPhone(e.target.value)} className={input()} />
          </Field>
          <Field label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input()} />
          </Field>
          <Field label="WhatsApp">
            <input type="tel" placeholder="+90…" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className={input()} />
          </Field>
        </div>
      </Section>

      {/* Media */}
      <Section title="Images">
        <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-xs text-zinc-400">
          Image upload — coming soon (min 1 required for submission)
        </div>
      </Section>

      {apiError && <ApiErrorMessage error={apiError} />}

      {/* Action bar */}
      <div className="flex items-center justify-end gap-3 border-t border-zinc-200 pt-6">
        <button
          type="button"
          disabled
          className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-400 cursor-not-allowed"
          title="Save as Draft — endpoint not yet implemented"
        >
          Save as Draft
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {loading ? "Submitting…" : "Submit for Review"}
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
