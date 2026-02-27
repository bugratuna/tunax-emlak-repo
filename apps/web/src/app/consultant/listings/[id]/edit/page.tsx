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
    return <ApiErrorMessage error={err instanceof Error ? err : "Error loading listing."} />;
  }

  // Edit is only allowed for DRAFT or NEEDS_CHANGES
  if (listing.status !== "DRAFT" && listing.status !== "NEEDS_CHANGES") {
    return (
      <div className="max-w-2xl">
        <p className="mb-1 text-sm text-zinc-500">
          <Link href="/consultant/listings" className="hover:underline">
            My Listings
          </Link>{" "}
          / Edit
        </p>
        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600">
          This listing cannot be edited in its current state (
          <strong>{listing.status}</strong>). Editing is only allowed when the
          listing is in <strong>DRAFT</strong> or <strong>NEEDS_CHANGES</strong>{" "}
          status.
          <div className="mt-3">
            <Link
              href={`/consultant/listings/${id}`}
              className="text-zinc-900 underline"
            >
              View listing status
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
            My Listings
          </Link>{" "}
          /{" "}
          <Link href={`/consultant/listings/${id}`} className="hover:underline">
            {listing.title}
          </Link>{" "}
          / Edit
        </p>
        <h1 className="text-xl font-semibold text-zinc-900">Edit listing</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Current status: <strong>{listing.status}</strong>
        </p>
      </div>
      <ListingForm mode="edit" consultantId={listing.consultantId} />
    </div>
  );
}
