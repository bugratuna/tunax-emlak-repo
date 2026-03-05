"use client";

import dynamic from "next/dynamic";
import type { Listing } from "@/lib/types";

// `ssr: false` is only allowed inside a Client Component.
// This wrapper exists solely to own that constraint so that the parent
// Server Component (page.tsx) can import MapPanel without error.
const MapPanelInner = dynamic(() => import("./map-panel"), { ssr: false });

interface Props {
  listings: Pick<Listing, "id" | "title" | "price" | "location">[];
  currentParams: string;
}

export function MapPanel({ listings, currentParams }: Props) {
  return <MapPanelInner listings={listings} currentParams={currentParams} />;
}
