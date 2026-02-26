import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  InMemoryStore,
  MarketingAssetPack,
  MarketingAssetPackRequest,
} from '../store/store';

@Injectable()
export class MarketingService {
  constructor(private readonly store: InMemoryStore) {}

  getPackRequest(listingId: string): MarketingAssetPackRequest {
    const listing = this.store.getListing(listingId);
    if (!listing) {
      throw new NotFoundException(`Listing ${listingId} not found`);
    }
    if (listing.status !== 'PUBLISHED') {
      throw new ConflictException(
        `Marketing pack is only available for PUBLISHED listings (current: ${listing.status})`,
      );
    }
    const req = this.store.getPackRequest(listingId);
    if (!req) {
      // Lazy-create if approve was called before this module existed
      return this.store.createPackRequest(listingId, listing.title);
    }
    return req;
  }

  attachResult(
    listingId: string,
    pack: MarketingAssetPack,
  ): MarketingAssetPackRequest {
    if (!this.store.getListing(listingId)) {
      throw new NotFoundException(`Listing ${listingId} not found`);
    }
    if (!this.store.getPackRequest(listingId)) {
      throw new NotFoundException(
        `No pack request for listing ${listingId}. Approve the listing first.`,
      );
    }
    const packWithIds: MarketingAssetPack = {
      ...pack,
      packId: pack.packId ?? randomUUID(),
      listingId,
      generatedAt: pack.generatedAt ?? new Date().toISOString(),
    };
    return this.store.attachPackResult(listingId, packWithIds);
  }
}
