import { notFound } from "next/navigation";
import Link from "next/link";
import { getListing, getListingFeedback } from "@/lib/api/listings";
import { StatusBadge } from "@/components/status-badge";
import { ApiErrorMessage } from "@/components/api-error-message";
import { CompleteSaleButton } from "../complete-sale-button";
import { UnpublishButton } from "../unpublish-button";
import { ResubmitButton } from "./resubmit-button";
import { ApiRequestError } from "@/lib/api/client";
import { getServerToken } from "@/lib/auth.server";
import ConsultantListingWidgets from "./client-widgets";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ConsultantListingStatusPage({ params }: Props) {
  const { id } = await params;

  let listing;
  try {
    listing = await getListing(id);
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 404) notFound();
    return <ApiErrorMessage error={err instanceof Error ? err : "İlan yüklenemedi."} />;
  }

  let feedback: string | null = null;
  if (listing.status === "NEEDS_CHANGES") {
    try {
      const token = await getServerToken();
      const result = await getListingFeedback(id, token ?? undefined);
      feedback = result.feedback;
    } catch {
      // Non-fatal — feedback may not yet be stored
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="mb-1 text-sm text-zinc-500">
          <Link href="/consultant/listings" className="hover:underline">
            İlanlarım
          </Link>{" "}
          / Durum
        </p>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-xl font-semibold text-zinc-900">{listing.title}</h1>
          <StatusBadge status={listing.status} />
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          ID: <span className="font-mono text-xs">{listing.id}</span>
        </p>
      </div>

      {/* ── Photo Manager + Location Picker (client-only, ssr:false) ─────── */}
      <ConsultantListingWidgets listing={listing} />

      {/* ── Timeline ─────────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Zaman Çizelgesi
        </h2>
        <dl className="space-y-2 text-sm">
          <Row
            label="Oluşturulma"
            value={listing.createdAt.slice(0, 16).replace("T", " ")}
          />
          <Row
            label="Gönderilme"
            value={listing.submittedAt.slice(0, 16).replace("T", " ")}
          />
          <Row
            label="Son güncelleme"
            value={listing.updatedAt.slice(0, 16).replace("T", " ")}
          />
        </dl>
      </div>

      {/* ── Admin feedback — shown only for NEEDS_CHANGES ────────────────── */}
      {listing.status === "NEEDS_CHANGES" && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-5 space-y-4">
          <div>
            <h2 className="mb-1 text-sm font-semibold text-orange-800">
              Değişiklik Talebi — Yönetici Geri Bildirimi
            </h2>
            {feedback ? (
              <p className="text-sm text-orange-700">{feedback}</p>
            ) : (
              <p className="text-sm text-orange-600">
                Yönetici bu ilan için değişiklik talep etti. Geri bildirim henüz
                eklenmemiş olabilir — lütfen aşağıdaki adımları izleyerek ilanı
                düzenleyin ve yeniden gönderin.
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/consultant/listings/${listing.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 transition-colors"
            >
              ✏️ İlanı Düzenle
            </Link>
            <ResubmitButton listingId={listing.id} />
          </div>
          <p className="text-xs text-orange-500">
            Önce &quot;İlanı Düzenle&quot; ile gerekli değişiklikleri yapın, ardından &quot;Yeniden Gönder&quot; ile incelemeye yollayın.
          </p>
        </div>
      )}

      {/* ── Status-specific guidance ─────────────────────────────────────── */}
      {listing.status === "PENDING_REVIEW" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          İlanınız inceleme sırasında. Yönetici karar verene kadar düzenleme
          kilitlidir.
        </div>
      )}
      {listing.status === "PUBLISHED" && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700 space-y-3">
          <p>
            İlanınız platformda yayında.{" "}
            <Link
              href={`/listings/${listing.id}`}
              className="font-medium underline"
            >
              Genel sayfayı görüntüle →
            </Link>
          </p>
          <div className="space-y-2">
            <UnpublishButton listingId={listing.id} block />
            <CompleteSaleButton listingId={listing.id} block />
          </div>
        </div>
      )}
      {listing.status === "UNPUBLISHED" && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-5 space-y-4">
          <div>
            <h2 className="mb-1 text-sm font-semibold text-orange-800">
              İlan Yayından Kaldırıldı
            </h2>
            <p className="text-sm text-orange-700">
              Bu ilan herkese açık listeden kaldırılmıştır. Yeniden yayına almak için
              incelemeye gönderebilirsiniz.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/consultant/listings/${listing.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 transition-colors"
            >
              İlanı Düzenle
            </Link>
            <ResubmitButton listingId={listing.id} />
          </div>
        </div>
      )}
      {listing.status === "ARCHIVED" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Bu ilan arşivlendi ve artık platformda görünmüyor. Reddedilen ilanlar
          nihai durumdadır — yeni bir ilan oluşturmanız gerekmektedir.
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</dt>
      <dd className="mt-0.5 text-zinc-700">{value}</dd>
    </div>
  );
}
