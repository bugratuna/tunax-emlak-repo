import { PageLoader } from "@/components/page-loader";

/**
 * Next.js App Router automatic loading boundary for /team.
 * Shown while the server component fetches team data.
 */
export default function TeamLoading() {
  return <PageLoader />;
}
