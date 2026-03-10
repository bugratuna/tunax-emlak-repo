import type { Metadata } from "next";
import Link from "next/link";
import { ListingForm } from "@/components/listing-form";

export const metadata: Metadata = {
  title: "Yeni İlan Oluştur",
  icons: {
    icon: "/brand/logo-icon.svg",
  },
};

/**
 * Admin create-listing page.
 * Uses the same ListingForm as the consultant flow.
 * The backend allows ADMIN role on POST /api/listings since Issue 8.
 */
export default function AdminCreateListingPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <p className="mb-1 text-sm text-zinc-500">
          <Link href="/admin/moderation" className="hover:underline">
            Moderasyon
          </Link>{" "}
          / Yeni İlan
        </p>
        <h1 className="text-xl font-semibold text-zinc-900">Yeni İlan Oluştur</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Admin olarak ilan oluşturuyorsunuz. İlan size atanacak.
        </p>
      </div>

      <ListingForm mode="create" />
    </div>
  );
}
