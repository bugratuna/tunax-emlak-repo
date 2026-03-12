import Image from "next/image";

/**
 * Shared full-page loading overlay.
 * Matches the listings page loader design exactly.
 * Used by route-level loading.tsx files and client-side readiness wrappers.
 */
export function PageLoader() {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-blue-50/80 backdrop-blur-sm"
      role="status"
      aria-label="Yükleniyor"
    >
      <div className="relative flex items-center justify-center">
        {/* Dışarıdaki dönen daire */}
        <div className="h-20 w-20 animate-spin rounded-full border-4 border-blue-400 border-t-transparent" />

        {/* Ortadaki sabit logo */}
        <div className="absolute animate-pulse">
          <Image
            src="/brand/logo-icon.svg"
            alt=""
            aria-hidden="true"
            width={32}
            height={32}
            className="h-8 w-8"
          />
        </div>
      </div>
    </div>
  );
}
