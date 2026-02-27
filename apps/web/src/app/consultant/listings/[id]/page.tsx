import { notFound } from "next/navigation";
import Link from "next/link";
import { getListing } from "@/lib/api/listings";
import { getModerationReport } from "@/lib/api/moderation";
import { StatusBadge } from "@/components/status-badge";
import { ApiErrorMessage } from "@/components/api-error-message";
import { ResubmitButton } from "./resubmit-button";
import { ApiRequestError } from "@/lib/api/client";
import type { ModerationReport } from "@/lib/types";

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
    return <ApiErrorMessage error={err instanceof Error ? err : "Error loading listing."} />;
  }

  let report: ModerationReport | null = null;
  try {
    report = await getModerationReport(id);
  } catch {
    // 404 is expected when no report exists yet — non-fatal
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="mb-1 text-sm text-zinc-500">
          <Link href="/consultant/listings" className="hover:underline">
            My Listings
          </Link>{" "}
          / Status
        </p>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-xl font-semibold text-zinc-900">{listing.title}</h1>
          <StatusBadge status={listing.status} />
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          ID: <span className="font-mono text-xs">{listing.id}</span>
        </p>
      </div>

      {/* Timeline info */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Timeline
        </h2>
        <dl className="space-y-2 text-sm">
          <Row
            label="Created"
            value={new Date(listing.createdAt).toLocaleString()}
          />
          <Row
            label="Submitted"
            value={new Date(listing.submittedAt).toLocaleString()}
          />
          <Row
            label="Last updated"
            value={new Date(listing.updatedAt).toLocaleString()}
          />
        </dl>
      </div>

      {/* Admin feedback callout — shown only for NEEDS_CHANGES */}
      {listing.status === "NEEDS_CHANGES" && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-5">
          <h2 className="mb-2 text-sm font-semibold text-orange-800">
            Admin Feedback — Action Required
          </h2>
          {report?.feedback ? (
            <p className="text-sm text-orange-700">{report.feedback}</p>
          ) : (
            <p className="text-sm text-orange-600">
              The admin returned this listing for changes. Feedback is being
              loaded — check again shortly.
            </p>
          )}
          <div className="mt-4">
            <ResubmitButton listingId={listing.id} />
          </div>
        </div>
      )}

      {/* Status-specific guidance */}
      {listing.status === "PENDING_REVIEW" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          Your listing is under review. Editing is locked until the admin
          makes a decision.
        </div>
      )}
      {listing.status === "PUBLISHED" && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          Your listing is live on the platform.
          <Link
            href={`/listings/${listing.id}`}
            className="ml-2 font-medium underline"
          >
            View public page →
          </Link>
        </div>
      )}
      {listing.status === "ARCHIVED" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          This listing has been archived. It is no longer visible on the
          platform. REJECTED is a terminal state — create a new listing if
          needed.
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
