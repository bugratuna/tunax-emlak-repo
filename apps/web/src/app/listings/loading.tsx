import { PageLoader } from "@/components/page-loader";

/**
 * Next.js App Router automatic loading boundary for /listings.
 * Shown while the server component is streaming in.
 */
export default function ListingsLoading() {
  return <PageLoader />;
}
