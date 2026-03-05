import { notFound } from "next/navigation";
import Link from "next/link";
import { getListing } from "@/lib/api/listings";
import { ListingForm } from "@/components/listing-form";
import { ApiErrorMessage } from "@/components/api-error-message";
import { ApiRequestError } from "@/lib/api/client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditListingPage({ params }: Props) {
  const { id } = await params;

  let listing;
  try {
    listing = await getListing(id);
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 404) notFound();
    return <ApiErrorMessage error={err instanceof Error ? err : "İlan yüklenemedi."} />;
  }

  // Düzenleme yalnızca DRAFT veya NEEDS_CHANGES durumlarında izin verilir
  if (listing.status !== "DRAFT" && listing.status !== "NEEDS_CHANGES") {
    return (
      <div className="max-w-2xl">
        <p className="mb-1 text-sm text-zinc-500">
          <Link href="/consultant/listings" className="hover:underline">
            İlanlarım
          </Link>{" "}
          / Düzenle
        </p>
        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600">
          Bu ilan mevcut durumunda düzenlenemez (
          <strong>{listing.status}</strong>). Düzenleme yalnızca{" "}
          <strong>DRAFT</strong> veya <strong>NEEDS_CHANGES</strong> durumunda
          mümkündür.
          <div className="mt-3">
            <Link
              href={`/consultant/listings/${id}`}
              className="text-zinc-900 underline"
            >
              İlan durumunu görüntüle
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <p className="mb-1 text-sm text-zinc-500">
          <Link href="/consultant/listings" className="hover:underline">
            İlanlarım
          </Link>{" "}
          /{" "}
          <Link href={`/consultant/listings/${id}`} className="hover:underline">
            {listing.title}
          </Link>{" "}
          / Düzenle
        </p>
        <h1 className="text-xl font-semibold text-zinc-900">İlanı Düzenle</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Mevcut durum: <strong>{listing.status}</strong>
        </p>
      </div>

      {/* Admin geri bildirim banneri */}
      {listing.status === "NEEDS_CHANGES" && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">
            Değişiklik Talebi
          </p>
          <p className="mt-1 text-sm text-amber-700">
            Yönetici bu ilan için değişiklik talep etti. Lütfen gerekli
            düzenlemeleri yapıp tekrar incelemeye gönderin.
          </p>
        </div>
      )}

      <ListingForm mode="edit" initialValues={listing} listingId={id} />
    </div>
  );
}
