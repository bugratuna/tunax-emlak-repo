import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { getListing, listListings, getListingContact } from "@/lib/api/listings";
import { ApiErrorMessage } from "@/components/api-error-message";
import { LeadInquiryForm } from "./lead-form";
import { ApiRequestError } from "@/lib/api/client";
import type { Listing } from "@/lib/types";
import { PhotoGalleryWidget, MapWidget } from "./client-widgets";
import { ContactReveal } from "@/components/contact-reveal";
import { RichTextRenderer } from "@/components/rich-text-renderer";
import { FEATURE_GROUP_LABELS } from "@/lib/taxonomy";

// ── Label maps ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  SALE: "Satılık",
  RENT: "Kiralık",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Taslak",
  PENDING_REVIEW: "İnceleme Bekliyor",
  NEEDS_CHANGES: "Düzenleme Gerekiyor",
  PUBLISHED: "Yayında",
  ARCHIVED: "Arşivde",
  UNPUBLISHED: "Yayından Kaldırıldı",
};

// ── Page ──────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params;

  let listing: Listing;
  try {
    listing = await getListing(id);
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 404) notFound();
    return (
      <ApiErrorMessage
        error={err instanceof Error ? err : "İlan yüklenemedi."}
      />
    );
  }

  // Similar listings — best-effort, non-blocking
  let similar: Listing[] = [];
  try {
    if (listing.location?.district) {
      const res = await listListings({ district: listing.location.district });
      similar = res.data.filter((l) => l.id !== id).slice(0, 3);
    }
  } catch {
    // non-critical
  }

  // Consultant contact info (SSR — name only; phone revealed client-side)
  let consultantName = listing.consultantId;
  if (listing.status === "PUBLISHED") {
    try {
      const contact = await getListingContact(id);
      consultantName = contact.consultantName;
    } catch {
      // non-critical
    }
  }

  const price = listing.price;
  const specs = listing.specifications;
  const loc = listing.location;
  const photos = listing.media ?? [];
  const coords = loc?.coordinates;

  const priceText = price
    ? `${price.amount.toLocaleString("tr-TR")} ${price.currency ?? "TRY"}`
    : null;

  const locationCrumbs = [loc?.city, loc?.district, loc?.neighborhood].filter(
    Boolean,
  ) as string[];

  const featureEntries = listing.detailInfos
    ? Object.entries(listing.detailInfos).filter(([, v]) => v.length > 0)
    : [];

  return (
    <div className="space-y-8">
      {/* Non-published warning banner */}
      {listing.status !== "PUBLISHED" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Bu ilan yayında değil —{" "}
          <strong>{STATUS_LABELS[listing.status] ?? listing.status}</strong>
        </div>
      )}

      {/* ── Photo Gallery ─────────────────────────────────────────────────── */}
      <PhotoGalleryWidget photos={photos} title={listing.title} />

      {/* ── Main grid ─────────────────────────────────────────────────────── */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* ── Left column ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title block */}
          <div>
            {locationCrumbs.length > 0 && (
              <p className="mb-1.5 text-xs font-medium uppercase tracking-widest text-zinc-400">
                {locationCrumbs.join(" › ")}
              </p>
            )}
            <h1 className="text-2xl font-bold leading-snug text-zinc-900 sm:text-3xl">
              {listing.title}
            </h1>
            {listing.listingNumber && (
              <p className="mt-1 flex items-center gap-2 font-mono text-xs tracking-widest text-zinc-400">
                <span className="font-sans text-[10px] uppercase tracking-widest">İlan No</span>
                <span className="rounded bg-zinc-100 px-2 py-0.5 text-zinc-600">
                  {listing.listingNumber}
                </span>
              </p>
            )}
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {listing.category && (
                <span className="rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white">
                  {CATEGORY_LABELS[listing.category] ?? listing.category}
                </span>
              )}
              {(listing.subtype ?? listing.propertyType) && (
                <span className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-0.5 text-xs font-medium text-zinc-600">
                  {listing.subtype ?? listing.propertyType}
                </span>
              )}
              <span className="text-xs text-zinc-400">
                {new Date(listing.submittedAt).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Price — mobile only (hidden lg+) */}
          {priceText && (
            <div className="rounded-xl border border-zinc-200 bg-white p-4 lg:hidden">
              <p className="text-2xl font-bold text-zinc-900">{priceText}</p>
              {price?.isNegotiable && (
                <p className="mt-0.5 text-xs text-zinc-500">Pazarlığa açık</p>
              )}
            </div>
          )}

          {/* Key facts — Row 1: metric chips */}
          {specs && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Fact
                  label="Oda Sayısı"
                  value={specs.roomCount != null ? String(specs.roomCount) : null}
                />
                <Fact
                  label="Brüt m²"
                  value={specs.grossArea != null ? `${specs.grossArea} m²` : null}
                />
                <Fact
                  label="Net m²"
                  value={specs.netArea != null ? `${specs.netArea} m²` : null}
                />
                <Fact
                  label="Kat"
                  value={
                    specs.floorNumber != null
                      ? specs.totalFloors != null
                        ? `${specs.floorNumber} / ${specs.totalFloors}`
                        : String(specs.floorNumber)
                      : null
                  }
                />
                <Fact
                  label="Bina Yaşı"
                  value={
                    specs.buildingAge != null ? `${specs.buildingAge} yıl` : null
                  }
                />
                <Fact label="Isıtma" value={specs.heatingType ?? null} />
                <Fact
                  label="Banyo"
                  value={
                    specs.bathroomCount != null
                      ? String(specs.bathroomCount)
                      : null
                  }
                />
              </div>
              {/* Row 2: boolean feature tags (new row for breathing room) */}
              {(specs.hasBalcony ||
                specs.hasParking ||
                specs.hasElevator ||
                specs.isFurnished ||
                specs.inComplex ||
                specs.isLoanEligible ||
                specs.isSwapAvailable) && (
                <div className="flex flex-wrap gap-2">
                  {specs.hasBalcony && <Tag label="Balkon" />}
                  {specs.hasParking && <Tag label="Otopark" />}
                  {specs.hasElevator && <Tag label="Asansör" />}
                  {specs.isFurnished && <Tag label="Eşyalı" />}
                  {specs.inComplex && <Tag label="Site İçi" />}
                  {specs.isLoanEligible && <Tag label="Krediye Uygun" />}
                  {specs.isSwapAvailable && <Tag label="Takasa Açık" />}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {listing.description && (
            <Card title="Açıklama">
              <RichTextRenderer html={listing.description} />
            </Card>
          )}

          {/* Feature groups */}
          {featureEntries.length > 0 && (
            <Card title="Özellikler">
              <div className="space-y-5">
                {featureEntries.map(([group, vals]) => (
                  <div key={group}>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                      {(FEATURE_GROUP_LABELS as Record<string, string>)[
                        group
                      ] ?? group}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {vals.map((v) => (
                        <span
                          key={v}
                          className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-700"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Map */}
          {coords && (
            <Card title="Konum">
              <MapWidget
                lat={coords.latitude}
                lng={coords.longitude}
                title={listing.title}
              />
            </Card>
          )}
        </div>

        {/* ── Right sidebar ────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Price card — desktop */}
          {priceText && (
            <div className="hidden rounded-xl border border-zinc-200 bg-white p-5 shadow-sm lg:block">
              <p className="text-3xl font-bold text-zinc-900">{priceText}</p>
              {price?.isNegotiable && (
                <p className="mt-1 text-sm text-zinc-500">Pazarlığa açık</p>
              )}
              {listing.category && (
                <p className="mt-0.5 text-sm text-zinc-400">
                  {CATEGORY_LABELS[listing.category] ?? listing.category}
                </p>
              )}
            </div>
          )}

          {/* Lead form */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            {listing.status === "PUBLISHED" ? (
              <>
                <h2 className="mb-4 text-base font-semibold text-zinc-900">
                  İletişim
                </h2>
                <LeadInquiryForm listingId={listing.id} />
              </>
            ) : (
              <p className="text-sm text-zinc-500">
                Bu ilan şu anda iletişime kapalı.
              </p>
            )}
          </div>

          {/* Consultant card with phone reveal */}
          {listing.status === "PUBLISHED" ? (
            <ContactReveal listingId={listing.id} consultantName={consultantName} />
          ) : (
            <ConsultantCard consultantId={listing.consultantId} />
          )}
        </div>
      </div>

      {/* ── Similar listings ──────────────────────────────────────────────── */}
      {similar.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold text-zinc-900">
            Benzer İlanlar
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((s) => (
              <SimilarCard key={s.id} listing={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        {title}
      </h2>
      {children}
    </div>
  );
}

/** Metric chip — label on top, bold value on bottom. Returns null when value is absent. */
function Fact({ label, value }: { label: string; value: string | null }) {
  if (value == null) return null;
  return (
    <div className="flex min-w-[76px] flex-col items-center rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-center shadow-sm">
      <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </span>
      <span className="mt-0.5 text-sm font-bold text-zinc-800">{value}</span>
    </div>
  );
}

/** Boolean feature pill (Balkon, Otopark, …). */
function Tag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
      ✓ {label}
    </span>
  );
}

function ConsultantCard({ consultantId }: { consultantId: string }) {
  const initials = consultantId.slice(0, 2).toUpperCase();
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Danışman
      </h2>
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-800">
            {consultantId}
          </p>
          <p className="text-xs text-zinc-400">Gayrimenkul Danışmanı</p>
        </div>
      </div>
    </div>
  );
}

function SimilarCard({ listing }: { listing: Listing }) {
  const cover = listing.media?.[0]?.url;
  const price = listing.price;
  const priceStr = price
    ? `${price.amount.toLocaleString("tr-TR")} ${price.currency ?? "TRY"}`
    : null;
  const specs = listing.specifications;
  const loc = listing.location;

  const specLine = [
    specs?.roomCount != null ? `${specs.roomCount} oda` : null,
    specs?.grossArea != null ? `${specs.grossArea} m²` : null,
    loc?.district ?? null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group overflow-hidden rounded-xl border border-zinc-200 bg-white transition-shadow hover:shadow-md"
    >
      {/* Cover photo */}
      <div className="relative h-44 bg-zinc-100">
        {cover ? (
          <Image
            src={cover}
            alt={listing.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-zinc-400">
            Fotoğraf yok
          </div>
        )}
        {listing.category && (
          <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            {listing.category === "SALE" ? "Satılık" : "Kiralık"}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="space-y-1 p-3">
        <p className="line-clamp-2 text-sm font-semibold text-zinc-800 transition-colors group-hover:text-blue-700">
          {listing.title}
        </p>
        {priceStr && (
          <p className="text-sm font-bold text-zinc-900">{priceStr}</p>
        )}
        {specLine && <p className="text-xs text-zinc-500">{specLine}</p>}
      </div>
    </Link>
  );
}
