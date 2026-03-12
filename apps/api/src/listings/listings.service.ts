import { randomUUID } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { DataSource, In, IsNull, Not, Repository } from 'typeorm';
import {
  ListingEntity,
  ListingStatus,
} from '../database/entities/listing.entity';
import { ListingFeatureEntity } from '../database/entities/listing-feature.entity';
import { ListingLocationEntity } from '../database/entities/listing-location.entity';
import { ListingMediaEntity } from '../database/entities/listing-media.entity';
import { UserEntity } from '../database/entities/user.entity';
import { S3Service } from '../media/s3.service';
import { WatermarkService } from '../media/watermark.service';
import { InMemoryStore } from '../store/store';
import type { Listing } from '../store/store';
import { AUTOMATION_QUEUE } from './automation-queue.provider';
import { CommitMediaDto } from './dto/commit-media.dto';
import { CreateListingDto } from './dto/create-listing.dto';
import { ListListingsDto } from './dto/list-listings.dto';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { UpdatePhotoOrderDto } from './dto/update-photo-order.dto';
import { FEATURE_GROUP_NAMES } from './taxonomy/constants';
import {
  validateConditionalFilters,
  validateFeatureValues,
} from './taxonomy/taxonomy.validator';
import { Role } from 'src/common/enums/role.enum';

// ── Multer file shape (avoids @types/multer peer dep) ─────────────────────────

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

// ── Media item shape returned in API responses ────────────────────────────────

export interface MediaItem {
  id: string;
  url: string;
  s3Key: string;
  publicUrl: string;
  /**
   * URL of the watermarked public-delivery variant.
   * Absent for legacy images or when watermark generation failed.
   * Frontend should use `watermarkedUrl ?? url` for public-facing pages.
   */
  watermarkedUrl?: string;
  contentType?: string;
  width?: number;
  height?: number;
  sortOrder: number;
  isCover: boolean;
  uploadedAt: string;
}

// ── Watermarked S3 key helper ─────────────────────────────────────────────────

/**
 * Derives the watermarked-variant key from an original S3 key.
 * Always produces a `.jpg` output since watermarked variants are encoded as JPEG.
 *
 * Example:
 *   "listings/abc/uuid.png"  →  "listings/abc/uuid_wm.jpg"
 *   "listings/abc/uuid.jpg"  →  "listings/abc/uuid_wm.jpg"
 */
function buildWatermarkedKey(originalKey: string): string {
  const lastDot = originalKey.lastIndexOf('.');
  const base = lastDot === -1 ? originalKey : originalKey.slice(0, lastDot);
  return `${base}_wm.jpg`;
}

// ── Entity → Listing DTO mapper ───────────────────────────────────────────────

function toListingDto(
  entity: ListingEntity,
  location?: ListingLocationEntity | null,
  features: ListingFeatureEntity[] = [],
  media: MediaItem[] = [],
  consultantName?: string | null,
): Listing {
  const detailInfos: Record<string, string[]> = {};
  for (const f of features) {
    if (!detailInfos[f.featureGroup]) detailInfos[f.featureGroup] = [];
    detailInfos[f.featureGroup].push(f.featureValue);
  }

  return {
    id: entity.id,
    listingNumber: entity.listingNumber ?? undefined,
    title: entity.title,
    consultantId: entity.consultantId,
    consultantName: consultantName ?? undefined,
    status: entity.status,
    submittedAt:
      entity.submittedAt?.toISOString() ?? entity.createdAt.toISOString(),
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
    description: entity.description ?? undefined,
    propertyType: entity.propertyType,
    category: entity.category,
    subtype: entity.subtype ?? undefined,
    listingType: entity.listingType ?? undefined,
    price:
      entity.priceAmount != null
        ? {
            amount: Number(entity.priceAmount),
            currency: entity.priceCurrency,
            isNegotiable: entity.priceIsNegotiable,
          }
        : null,
    location: location
      ? {
          city: location.city ?? undefined,
          district: location.district ?? undefined,
          neighborhood: location.neighborhood ?? undefined,
          street: location.street ?? undefined,
          addressDetails: location.addressDetails ?? undefined,
          coordinates:
            location.lat != null && location.lng != null
              ? { latitude: location.lat, longitude: location.lng }
              : null,
        }
      : null,
    specifications: {
      roomCount: entity.roomCount ?? undefined,
      bathroomCount: entity.bathroomCount ?? undefined,
      floorNumber: entity.floorNumber ?? undefined,
      totalFloors: entity.totalFloors ?? undefined,
      grossArea: entity.m2Gross != null ? Number(entity.m2Gross) : undefined,
      netArea: entity.m2Net != null ? Number(entity.m2Net) : undefined,
      buildingAge: entity.buildingAge ?? undefined,
      hasParking: entity.carPark ?? undefined,
      hasBalcony: entity.hasBalcony ?? undefined,
      heatingType: entity.heatingType ?? undefined,
      kitchenState: entity.kitchenState ?? undefined,
      isFurnished: entity.isFurnished ?? undefined,
      hasElevator: entity.hasElevator ?? undefined,
      inComplex: entity.inComplex ?? undefined,
      isLoanEligible: entity.isLoanEligible ?? undefined,
      isSwapAvailable: entity.isSwapAvailable ?? undefined,
      duesAmount:
        entity.duesAmount != null ? Number(entity.duesAmount) : undefined,
    },
    detailInfos: Object.keys(detailInfos).length > 0 ? detailInfos : undefined,
    imageCount: entity.imageCount,
    isFeatured: entity.isFeatured,
    featuredSortOrder: entity.featuredSortOrder,
    isShowcase: entity.isShowcase,
    showcaseOrder: entity.showcaseOrder,
    isSold: entity.isSold,
    soldAt: entity.soldAt?.toISOString() ?? null,
    media: media.length > 0 ? media : undefined,
  } as Listing;
}

// ── Public types ──────────────────────────────────────────────────────────────

export interface ListAllResult {
  data: Listing[];
  total: number;
  page: number;
  limit: number;
}

