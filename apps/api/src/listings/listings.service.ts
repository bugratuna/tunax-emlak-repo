import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import { InMemoryStore, Listing } from '../store/store';
import { AUTOMATION_QUEUE } from './automation-queue.provider';
import { CreateListingDto } from './dto/create-listing.dto';

@Injectable()
export class ListingsService {
  constructor(
    private readonly store: InMemoryStore,
    @Inject(AUTOMATION_QUEUE) private readonly automationQueue: Queue,
  ) {}

  async create(dto: CreateListingDto): Promise<Listing> {
    const listing = this.store.createListing(dto);
    await this.automationQueue.add('LISTING_SUBMITTED', {
      listingId: listing.id,
      consultantId: listing.consultantId,
      title: listing.title,
      description: listing.description,
      price: listing.price,
      propertyType: listing.propertyType,
      category: listing.category,
      location: listing.location,
      specifications: listing.specifications,
      imageCount: listing.imageCount,
      status: listing.status,
      submittedAt: listing.submittedAt,
      isResubmission: false,
      previousState: 'DRAFT' as const,
      previousModerationReportId: null,
    });
    return listing;
  }

  findById(id: string): Listing {
    const listing = this.store.getListing(id);
    if (!listing) {
      throw new NotFoundException(`Listing ${id} not found`);
    }
    return listing;
  }

  async resubmit(id: string): Promise<Listing> {
    const listing = this.store.getListing(id);
    if (!listing) {
      throw new NotFoundException(`Listing ${id} not found`);
    }
    if (listing.status !== 'NEEDS_CHANGES') {
      throw new ConflictException(
        `Listing can only be resubmitted from NEEDS_CHANGES status (current: ${listing.status})`,
      );
    }
    const previousReport = this.store.getReport(id);
    const updated = this.store.resubmitListing(id);
    await this.automationQueue.add('LISTING_SUBMITTED', {
      listingId: updated.id,
      consultantId: updated.consultantId,
      title: updated.title,
      description: updated.description,
      price: updated.price,
      propertyType: updated.propertyType,
      category: updated.category,
      location: updated.location,
      specifications: updated.specifications,
      imageCount: updated.imageCount,
      status: updated.status,
      submittedAt: updated.submittedAt,
      isResubmission: true,
      previousState: 'NEEDS_CHANGES' as const,
      previousModerationReportId: previousReport?.reportId ?? null,
    });
    return updated;
  }
}
