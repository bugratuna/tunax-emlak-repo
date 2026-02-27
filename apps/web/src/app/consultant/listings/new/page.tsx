import { ListingForm } from "@/components/listing-form";

export default function NewListingPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <p className="mb-1 text-sm text-zinc-500">
          <a href="/consultant/listings" className="hover:underline">
            My Listings
          </a>{" "}
          / New listing
        </p>
        <h1 className="text-xl font-semibold text-zinc-900">
          Create a new listing
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Fill in all required fields then click "Submit for Review".
        </p>
      </div>
      <ListingForm mode="create" />
    </div>
  );
}
