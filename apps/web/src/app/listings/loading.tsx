import { Building2 } from "lucide-react";

/**
 * Next.js App Router automatic loading boundary for /listings.
 * Shown while the server component is streaming in.
 * Must NOT be a Client Component — no "use client" here.
 */
export default function ListingsLoading() {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-blue-50/80 backdrop-blur-sm"
      role="status"
      aria-label="İlanlar yükleniyor"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="animate-pulse rounded-2xl bg-blue-100 p-5">
          <Building2 size={40} className="text-blue-400" strokeWidth={1.5} />
        </div>
        <p className="text-sm font-medium text-blue-600">İlanlar yükleniyor…</p>
      </div>
    </div>
  );
}
