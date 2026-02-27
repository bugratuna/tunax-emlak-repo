import { notFound } from "next/navigation";
import { getListing } from "@/lib/api/listings";
import { StatusBadge } from "@/components/status-badge";
import { ApiErrorMessage } from "@/components/api-error-message";
import { LeadInquiryForm } from "./lead-form";
import { ApiRequestError } from "@/lib/api/client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params;

  let listing;
  try {
    listing = await getListing(id);
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 404) {
      notFound();
    }
    return (
      <ApiErrorMessage
        error={err instanceof Error ? err : "Unable to load listing."}
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Left: listing info */}
      <div className="lg:col-span-2 space-y-6">
        {/* Image gallery placeholder */}
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-400">
          Image gallery — upload endpoint not yet implemented
        </div>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">
              {listing.title}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Consultant: {listing.consultantId}
            </p>
          </div>
          <StatusBadge status={listing.status} />
        </div>

        {/* Specs panel */}
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Details
          </h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
            <SpecRow label="Status" value={listing.status} />
            <SpecRow
              label="Submitted"
              value={new Date(listing.submittedAt).toLocaleDateString()}
            />
            <SpecRow
              label="Created"
              value={new Date(listing.createdAt).toLocaleDateString()}
            />
            <SpecRow
              label="Updated"
              value={new Date(listing.updatedAt).toLocaleDateString()}
            />
          </dl>
          <p className="mt-4 text-xs text-zinc-400">
            Additional specs (price, type, area, etc.) will be shown once the
            full listing form endpoint is implemented.
          </p>
        </div>
      </div>

      {/* Right: lead form */}
      {listing.status === "PUBLISHED" ? (
        <aside className="rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-zinc-900">
            Contact about this listing
          </h2>
          <LeadInquiryForm listingId={listing.id} />
        </aside>
      ) : (
        <aside className="rounded-lg border border-zinc-200 bg-zinc-50 p-5">
          <p className="text-sm text-zinc-500">
            This listing is not currently available for inquiries (status:{" "}
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
