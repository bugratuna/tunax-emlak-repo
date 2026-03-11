import Image from "next/image";

/**
 * Next.js App Router automatic loading boundary for /listings.
 * Shown while the server component is streaming in.
 */
export default function ListingsLoading() {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-blue-50/80 backdrop-blur-sm"
      role="status"
      aria-label="Yükleniyor"
    >
      <div className="relative flex items-center justify-center">
        {/* Dışarıdaki dönen daire */}
        <div className="h-20 w-20 animate-spin rounded-full border-4 border-blue-400 border-t-transparent"></div>

        {/* Ortadaki sabit logo */}
        <div className="absolute animate-pulse">
          <Image
            src="/brand/logo-icon.svg"
            alt="Logo"
            width={32}
            height={32}
            className="h-8 w-8"
          />
        </div>
      </div>
    </div>
  );
}