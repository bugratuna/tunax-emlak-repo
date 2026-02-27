import { apiFetch } from "./client";

export interface MarketingPack {
  requestId: string;
  listingId: string;
  listingTitle: string;
  status: "PENDING_OPERATOR" | "COMPLETED";
  hitlPrompt: string;
  result?: {
    packId: string;
    listingId: string;
    generatedAt: string;
    seoTitle: { tr: string; en: string };
    metaDescription: { tr: string; en: string };
    socialCaptions: string[];
    whatsappBroadcast: string;
    hashtags: string[];
  };
  createdAt: string;
  completedAt?: string;
}

export async function getMarketingPack(
  listingId: string,
): Promise<MarketingPack> {
  return apiFetch<MarketingPack>(`/api/marketing/${listingId}/pack`);
}
