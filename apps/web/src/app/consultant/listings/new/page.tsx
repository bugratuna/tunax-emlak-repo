import { ListingForm } from "@/components/listing-form";

export default function NewListingPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <p className="mb-1 text-sm text-zinc-500">
          <a href="/consultant/listings" className="hover:underline">
            İlanlarım
          </a>{" "}
          / Yeni İlan
        </p>
        <h1 className="text-xl font-semibold text-zinc-900">
          Yeni ilan oluştur
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Tüm zorunlu alanları doldurun ve &quot;İncelemeye Gönder&quot; düğmesine tıklayın.
        </p>
      </div>
      <ListingForm mode="create" />
    </div>
  );
}
