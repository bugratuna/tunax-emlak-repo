import { notFound } from "next/navigation";
import { getListing } from "@/lib/api/listings";
import { StatusBadge } from "@/components/status-badge";
import { ApiErrorMessage } from "@/components/api-error-message";
import { LeadInquiryForm } from "./lead-form";
import { ApiRequestError } from "@/lib/api/client";
import type { Listing } from "@/lib/types";

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Daire",
  VILLA: "Villa",
  HOUSE: "Müstakil Ev",
  LAND: "Arsa",
  COMMERCIAL: "İşyeri",
  OTHER: "Diğer",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params;

  let listing: Listing;
  try {
    listing = await getListing(id);
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 404) {
      notFound();
    }
    return (
      <ApiErrorMessage
        error={err instanceof Error ? err : "İlan yüklenemedi."}
      />
    );
  }

  const price = listing.price;
  const specs = listing.specifications;
  const loc = listing.location;

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Left: listing info */}
      <div className="lg:col-span-2 space-y-6">
        {/* Image gallery placeholder */}
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-400">
          Fotoğraf galerisi — yakında
        </div>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">
              {listing.title}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Danışman: {listing.consultantId}
            </p>
          </div>
          <StatusBadge status={listing.status} />
        </div>

        {/* Description */}
        {listing.description && (
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Açıklama
            </h2>
            <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-line">
              {listing.description}
            </p>
          </div>
        )}

        {/* Facts table */}
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            İlan Detayları
          </h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
            <SpecRow label="Durum" value={listing.status} />
            {listing.category && (
              <SpecRow
                label="İlan Türü"
                value={listing.category === "SALE" ? "Satılık" : "Kiralık"}
              />
            )}
            {listing.propertyType && (
              <SpecRow
                label="Emlak Tipi"
                value={
                  PROPERTY_TYPE_LABELS[listing.propertyType] ??
                  listing.propertyType
                }
              />
            )}
            {price && (
              <SpecRow
                label="Fiyat"
                value={`${price.amount.toLocaleString("tr-TR")} ${price.currency ?? "TRY"}${price.isNegotiable ? " · Pazarlığa açık" : ""}`}
              />
            )}
            {specs?.grossArea != null && (
              <SpecRow label="Brüt Alan" value={`${specs.grossArea} m²`} />
            )}
            {specs?.netArea != null && (
              <SpecRow label="Net Alan" value={`${specs.netArea} m²`} />
            )}
            {specs?.roomCount != null && (
              <SpecRow label="Oda Sayısı" value={String(specs.roomCount)} />
            )}
            {specs?.bathroomCount != null && (
              <SpecRow
                label="Banyo Sayısı"
                value={String(specs.bathroomCount)}
              />
            )}
            {specs?.floorNumber != null && (
              <SpecRow label="Kat" value={String(specs.floorNumber)} />
            )}
            {specs?.totalFloors != null && (
              <SpecRow
                label="Toplam Kat"
                value={String(specs.totalFloors)}
              />
            )}
            {specs?.buildingAge != null && (
              <SpecRow
                label="Bina Yaşı"
                value={`${specs.buildingAge} yıl`}
              />
            )}
            {specs?.heatingType && (
              <SpecRow label="Isıtma" value={specs.heatingType} />
            )}
            {specs?.hasBalcony && <SpecRow label="Balkon" value="Var" />}
            {specs?.hasParking && <SpecRow label="Otopark" value="Var" />}
            {loc?.district && (
              <SpecRow label="İlçe" value={loc.district} />
            )}
            {loc?.neighborhood && (
              <SpecRow label="Mahalle" value={loc.neighborhood} />
            )}
            <SpecRow
              label="Gönderim Tarihi"
              value={new Date(listing.submittedAt).toLocaleDateString("tr-TR")}
            />
          </dl>
        </div>

        {/* Map placeholder */}
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-400">
          Harita — yakında
        </div>
      </div>

      {/* Right: lead form */}
      {listing.status === "PUBLISHED" ? (
        <aside className="rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-zinc-900">
            Bu ilan hakkında iletişim
          </h2>
          <LeadInquiryForm listingId={listing.id} />
        </aside>
      ) : (
        <aside className="rounded-lg border border-zinc-200 bg-zinc-50 p-5">
          <p className="text-sm text-zinc-500">
            Bu ilan şu anda sorgulara açık değil (durum:{" "}
            <strong>{listing.status}</strong>).
          </p>
        </aside>
      )}
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-zinc-700">{value}</dd>
    </div>
  );
}