export interface PresignResult {
  uploadUrl: string;
  publicUrl: string;
  s3Key: string;
  expiresIn: number;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class ListingsService {
  private readonly logger = new Logger(ListingsService.name);

  constructor(
    @InjectRepository(ListingEntity)
    private readonly listingRepo: Repository<ListingEntity>,
    @InjectRepository(ListingLocationEntity)
    private readonly locationRepo: Repository<ListingLocationEntity>,
    @InjectRepository(ListingFeatureEntity)
    private readonly featureRepo: Repository<ListingFeatureEntity>,
    @InjectRepository(ListingMediaEntity)
    private readonly mediaRepo: Repository<ListingMediaEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Inject(AUTOMATION_QUEUE)
    private readonly automationQueue: Queue,
    private readonly s3Service: S3Service,
    private readonly watermarkService: WatermarkService,
    private readonly store: InMemoryStore,
  ) {}

  // ── CREATE ────────────────────────────────────────────────────────────────

  async create(dto: CreateListingDto): Promise<Listing> {
    const entity = this.listingRepo.create({
      title: dto.title,
      consultantId: dto.consultantId ?? 'anonymous',
      status: 'PENDING_REVIEW',
      submittedAt: new Date(),
      category: (dto.category as ListingEntity['category']) ?? null,
      propertyType: dto.propertyType ?? null,
      subtype: dto.subtype ?? null,
      listingType: null,
      description: dto.description ?? null,
      priceAmount: dto.price?.amount ?? null,
      priceCurrency: dto.price?.currency ?? 'TRY',
      priceIsNegotiable: dto.price?.isNegotiable ?? false,
      m2Gross: dto.specifications?.grossArea ?? null,
      m2Net: dto.specifications?.netArea ?? null,
      roomCount: dto.specifications?.roomCount ?? null,
      bathroomCount: dto.specifications?.bathroomCount ?? null,
      floorNumber: dto.specifications?.floorNumber ?? null,
      totalFloors: dto.specifications?.totalFloors ?? null,
      buildingAge: dto.specifications?.buildingAge ?? null,
      heatingType: dto.specifications?.heatingType ?? null,
      kitchenState: dto.specifications?.kitchenState ?? null,
      carPark: dto.specifications?.hasParking ?? null,
      isFurnished: dto.specifications?.isFurnished ?? null,
      hasBalcony: dto.specifications?.hasBalcony ?? null,
      hasElevator: dto.specifications?.hasElevator ?? null,
      inComplex: dto.specifications?.inComplex ?? null,
      isLoanEligible: dto.specifications?.isLoanEligible ?? null,
      isSwapAvailable: dto.specifications?.isSwapAvailable ?? null,
      duesAmount: dto.specifications?.duesAmount ?? null,
      imageCount: dto.imageCount ?? 0,
    });

    const saved = await this.listingRepo.save(entity);

    let locationEntity: ListingLocationEntity | null = null;
    if (dto.location) {
      locationEntity = this.locationRepo.create({
        listingId: saved.id,
        city: dto.location.city ?? null,
        district: dto.location.district ?? null,
        neighborhood: dto.location.neighborhood ?? null,
        lat: dto.location.coordinates?.latitude ?? null,
        lng: dto.location.coordinates?.longitude ?? null,
      });
      await this.locationRepo.save(locationEntity);
    }

    let featureEntities: ListingFeatureEntity[] = [];
    if (dto.detailInfos) {
      const rows: Partial<ListingFeatureEntity>[] = [];
      for (const group of FEATURE_GROUP_NAMES) {
        const vals = (dto.detailInfos as Record<string, string[] | undefined>)[
          group
        ];
        if (vals) {
          for (const val of vals) {
            rows.push({
              listingId: saved.id,
              featureGroup: group,
              featureValue: val,
            });
          }
        }
      }
      if (rows.length > 0) {
        featureEntities = await this.featureRepo.save(
          rows as ListingFeatureEntity[],
        );
      }
    }

    const listing = toListingDto(saved, locationEntity, featureEntities);

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

  // ── LIST ALL ──────────────────────────────────────────────────────────────

  async listAll(filters: ListListingsDto = {}): Promise<ListAllResult> {
    validateConditionalFilters(filters as Record<string, unknown>);
    validateFeatureValues(filters as Record<string, unknown>);

    let bboxParams: [number, number, number, number] | null = null;
    if (filters.bbox) {
      const parts = filters.bbox.split(',').map(Number);
      if (parts.length !== 4 || parts.some((n) => !isFinite(n))) {
        throw new BadRequestException(
          'bbox must be four comma-separated finite numbers: "minLng,minLat,maxLng,maxLat"',
        );
      }
      const [minLng, minLat, maxLng, maxLat] = parts;
      if (minLng >= maxLng || minLat >= maxLat) {
        throw new BadRequestException(
          'bbox: minLng must be < maxLng and minLat must be < maxLat',
        );
      }
      if (minLng < -180 || maxLng > 180 || minLat < -90 || maxLat > 90) {
        throw new BadRequestException('bbox: coordinates out of WGS84 range');
      }
      bboxParams = [minLng, minLat, maxLng, maxLat];
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    const qb = this.listingRepo
      .createQueryBuilder('l')
      .leftJoinAndSelect('l.location', 'll');

    if (filters.isFeatured === true) {
      qb.andWhere('l.isFeatured = TRUE');
    }

    if (filters.isShowcase === true) {
      qb.andWhere('l.isShowcase = TRUE');
    }

    if (filters.search) {
      const trimmed = filters.search.trim();
      // Exact listing-number lookup takes priority (RT-000000 pattern)
      if (/^RT-\d{1,6}$/i.test(trimmed)) {
        qb.andWhere('l.listingNumber = :searchExact', {
          searchExact: trimmed.toUpperCase(),
        });
      } else {
        // Full-text: title OR listing_number prefix OR district OR neighborhood
        qb.andWhere(
          '(l.title ILIKE :search OR l.listingNumber ILIKE :search OR LOWER(ll.district) ILIKE :searchLower OR LOWER(ll.neighborhood) ILIKE :searchLower)',
          { search: `%${trimmed}%`, searchLower: `%${trimmed.toLowerCase()}%` },
        );
      }
    }

    if (filters.consultantId)
      qb.andWhere('l.consultantId = :consultantId', {
        consultantId: filters.consultantId,
      });
    if (filters.status)
      qb.andWhere('l.status = :status', { status: filters.status });
    if (filters.category)
      qb.andWhere('l.category = :category', { category: filters.category });
    if (filters.propertyType)
      qb.andWhere('l.propertyType = :propertyType', {
        propertyType: filters.propertyType,
      });
    if (filters.subtype)
      qb.andWhere('l.subtype = :subtype', { subtype: filters.subtype });

    if (filters.minPrice !== undefined)
      qb.andWhere('l.priceAmount >= :minPrice', { minPrice: filters.minPrice });
    if (filters.maxPrice !== undefined)
      qb.andWhere('l.priceAmount <= :maxPrice', { maxPrice: filters.maxPrice });
    if (filters.minM2Gross !== undefined)
      qb.andWhere('l.m2Gross >= :minM2Gross', {
        minM2Gross: filters.minM2Gross,
      });
    if (filters.maxM2Gross !== undefined)
      qb.andWhere('l.m2Gross <= :maxM2Gross', {
        maxM2Gross: filters.maxM2Gross,
      });
    if (filters.minM2Net !== undefined)
      qb.andWhere('l.m2Net >= :minM2Net', { minM2Net: filters.minM2Net });
    if (filters.maxM2Net !== undefined)
      qb.andWhere('l.m2Net <= :maxM2Net', { maxM2Net: filters.maxM2Net });

    if (filters.roomCount !== undefined)
      qb.andWhere('l.roomCount = :roomCount', { roomCount: filters.roomCount });
    if (filters.roomCounts) {
      const counts = filters.roomCounts
        .split(',')
        .map((s) =>
          s.trim().match(/^Stüdyo/i)
            ? 0
            : parseInt((s.trim().match(/^(\d+)/) ?? [])[1] ?? '-1', 10),
        )
        .filter((n) => Number.isInteger(n) && n >= 0);
      if (counts.length > 0)
        qb.andWhere('l.roomCount IN (:...roomCountsIn)', {
          roomCountsIn: counts,
        });
    }
    if (filters.bathroomCount !== undefined)
      qb.andWhere('l.bathroomCount = :bathroomCount', {
        bathroomCount: filters.bathroomCount,
      });
    if (filters.minBuildingAge !== undefined)
      qb.andWhere('l.buildingAge >= :minBuildingAge', {
        minBuildingAge: filters.minBuildingAge,
      });
    if (filters.maxBuildingAge !== undefined)
      qb.andWhere('l.buildingAge <= :maxBuildingAge', {
        maxBuildingAge: filters.maxBuildingAge,
      });
    if (filters.floorNumber !== undefined)
      qb.andWhere('l.floorNumber = :floorNumber', {
        floorNumber: filters.floorNumber,
      });
    if (filters.totalFloors !== undefined)
      qb.andWhere('l.totalFloors = :totalFloors', {
        totalFloors: filters.totalFloors,
      });
    if (filters.heatingType !== undefined)
      qb.andWhere('l.heatingType = :heatingType', {
        heatingType: filters.heatingType,
      });
    if (filters.kitchenState !== undefined)
      qb.andWhere('l.kitchenState = :kitchenState', {
        kitchenState: filters.kitchenState,
      });
    if (filters.carPark !== undefined)
      qb.andWhere('l.carPark = :carPark', { carPark: filters.carPark });
    if (filters.isFurnished !== undefined)
      qb.andWhere('l.isFurnished = :isFurnished', {
        isFurnished: filters.isFurnished,
      });
    if (filters.hasBalcony !== undefined)
      qb.andWhere('l.hasBalcony = :hasBalcony', {
        hasBalcony: filters.hasBalcony,
      });
    if (filters.hasElevator !== undefined)
      qb.andWhere('l.hasElevator = :hasElevator', {
        hasElevator: filters.hasElevator,
      });
    if (filters.inComplex !== undefined)
      qb.andWhere('l.inComplex = :inComplex', { inComplex: filters.inComplex });
    if (filters.isLoanEligible !== undefined)
      qb.andWhere('l.isLoanEligible = :isLoanEligible', {
        isLoanEligible: filters.isLoanEligible,
      });
    if (filters.isSwapAvailable !== undefined)
      qb.andWhere('l.isSwapAvailable = :isSwapAvailable', {
        isSwapAvailable: filters.isSwapAvailable,
      });
    if (filters.minDues !== undefined)
      qb.andWhere('l.duesAmount >= :minDues', { minDues: filters.minDues });
    if (filters.maxDues !== undefined)
      qb.andWhere('l.duesAmount <= :maxDues', { maxDues: filters.maxDues });

    if (filters.city)
      qb.andWhere('LOWER(ll.city) = LOWER(:city)', { city: filters.city });
    if (filters.district)
      qb.andWhere('LOWER(ll.district) = LOWER(:district)', {
        district: filters.district,
      });
    if (filters.neighborhood)
      qb.andWhere('LOWER(ll.neighborhood) = LOWER(:neighborhood)', {
        neighborhood: filters.neighborhood,
      });

    if (bboxParams) {
      const [minLng, minLat, maxLng, maxLat] = bboxParams;
      qb.andWhere(
        `ll.geom && ST_MakeEnvelope(:bboxMinLng, :bboxMinLat, :bboxMaxLng, :bboxMaxLat, 4326)`,
        {
          bboxMinLng: minLng,
          bboxMinLat: minLat,
          bboxMaxLng: maxLng,
          bboxMaxLat: maxLat,
        },
      );
    }

    for (const group of FEATURE_GROUP_NAMES) {
      const values = (filters as Record<string, unknown>)[group] as
        | string[]
        | undefined;
      if (values && values.length > 0) {
        qb.andWhere(
          `EXISTS (
            SELECT 1 FROM listing_features lf_${group}
            WHERE lf_${group}.listing_id = l.id
              AND lf_${group}.feature_group = :fg_${group}
              AND lf_${group}.feature_value IN (:...fv_${group})
          )`,
          { [`fg_${group}`]: group, [`fv_${group}`]: values },
        );
      }
    }

    const sortMap: Record<
      string,
      { col: string; dir: 'ASC' | 'DESC'; nulls?: string }
    > = {
      price_asc: { col: 'l.priceAmount', dir: 'ASC', nulls: 'NULLS LAST' },
      price_desc: { col: 'l.priceAmount', dir: 'DESC', nulls: 'NULLS LAST' },
      newest: { col: 'l.createdAt', dir: 'DESC' },
      oldest: { col: 'l.createdAt', dir: 'ASC' },
      featured: { col: 'l.featuredSortOrder', dir: 'ASC' },
      showcase: { col: 'l.showcaseOrder', dir: 'ASC' },
    };
    const sort = sortMap[filters.sortBy ?? 'newest'];
    qb.orderBy(
      sort.col,
      sort.dir,
      sort.nulls as 'NULLS FIRST' | 'NULLS LAST' | undefined,
    );

    const [entities, total] = await qb
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    // Load one cover photo per listing in a single query (avoids N+1)
    const listingIds = entities.map((e) => e.id);
    const coverMap = new Map<string, ListingMediaEntity>();
    if (listingIds.length > 0) {
      const allMedia = await this.mediaRepo.find({
        where: { listingId: In(listingIds) },
        order: { sortOrder: 'ASC' },
      });
      for (const m of allMedia) {
        const existing = coverMap.get(m.listingId);
        if (!existing) {
          coverMap.set(m.listingId, m);
        } else if (m.isCover && !existing.isCover) {
          coverMap.set(m.listingId, m);
        }
      }
    }

    // Batch-fetch consultant names to avoid N+1 lookups
    const consultantIds = [
      ...new Set(entities.map((e) => e.consultantId).filter(Boolean)),
    ];
    const nameMap = new Map<string, string>();
    if (consultantIds.length > 0) {
      const users = await this.userRepo.find({
        where: { id: In(consultantIds) },
      });
      for (const u of users) nameMap.set(u.id, u.name ?? u.email);
    }

    return {
      data: entities.map((e) => {
        const cover = coverMap.get(e.id);
        return toListingDto(
          e,
          e.location,
          [],
          cover ? [this.toMediaItem(cover)] : [],
          nameMap.get(e.consultantId) ?? null,
        );
      }),
      total,
      page,
      limit,
    };
  }

  // ── FIND BY ID ────────────────────────────────────────────────────────────

  async findById(id: string): Promise<Listing> {
    const entity = await this.listingRepo.findOne({
      where: { id },
      relations: { location: true },
    });
    if (!entity) throw new NotFoundException(`Listing ${id} not found`);

    const [features, mediaEntities] = await Promise.all([
      this.featureRepo.find({ where: { listingId: id } }),
      this.mediaRepo.find({
        where: { listingId: id },
        order: { sortOrder: 'ASC', uploadedAt: 'ASC' },
      }),
    ]);

    const media = mediaEntities.map((m) => this.toMediaItem(m));
    // Fetch consultant name for detail view
    let consultantName: string | null = null;
    if (entity.consultantId) {
      const user = await this.userRepo.findOneBy({ id: entity.consultantId });
      consultantName = user ? (user.name ?? user.email) : null;
    }
    return toListingDto(
      entity,
      entity.location,
      features,
      media,
      consultantName,
    );
  }

  async existsById(id: string): Promise<boolean> {
    return this.listingRepo.exists({ where: { id } });
  }

  // ── STATUS UPDATE ─────────────────────────────────────────────────────────

  async updateStatus(id: string, status: ListingStatus): Promise<Listing> {
    const entity = await this.listingRepo.findOne({
      where: { id },
      relations: { location: true },
    });
    if (!entity) throw new NotFoundException(`Listing ${id} not found`);
    entity.status = status;
    if (status === 'PUBLISHED') entity.publishedAt = new Date();
    const saved = await this.listingRepo.save(entity);
    return toListingDto(saved, saved.location);
  }

  // ── ASSIGN LISTING NUMBER (called on approval) ────────────────────────────

  /**
   * Atomically assigns an RT-XXXXXX number to a listing using a PostgreSQL
   * sequence. Idempotent: if the listing already has a number, returns it as-is.
   * Must be called AFTER status is set to PUBLISHED.
   */
  async assignListingNumber(listingId: string): Promise<string | null> {
    // Idempotent guard
    const existing = await this.listingRepo.findOneBy({ id: listingId });
    if (existing?.listingNumber) return existing.listingNumber;

    const result = await this.dataSource.query<
      Array<{ listing_number: string | null }>
    >(
      `UPDATE listings
         SET listing_number = 'RT-' || LPAD(nextval('listing_number_seq')::text, 6, '0')
       WHERE id = $1 AND listing_number IS NULL
       RETURNING listing_number`,
      [listingId],
    );
    return result[0]?.listing_number ?? null;
  }

  // ── PENDING QUEUE ─────────────────────────────────────────────────────────

  async getPendingQueue(): Promise<{ items: Listing[]; count: number }> {
    const [entities, count] = await this.listingRepo.findAndCount({
      where: { status: 'PENDING_REVIEW' },
      relations: { location: true },
      order: { submittedAt: 'ASC' },
    });
    return { items: entities.map((e) => toListingDto(e, e.location)), count };
  }

  // ── RESUBMIT ──────────────────────────────────────────────────────────────

  async resubmit(id: string): Promise<Listing> {
    const entity = await this.listingRepo.findOne({
      where: { id },
      relations: { location: true },
    });
    if (!entity) throw new NotFoundException(`Listing ${id} not found`);
    if (entity.status !== 'NEEDS_CHANGES' && entity.status !== 'UNPUBLISHED') {
      throw new ConflictException(
        `Listing can only be resubmitted from NEEDS_CHANGES or UNPUBLISHED status (current: ${entity.status})`,
      );
    }
    entity.status = 'PENDING_REVIEW';
    entity.submittedAt = new Date();
    const saved = await this.listingRepo.save(entity);
    const listing = toListingDto(saved, saved.location);

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
      isResubmission: true,
      previousState: 'NEEDS_CHANGES' as const,
      previousModerationReportId: null,
    });

    return listing;
  }

  // ── ADMIN FEEDBACK (consultant-accessible) ────────────────────────────────

  /**
   * Returns admin feedback for a NEEDS_CHANGES listing.
   * Only the listing owner (consultant) can call this.
   */
  async getAdminFeedback(
    id: string,
    consultantId: string,
  ): Promise<{ feedback: string | null }> {
    const entity = await this.listingRepo.findOneBy({ id });
    if (!entity) throw new NotFoundException(`Listing ${id} not found`);
    if (entity.consultantId !== consultantId)
      throw new ForbiddenException('You do not own this listing');
    const report = this.store.getReport(id);
    return { feedback: report?.feedback ?? null };
  }

  // ── MEDIA — PRESIGN ───────────────────────────────────────────────────────

  /**
   * Generates an S3 presigned PUT URL for direct client upload.
   * @param consultantId JWT sub — must match listing.consultantId
   */
  async presignUpload(
    dto: PresignUploadDto,
    consultantId: string,
  ): Promise<PresignResult> {
    const listing = await this.listingRepo.findOneBy({ id: dto.listingId });
    if (!listing)
      throw new NotFoundException(`Listing ${dto.listingId} not found`);
    if (listing.consultantId !== consultantId) {
      throw new ForbiddenException('You do not own this listing');
    }

    const ext = (dto.fileName.split('.').pop() ?? 'bin')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    const key = `listings/${dto.listingId}/${randomUUID()}.${ext}`;
    const uploadUrl = await this.s3Service.generatePresignedPutUrl(
      key,
      dto.contentType,
    );
    const publicUrl = this.s3Service.buildPublicUrl(key);

    return {
      uploadUrl,
      publicUrl,
      s3Key: key,
      expiresIn: this.s3Service.presignExpiresIn,
    };
  }

  // ── MEDIA — COMMIT ────────────────────────────────────────────────────────

  /**
   * Registers uploaded media metadata after the client PUT to S3 completes.
   * @param listingId from URL param
   * @param dto       s3Key + publicUrl + optional dimensions/order
   * @param consultantId JWT sub — must match listing.consultantId
   */
  async commitMedia(
    listingId: string,
    dto: CommitMediaDto,
    consultantId: string,
  ): Promise<MediaItem[]> {
    const listing = await this.listingRepo.findOneBy({ id: listingId });
    if (!listing) throw new NotFoundException(`Listing ${listingId} not found`);
    if (listing.consultantId !== consultantId) {
      throw new ForbiddenException('You do not own this listing');
    }

    // Guard: s3Key must belong to this listing's prefix
    if (!dto.s3Key.startsWith(`listings/${listingId}/`)) {
      throw new BadRequestException(
        `s3Key must start with "listings/${listingId}/" — use POST /api/media/presign to obtain a valid key`,
      );
    }

    const media = this.mediaRepo.create({
      listingId,
      s3Key: dto.s3Key,
      s3Bucket: process.env.AWS_BUCKET_NAME ?? '',
      publicUrl: dto.publicUrl,
      contentType: null,
      sizeBytes: null,
      sortOrder: dto.order ?? 0,
      isCover: false,
      width: dto.width ?? null,
      height: dto.height ?? null,
      watermarkedS3Key: null,
      watermarkedUrl: null,
    });
    await this.mediaRepo.save(media);

    await this.listingRepo.increment({ id: listingId }, 'imageCount', 1);

    // ── Watermark: download original, composite logo, upload variant ─────────
    // Done after the row is saved so the commit endpoint always returns quickly
    // even if watermarking takes extra time. A NULL watermarkedUrl is safe —
    // the frontend falls back to publicUrl.
    try {
      const originalBuffer = await this.s3Service.getObjectAsBuffer(dto.s3Key);
      const wmBuffer =
        await this.watermarkService.applyWatermark(originalBuffer);
      const wmKey = buildWatermarkedKey(dto.s3Key);
      const wmUrl = await this.s3Service.putObject(
        wmKey,
        wmBuffer,
        'image/jpeg',
      );
      media.watermarkedS3Key = wmKey;
      media.watermarkedUrl = wmUrl;
      await this.mediaRepo.save(media);
    } catch (err) {
      this.logger.warn(
        `[commitMedia] Watermark generation failed for ${dto.s3Key} — ` +
          'public pages will fall back to original:',
        err,
      );
    }

    const all = await this.mediaRepo.find({
      where: { listingId },
      order: { sortOrder: 'ASC', uploadedAt: 'ASC' },
    });
    return all.map((m) => this.toMediaItem(m));
  }

  // ── MEDIA — DELETE ────────────────────────────────────────────────────────

  async deleteMedia(
    listingId: string,
    mediaId: string,
    consultantId: string,
  ): Promise<{ deleted: true }> {
    const listing = await this.listingRepo.findOneBy({ id: listingId });
    if (!listing) throw new NotFoundException(`Listing ${listingId} not found`);
    if (listing.consultantId !== consultantId) {
      throw new ForbiddenException('You do not own this listing');
    }

    const media = await this.mediaRepo.findOne({
      where: { id: mediaId, listingId },
    });
    if (!media)
      throw new NotFoundException(
        `Media ${mediaId} not found for listing ${listingId}`,
      );

    await this.s3Service.deleteObject(media.s3Key);

    // Also delete the watermarked variant if one was generated.
    // Failures are non-fatal — the row is removed from DB regardless.
    if (media.watermarkedS3Key) {
      try {
        await this.s3Service.deleteObject(media.watermarkedS3Key);
      } catch (err) {
        this.logger.warn(
          `[deleteMedia] Could not delete watermarked variant ${media.watermarkedS3Key}:`,
          err,
        );
      }
    }

    await this.mediaRepo.delete(mediaId);
    await this.dataSource.query(
      `UPDATE listings SET image_count = GREATEST(image_count - 1, 0) WHERE id = $1`,
      [listingId],
    );

    return { deleted: true };
  }

  // ── MEDIA — UPLOAD (multipart) ────────────────────────────────────────────

  /**
   * Accepts multer-parsed file buffers, uploads each to S3, and persists
   * a listing_media row. Returns the full ordered media list.
   */
  async uploadPhotos(
    listingId: string,
    files: UploadedFile[],
    consultantId: string,
  ): Promise<MediaItem[]> {
    const listing = await this.listingRepo.findOneBy({ id: listingId });
    if (!listing) throw new NotFoundException(`Listing ${listingId} not found`);
    if (listing.consultantId !== consultantId) {
      throw new ForbiddenException('You do not own this listing');
    }

    const currentCount = await this.mediaRepo.count({ where: { listingId } });
    if (currentCount + files.length > 20) {
      throw new BadRequestException(
        `Photo limit exceeded. Current: ${currentCount}, uploading: ${files.length}, max: 20`,
      );
    }

    const savedMedia: ListingMediaEntity[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = (file.originalname.split('.').pop() ?? 'bin')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      const key = `listings/${listingId}/${randomUUID()}.${ext}`;
      const publicUrl = await this.s3Service.putObject(
        key,
        file.buffer,
        file.mimetype,
      );

      // ── Watermark: generate branded derivative alongside the original ─────
      let watermarkedS3Key: string | null = null;
      let watermarkedUrl: string | null = null;
      try {
        const wmBuffer = await this.watermarkService.applyWatermark(
          file.buffer,
        );
        const wmKey = buildWatermarkedKey(key);
        watermarkedUrl = await this.s3Service.putObject(
          wmKey,
          wmBuffer,
          'image/jpeg',
        );
        watermarkedS3Key = wmKey;
      } catch (err) {
        this.logger.warn(
          `[uploadPhotos] Watermark failed for ${key} — falling back to original:`,
          err,
        );
      }

      const media = this.mediaRepo.create({
        listingId,
        s3Key: key,
        s3Bucket: process.env.AWS_BUCKET_NAME ?? '',
        publicUrl,
        contentType: file.mimetype,
        sizeBytes: file.size,
        sortOrder: currentCount + i,
        isCover: currentCount === 0 && i === 0,
        watermarkedS3Key,
        watermarkedUrl,
      });
      savedMedia.push(await this.mediaRepo.save(media));
    }

    await this.listingRepo.increment(
      { id: listingId },
      'imageCount',
      files.length,
    );

    const all = await this.mediaRepo.find({
      where: { listingId },
      order: { sortOrder: 'ASC', uploadedAt: 'ASC' },
    });
    return all.map((m) => this.toMediaItem(m));
  }

  // ── MEDIA — REORDER ───────────────────────────────────────────────────────

  async reorderPhotos(
    listingId: string,
    dto: UpdatePhotoOrderDto,
    consultantId: string,
  ): Promise<MediaItem[]> {
    const listing = await this.listingRepo.findOneBy({ id: listingId });
    if (!listing) throw new NotFoundException(`Listing ${listingId} not found`);
    if (listing.consultantId !== consultantId) {
      throw new ForbiddenException('You do not own this listing');
    }

    // Update sortOrder for each ID according to its position in the array
    await Promise.all(
      dto.order.map((photoId, idx) =>
        this.mediaRepo.update(
          { id: photoId, listingId },
          { sortOrder: idx, isCover: idx === 0 },
        ),
      ),
    );

    const all = await this.mediaRepo.find({
      where: { listingId },
      order: { sortOrder: 'ASC', uploadedAt: 'ASC' },
    });
    return all.map((m) => this.toMediaItem(m));
  }

  // ── LOCATION UPDATE ───────────────────────────────────────────────────────

  async updateLocation(
    listingId: string,
    dto: UpdateLocationDto,
    consultantId: string,
  ): Promise<Listing> {
    const listing = await this.listingRepo.findOne({
      where: { id: listingId },
      relations: { location: true },
    });
    if (!listing) throw new NotFoundException(`Listing ${listingId} not found`);
    if (listing.consultantId !== consultantId) {
      throw new ForbiddenException('You do not own this listing');
    }

    if (listing.location) {
      listing.location.lat = dto.lat;
      listing.location.lng = dto.lng;
      if (dto.city !== undefined) listing.location.city = dto.city;
      if (dto.district !== undefined) listing.location.district = dto.district;
      if (dto.neighborhood !== undefined)
        listing.location.neighborhood = dto.neighborhood;
      if (dto.street !== undefined) listing.location.street = dto.street;
      if (dto.addressDetails !== undefined)
        listing.location.addressDetails = dto.addressDetails;
      await this.locationRepo.save(listing.location);
    } else {
      const loc = this.locationRepo.create({
        listingId,
        lat: dto.lat,
        lng: dto.lng,
        city: dto.city ?? null,
        district: dto.district ?? null,
        neighborhood: dto.neighborhood ?? null,
        street: dto.street ?? null,
        addressDetails: dto.addressDetails ?? null,
      });
      await this.locationRepo.save(loc);
    }

    return this.findById(listingId);
  }

  // ── REVERSE GEOCODING PROXY ───────────────────────────────────────────────

  /**
   * Proxies a Nominatim reverse-geocode request server-side.
   * Returns the raw Nominatim JSON so the caller can apply their own
   * normalization logic. All Nominatim usage-policy headers are set here;
   * the browser never contacts Nominatim directly.
   */
  async reverseGeocodeProxy(lat: number, lng: number): Promise<unknown> {
    const url =
      `https://nominatim.openstreetmap.org/reverse` +
      `?lat=${lat}&lon=${lng}&format=json&accept-language=tr&zoom=18&addressdetails=1`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'RealtyTunax/1.0 (realtytunax.com)',
      },
    });

    if (!res.ok) {
      throw new BadRequestException(`Geocoder returned HTTP ${res.status}`);
    }

    return res.json();
  }

  // ── UPDATE LISTING (NEEDS_CHANGES or DRAFT) ─────────────────────────────

  async updateListing(
    id: string,
    dto: UpdateListingDto,
    consultantId: string,
  ): Promise<Listing> {
    const entity = await this.listingRepo.findOne({
      where: { id },
      relations: { location: true },
    });
    if (!entity) throw new NotFoundException(`Listing ${id} not found`);
    if (entity.consultantId !== consultantId) {
      throw new ForbiddenException('You do not own this listing');
    }
    if (entity.status !== 'NEEDS_CHANGES' && entity.status !== 'DRAFT') {
      throw new ConflictException(
        `Listing can only be edited when status is NEEDS_CHANGES or DRAFT (current: ${entity.status})`,
      );
    }

    // Apply only the supplied fields
    if (dto.title !== undefined) entity.title = dto.title;
    if (dto.description !== undefined)
      entity.description = dto.description ?? null;
    if (dto.category !== undefined)
      entity.category = (dto.category as ListingEntity['category']) ?? null;
    if (dto.propertyType !== undefined)
      entity.propertyType = dto.propertyType ?? null;
    if (dto.subtype !== undefined) entity.subtype = dto.subtype ?? null;
    if (dto.price !== undefined) {
      entity.priceAmount = dto.price?.amount ?? null;
      entity.priceCurrency = dto.price?.currency ?? 'TRY';
      entity.priceIsNegotiable = dto.price?.isNegotiable ?? false;
    }
    if (dto.specifications !== undefined) {
      const s = dto.specifications;
      if (s?.grossArea !== undefined) entity.m2Gross = s.grossArea ?? null;
      if (s?.netArea !== undefined) entity.m2Net = s.netArea ?? null;
      if (s?.roomCount !== undefined) entity.roomCount = s.roomCount ?? null;
      if (s?.bathroomCount !== undefined)
        entity.bathroomCount = s.bathroomCount ?? null;
      if (s?.floorNumber !== undefined)
        entity.floorNumber = s.floorNumber ?? null;
      if (s?.totalFloors !== undefined)
        entity.totalFloors = s.totalFloors ?? null;
      if (s?.buildingAge !== undefined)
        entity.buildingAge = s.buildingAge ?? null;
      if (s?.heatingType !== undefined)
        entity.heatingType = s.heatingType ?? null;
      if (s?.kitchenState !== undefined)
        entity.kitchenState = s.kitchenState ?? null;
      if (s?.hasParking !== undefined) entity.carPark = s.hasParking ?? null;
      if (s?.isFurnished !== undefined)
        entity.isFurnished = s.isFurnished ?? null;
      if (s?.hasBalcony !== undefined) entity.hasBalcony = s.hasBalcony ?? null;
      if (s?.hasElevator !== undefined)
        entity.hasElevator = s.hasElevator ?? null;
      if (s?.inComplex !== undefined) entity.inComplex = s.inComplex ?? null;
      if (s?.isLoanEligible !== undefined)
        entity.isLoanEligible = s.isLoanEligible ?? null;
      if (s?.isSwapAvailable !== undefined)
        entity.isSwapAvailable = s.isSwapAvailable ?? null;
      if (s?.duesAmount !== undefined) entity.duesAmount = s.duesAmount ?? null;
    }

    const saved = await this.listingRepo.save(entity);

    // Update location if provided
    if (dto.location !== undefined && dto.location !== null) {
      if (entity.location) {
        entity.location.city = dto.location.city ?? entity.location.city;
        entity.location.district =
          dto.location.district ?? entity.location.district;
        entity.location.neighborhood =
          dto.location.neighborhood ?? entity.location.neighborhood;
        if (dto.location.coordinates) {
          entity.location.lat = dto.location.coordinates.latitude;
          entity.location.lng = dto.location.coordinates.longitude;
        }
        await this.locationRepo.save(entity.location);
      } else {
        await this.locationRepo.save(
          this.locationRepo.create({
            listingId: id,
            city: dto.location.city ?? null,
            district: dto.location.district ?? null,
            neighborhood: dto.location.neighborhood ?? null,
            lat: dto.location.coordinates?.latitude ?? null,
            lng: dto.location.coordinates?.longitude ?? null,
          }),
        );
      }
    }

    // Replace feature groups if provided
    if (dto.detailInfos !== undefined && dto.detailInfos !== null) {
      await this.featureRepo.delete({ listingId: id });
      const rows: Partial<ListingFeatureEntity>[] = [];
      for (const group of FEATURE_GROUP_NAMES) {
        const vals = (dto.detailInfos as Record<string, string[] | undefined>)[
          group
        ];
        if (vals) {
          for (const val of vals) {
            rows.push({
              listingId: id,
              featureGroup: group,
              featureValue: val,
            });
          }
        }
      }
      if (rows.length > 0) {
        await this.featureRepo.save(rows as ListingFeatureEntity[]);
      }
    }

    return this.findById(saved.id);
  }

  // ── SET FEATURED (admin) ──────────────────────────────────────────────────

  async setFeatured(
    id: string,
    isFeatured: boolean,
    sortOrder?: number,
  ): Promise<Listing> {
    const entity = await this.listingRepo.findOne({
      where: { id },
      relations: { location: true },
    });
    if (!entity) throw new NotFoundException(`Listing ${id} not found`);
    if (entity.status !== 'PUBLISHED') {
      throw new UnprocessableEntityException(
        `Only PUBLISHED listings can be featured (current: ${entity.status})`,
      );
    }
    entity.isFeatured = isFeatured;
    if (sortOrder !== undefined) entity.featuredSortOrder = sortOrder;
    const saved = await this.listingRepo.save(entity);
    return toListingDto(saved, saved.location);
  }

  // ── SET SHOWCASE (admin) ──────────────────────────────────────────────────

  async setShowcase(
    id: string,
    isShowcase: boolean,
    sortOrder?: number,
  ): Promise<Listing> {
    const entity = await this.listingRepo.findOne({
      where: { id },
      relations: { location: true },
    });
    if (!entity) throw new NotFoundException(`Listing ${id} not found`);
    if (entity.status !== 'PUBLISHED') {
      throw new UnprocessableEntityException(
        `Yalnızca yayındaki ilanlar Vitrin'e eklenebilir (mevcut durum: ${entity.status})`,
      );
    }
    entity.isShowcase = isShowcase;
    if (sortOrder !== undefined) entity.showcaseOrder = sortOrder;
    const saved = await this.listingRepo.save(entity);
    return toListingDto(saved, saved.location);
  }

  // ── UNPUBLISH (consultant own + admin any) ───────────────────────────────

  async unpublishListing(
    id: string,
    actorId: string,
    actorRole: 'CONSULTANT' | 'ADMIN',
  ): Promise<Listing> {
    const entity = await this.listingRepo.findOne({
      where: { id },
      relations: { location: true },
    });
    if (!entity) throw new NotFoundException(`Listing ${id} not found`);
    if (actorRole === 'CONSULTANT' && entity.consultantId !== actorId) {
      throw new ForbiddenException('You do not own this listing');
    }
    if (entity.status !== 'PUBLISHED') {
      throw new UnprocessableEntityException(
        `Only PUBLISHED listings can be unpublished (current: ${entity.status})`,
      );
    }
    entity.status = 'UNPUBLISHED';
    entity.isFeatured = false;
    entity.isShowcase = false;
    const saved = await this.listingRepo.save(entity);
    return toListingDto(saved, saved.location);
  }

  // ── CONTACT INFO (public) ─────────────────────────────────────────────────

  async getContactInfo(listingId: string): Promise<{
    consultantName: string;
    phone: string | null;
    profilePhotoUrl: string | null;
  }> {
    const listing = await this.listingRepo.findOneBy({ id: listingId });
    if (!listing) throw new NotFoundException(`Listing ${listingId} not found`);
    if (listing.status !== 'PUBLISHED') {
      throw new NotFoundException(`Listing ${listingId} not found`);
    }

    const user = await this.userRepo.findOneBy({ id: listing.consultantId });
    if (!user)
      return {
        consultantName: 'Realty Tunax Danışmanı',
        phone: null,
        profilePhotoUrl: null,
      };

    if (user.status === 'SUSPENDED') {
      throw new NotFoundException('Bu danışman şu anda aktif değil.');
    }

    const fullName =
      user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : (user.name ?? 'Realty Tunax Danışmanı');

    return {
      consultantName: fullName,
      phone: user.phoneNumber ?? null,
      profilePhotoUrl: user.profilePhotoUrl ?? null,
    };
  }

  // ── UPSERT FROM STORE (migration helper) ─────────────────────────────────

  async upsertFromStore(listing: Listing): Promise<void> {
    await this.dataSource.transaction(async (em) => {
      await em
        .createQueryBuilder()
        .insert()
        .into(ListingEntity)
        .values({
          id: listing.id,
          title: listing.title,
          consultantId: listing.consultantId,
          status: listing.status as ListingStatus,
          submittedAt: listing.submittedAt
            ? new Date(listing.submittedAt)
            : null,
          category: (listing.category as ListingEntity['category']) ?? null,
          propertyType: listing.propertyType ?? null,
          subtype: listing.subtype ?? null,
          description: listing.description ?? null,
          priceAmount: listing.price?.amount ?? null,
          priceCurrency: listing.price?.currency ?? 'TRY',
          priceIsNegotiable: listing.price?.isNegotiable ?? false,
          m2Gross: listing.specifications?.grossArea ?? null,
          m2Net: listing.specifications?.netArea ?? null,
          roomCount: listing.specifications?.roomCount ?? null,
          bathroomCount: listing.specifications?.bathroomCount ?? null,
          floorNumber: listing.specifications?.floorNumber ?? null,
          totalFloors: listing.specifications?.totalFloors ?? null,
          buildingAge: listing.specifications?.buildingAge ?? null,
          heatingType: listing.specifications?.heatingType ?? null,
          carPark: listing.specifications?.hasParking ?? null,
          hasBalcony: listing.specifications?.hasBalcony ?? null,
          imageCount: listing.imageCount ?? 0,
        })
        .orUpdate(
          [
            'title',
            'consultant_id',
            'status',
            'category',
            'property_type',
            'description',
            'price_amount',
            'price_currency',
            'price_is_negotiable',
            'm2_gross',
            'm2_net',
            'room_count',
            'bathroom_count',
            'floor_number',
            'total_floors',
            'building_age',
            'heating_type',
            'car_park',
            'has_balcony',
            'image_count',
            'submitted_at',
            'updated_at',
          ],
          ['id'],
        )
        .execute();

      if (listing.location) {
        await em
          .createQueryBuilder()
          .insert()
          .into(ListingLocationEntity)
          .values({
            listingId: listing.id,
            city: listing.location.city ?? null,
            district: listing.location.district ?? null,
            neighborhood: listing.location.neighborhood ?? null,
            lat: listing.location.coordinates?.latitude ?? null,
            lng: listing.location.coordinates?.longitude ?? null,
          })
          .orUpdate(
            ['city', 'district', 'neighborhood', 'lat', 'lng'],
            ['listing_id'],
          )
          .execute();
      }
    });
  }

  // ── COMPLETE SALE (consultant own listing) ────────────────────────────────

  /**
   * Marks the listing as sold and moves it PUBLISHED → UNPUBLISHED.
   * Only the owning consultant may call this. Sets isSold=true, soldAt=now,
   * status=UNPUBLISHED, isFeatured=false, isShowcase=false so the
   * completedSales stats counter stays accurate.
   */
  async completeSale(id: string, consultantId: string): Promise<Listing> {
    const entity = await this.listingRepo.findOne({
      where: { id },
      relations: { location: true },
    });
    if (!entity) throw new NotFoundException(`Listing ${id} not found`);
    if (entity.consultantId !== consultantId) {
      throw new ForbiddenException('You do not own this listing');
    }
    if (entity.status !== 'PUBLISHED') {
      throw new UnprocessableEntityException(
        `Only PUBLISHED listings can be completed as a sale (current: ${entity.status})`,
      );
    }
    entity.isSold = true;
    entity.soldAt = new Date();
    entity.status = 'UNPUBLISHED';
    entity.isFeatured = false;
    entity.isShowcase = false;
    const saved = await this.listingRepo.save(entity);
    return toListingDto(saved, saved.location);
  }

  // ── SET SALE STATUS (admin) ───────────────────────────────────────────────

  async setSaleStatus(
    id: string,
    isSold: boolean,
    soldAt?: string | null,
  ): Promise<Listing> {
    const entity = await this.listingRepo.findOne({
      where: { id },
      relations: { location: true },
    });
    if (!entity) throw new NotFoundException(`Listing ${id} not found`);
    entity.isSold = isSold;

    entity.soldAt = isSold
      ? soldAt
        ? new Date(soldAt)
        : (entity.soldAt ?? new Date())
      : null;
    const saved = await this.listingRepo.save(entity);
    return toListingDto(saved, saved.location);
  }

  // ── PUBLIC STATS (no auth) ────────────────────────────────────────────────

  async getPublicStats(): Promise<{
    activeListings: number;
    completedSales: number;
    expertConsultants: number;
  }> {
    const [activeListings, completedSales, expertConsultants] =
      await Promise.all([
        this.listingRepo.count({
          where: { status: 'PUBLISHED', isSold: false },
        }),
        this.listingRepo.count({ where: { isSold: true } }),
        this.userRepo.count({
          where: [
            {
              status: 'ACTIVE',
              role: Role.CONSULTANT,
            },
            {
              status: 'ACTIVE',
              role: Role.ADMIN,
              title: Not(IsNull()),
            },
          ],
        }),
      ]);
    return { activeListings, completedSales, expertConsultants };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private toMediaItem(m: ListingMediaEntity): MediaItem {
    const originalUrl = m.publicUrl ?? this.s3Service.buildPublicUrl(m.s3Key);
    return {
      id: m.id,
      url: originalUrl,
      s3Key: m.s3Key,
      publicUrl: originalUrl,
      watermarkedUrl: m.watermarkedUrl ?? undefined,
      contentType: m.contentType ?? undefined,
      width: m.width ?? undefined,
      height: m.height ?? undefined,
      sortOrder: m.sortOrder,
      isCover: m.isCover,
      uploadedAt: m.uploadedAt.toISOString(),
    };
  }
}
