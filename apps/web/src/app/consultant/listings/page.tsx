import Link from "next/link";
import { listListings } from "@/lib/api/listings";
import { StatusBadge } from "@/components/status-badge";

export default async function ConsultantListingsPage() {
  /**
   * TODO: No consultant-scoped listing list endpoint exists yet.
   * Needs: GET /api/listings?consultantId=:id
   * Stub returns [].
   */
  const listings = await listListings();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">My Listings</h1>
          <p className="text-sm text-zinc-500">
            Manage your property listings
          </p>
        </div>
        <Link
          href="/consultant/listings/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          + New listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-12 text-center">
          <p className="text-sm text-zinc-500">You have no listings yet.</p>
          <p className="mt-1 text-xs text-zinc-400">
            (Listing list endpoint not yet implemented — stub returns empty array)
          </p>
          <Link
            href="/consultant/listings/new"
            className="mt-4 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Create your first listing
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Submitted
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {listings.map((listing) => (
                <tr key={listing.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {listing.title}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={listing.status} />
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(listing.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/consultant/listings/${listing.id}`}
                      className="mr-2 text-zinc-600 underline hover:text-zinc-900"
                    >
                      View
                    </Link>
                    {(listing.status === "DRAFT" || listing.status === "NEEDS_CHANGES") && (
                      <Link
                        href={`/consultant/listings/${listing.id}/edit`}
                        className="text-zinc-600 underline hover:text-zinc-900"
                      >
                        Edit
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
