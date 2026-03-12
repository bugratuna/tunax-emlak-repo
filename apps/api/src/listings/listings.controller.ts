import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CommitMediaDto } from './dto/commit-media.dto';
import { CreateListingDto } from './dto/create-listing.dto';
import { ListListingsDto } from './dto/list-listings.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { UpdatePhotoOrderDto } from './dto/update-photo-order.dto';
import { ListingsService, UploadedFile } from './listings.service';

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  // ── LIST ──────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({
    summary: 'List listings with filters + pagination (public)',
    description:
      'Full filter contract. When `subtype` is provided, sending filters that are not ' +
      'applicable for that subtype returns **400 FILTER_NOT_ALLOWED_FOR_SUBTYPE**. ' +
      'Feature filters (view, interiorFeatures, etc.) use AND semantics across groups. ' +
      'bbox filter uses PostGIS GIST index.',
  })
  @ApiOkResponse({
    description: 'Paginated listing results: { data, total, page, limit }',
  })
  @ApiBadRequestResponse({
    description:
      'Malformed bbox, invalid filter value, or FILTER_NOT_ALLOWED_FOR_SUBTYPE',
  })
  @ApiQuery({ name: 'category', required: false, enum: ['SALE', 'RENT'] })
  @ApiQuery({
    name: 'propertyType',
    required: false,
    type: String,
    example: 'Konut',
  })
  @ApiQuery({
    name: 'subtype',
    required: false,
    type: String,
    example: 'Daire',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['DRAFT', 'PENDING_REVIEW', 'NEEDS_CHANGES', 'PUBLISHED', 'ARCHIVED'],
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    type: Number,
    example: 500000,
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    type: Number,
    example: 5000000,
  })
  @ApiQuery({ name: 'minM2Gross', required: false, type: Number, example: 80 })
  @ApiQuery({ name: 'maxM2Gross', required: false, type: Number, example: 250 })
  @ApiQuery({ name: 'minM2Net', required: false, type: Number })
  @ApiQuery({ name: 'maxM2Net', required: false, type: Number })
  @ApiQuery({
    name: 'roomCount',
    required: false,
    type: Number,
    example: 3,
    description: 'Exact match',
  })
  @ApiQuery({ name: 'bathroomCount', required: false, type: Number })
  @ApiQuery({ name: 'minBuildingAge', required: false, type: Number })
  @ApiQuery({ name: 'maxBuildingAge', required: false, type: Number })
  @ApiQuery({ name: 'floorNumber', required: false, type: Number })
  @ApiQuery({ name: 'totalFloors', required: false, type: Number })
  @ApiQuery({
    name: 'heatingType',
    required: false,
    type: String,
    example: 'Doğalgaz (Kombi)',
  })
  @ApiQuery({
    name: 'kitchenState',
    required: false,
    type: String,
    example: 'Açık Mutfak',
  })
  @ApiQuery({ name: 'carPark', required: false, type: Boolean })
  @ApiQuery({ name: 'isFurnished', required: false, type: Boolean })
  @ApiQuery({
    name: 'hasBalcony',
    required: false,
    type: Boolean,
    example: true,
  })
  @ApiQuery({ name: 'hasElevator', required: false, type: Boolean })
  @ApiQuery({ name: 'inComplex', required: false, type: Boolean })
  @ApiQuery({ name: 'isLoanEligible', required: false, type: Boolean })
  @ApiQuery({ name: 'isSwapAvailable', required: false, type: Boolean })
  @ApiQuery({ name: 'minDues', required: false, type: Number })
  @ApiQuery({ name: 'maxDues', required: false, type: Number })
  @ApiQuery({ name: 'city', required: false, type: String, example: 'Antalya' })
  @ApiQuery({
    name: 'district',
    required: false,
    type: String,
    example: 'Konyaaltı',
  })
  @ApiQuery({
    name: 'neighborhood',
    required: false,
    type: String,
    example: 'Liman',
  })
  @ApiQuery({
    name: 'bbox',
    required: false,
    type: String,
    example: '30.5,36.7,31.1,37.2',
    description: 'minLng,minLat,maxLng,maxLat — PostGIS GIST-indexed',
  })
  @ApiQuery({ name: 'view', required: false, type: [String], isArray: true })
  @ApiQuery({
    name: 'interiorFeatures',
    required: false,
    type: [String],
    isArray: true,
  })
  @ApiQuery({
    name: 'exteriorFeatures',
    required: false,
    type: [String],
    isArray: true,
  })
  @ApiQuery({ name: 'facades', required: false, type: [String], isArray: true })
  @ApiQuery({
    name: 'vicinity',
    required: false,
    type: [String],
    isArray: true,
  })
  @ApiQuery({
    name: 'transportation',
    required: false,
    type: [String],
    isArray: true,
  })
  @ApiQuery({
    name: 'housingType',
    required: false,
    type: [String],
    isArray: true,
  })
  @ApiQuery({
    name: 'accessibility',
    required: false,
    type: [String],
    isArray: true,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['price_asc', 'price_desc', 'newest', 'oldest'],
  })
  listAll(@Query() filters: ListListingsDto) {
    return this.listingsService.listAll(filters);
  }

  // ── GET BY ID ─────────────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({
    summary: 'Get a listing by ID — includes media array (public)',
  })
  @ApiOkResponse({
    description: 'Listing with location, features, and media[]',
  })
  @ApiNotFoundResponse({ description: 'Listing not found' })
  findOne(@Param('id') id: string) {
    return this.listingsService.findById(id);
  }

  // ── CREATE ────────────────────────────────────────────────────────────────

  @Post()
  @HttpCode(201)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CONSULTANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a listing (CONSULTANT only)' })
  @ApiCreatedResponse({ description: 'Listing created and queued for review' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({ description: 'Requires CONSULTANT role' })
  create(@Body() dto: CreateListingDto, @CurrentUser() user: JwtPayload) {
    return this.listingsService.create({ ...dto, consultantId: user.sub });
  }

  // ── UPDATE (NEEDS_CHANGES or DRAFT) ──────────────────────────────────────

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CONSULTANT)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Update a listing in NEEDS_CHANGES or DRAFT status (CONSULTANT only)',
    description:
      'All fields are optional. Only provided fields are updated. ' +
      'Status must be NEEDS_CHANGES or DRAFT — returns 409 otherwise. ' +
      'Caller must own the listing — returns 403 otherwise.',
  })
  @ApiOkResponse({ description: 'Updated listing' })
  @ApiConflictResponse({
    description: 'Listing not editable in current status',
  })
  @ApiForbiddenResponse({ description: 'Not owner or wrong role' })
  @ApiNotFoundResponse({ description: 'Listing not found' })
  updateListing(
    @Param('id') id: string,
    @Body() dto: UpdateListingDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.listingsService.updateListing(id, dto, user.sub);
  }

  // ── CONTACT INFO (public) ─────────────────────────────────────────────────

  @Get(':id/contact')
  @ApiOperation({
    summary: 'Get consultant contact info for a PUBLISHED listing (public)',
    description:
      'Returns consultant name and phone. Phone is null if not stored. ' +
      'Returns 404 if listing is not PUBLISHED.',
  })
  @ApiOkResponse({
    description: '{ consultantName: string, phone: string | null }',
  })
  @ApiNotFoundResponse({ description: 'Listing not found or not PUBLISHED' })
  getContactInfo(@Param('id') id: string) {
    return this.listingsService.getContactInfo(id);
  }

  // ── ADMIN FEEDBACK (consultant-accessible) ────────────────────────────────

  @Get(':id/feedback')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CONSULTANT)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Get admin feedback for a NEEDS_CHANGES listing (CONSULTANT — owner only)',
    description:
      'Returns { feedback: string | null }. Reads the latest moderation report for the listing. Returns 403 if caller is not the listing owner.',
  })
  @ApiOkResponse({ description: '{ feedback: string | null }' })
  @ApiForbiddenResponse({ description: 'Not listing owner or wrong role' })
  @ApiNotFoundResponse({ description: 'Listing not found' })
  getListingFeedback(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.listingsService.getAdminFeedback(id, user.sub);
  }

  // ── UNPUBLISH (CONSULTANT own + ADMIN any) ───────────────────────────────

  @Patch(':id/unpublish')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CONSULTANT, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Unpublish a PUBLISHED listing (CONSULTANT = own only; ADMIN = any)',
    description:
      'Moves the listing from PUBLISHED → UNPUBLISHED. ' +
      'Resets isFeatured and isShowcase to false. ' +
      'CONSULTANT callers must own the listing. ' +
      'The listing can be resubmitted for review from UNPUBLISHED status.',
  })
  @ApiOkResponse({ description: 'Listing with updated status UNPUBLISHED' })
  @ApiNotFoundResponse({ description: 'Listing not found' })
  @ApiForbiddenResponse({ description: 'Not owner or wrong role' })
  unpublish(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.listingsService.unpublishListing(
      id,
      user.sub,
      user.role as 'CONSULTANT' | 'ADMIN',
    );
  }

  // ── COMPLETE SALE (CONSULTANT own listing) ───────────────────────────────

  @Patch(':id/complete-sale')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CONSULTANT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mark a listing as sold and unpublish it (CONSULTANT — own only)',
    description:
      'Sets isSold=true, soldAt=now(), status=UNPUBLISHED, isFeatured=false, isShowcase=false. ' +
      'Caller must own the listing. Listing must be PUBLISHED. ' +
      'This ensures the completedSales stats counter remains accurate.',
  })
  @ApiOkResponse({ description: 'Listing with isSold=true, status=UNPUBLISHED' })
  @ApiNotFoundResponse({ description: 'Listing not found' })
  @ApiForbiddenResponse({ description: 'Not owner or wrong role' })
  @ApiUnauthorizedResponse()
  completeSale(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.listingsService.completeSale(id, user.sub);
  }

  // ── RESUBMIT ──────────────────────────────────────────────────────────────

  @Patch(':id/resubmit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CONSULTANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resubmit a listing for review (CONSULTANT only)' })
  @ApiOkResponse({
    description: 'Listing resubmitted, status → PENDING_REVIEW',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({ description: 'Requires CONSULTANT role' })
  @ApiNotFoundResponse({ description: 'Listing not found' })
  @ApiConflictResponse({
    description: 'Listing is not in NEEDS_CHANGES status',
  })
  resubmit(@Param('id') id: string) {
    return this.listingsService.resubmit(id);
  }

  // ── MEDIA: COMMIT ─────────────────────────────────────────────────────────

  @Post(':id/media/commit')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CONSULTANT)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Register uploaded media metadata after direct S3 upload (CONSULTANT only)',
    description:
      'Call after the S3 PUT to `uploadUrl` completes. Body must include the ' +
      '`s3Key` and `publicUrl` returned by `POST /api/media/presign`. ' +
      'Inserts a `listing_media` row and increments `listings.image_count`. ' +
      'Returns the full ordered media list.',
  })
  @ApiCreatedResponse({ description: 'Array of MediaItem for this listing' })
  @ApiNotFoundResponse({ description: 'Listing not found' })
  @ApiBadRequestResponse({
    description: 's3Key does not belong to this listing',
  })
  @ApiForbiddenResponse({
    description: 'Listing belongs to a different consultant',
  })
  commitMedia(
    @Param('id') id: string,
    @Body() dto: CommitMediaDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.listingsService.commitMedia(id, dto, user.sub);
  }

  // ── MEDIA: DELETE ─────────────────────────────────────────────────────────

  @Delete(':id/media/:mediaId')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CONSULTANT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a media item — removes from S3 and DB (CONSULTANT only)',
  })
  @ApiOkResponse({ description: '{ deleted: true }' })
  @ApiNotFoundResponse({ description: 'Media not found for this listing' })
  @ApiForbiddenResponse({
    description: 'Listing belongs to a different consultant',
  })
  deleteMedia(
    @Param('id') id: string,
    @Param('mediaId') mediaId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.listingsService.deleteMedia(id, mediaId, user.sub);
  }

  // ── PHOTOS: UPLOAD (multipart) ─────────────────────────────────────────────

  @Post(':id/photos')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CONSULTANT)
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Only jpg, jpeg, png, webp files are allowed',
            ),
            false,
          );
        }
      },
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Upload photos via multipart/form-data — max 20 photos (CONSULTANT only)',
    description:
      'Accepts up to 20 files in the `files` field. Max 10 MB per file. ' +
      'Allowed types: jpg, jpeg, png, webp. Uploads to S3 and persists listing_media rows.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
      required: ['files'],
    },
  })
  @ApiCreatedResponse({ description: 'Array of MediaItem for this listing' })
  @ApiBadRequestResponse({
    description: 'Invalid file type or photo limit exceeded',
  })
  @ApiForbiddenResponse({
    description: 'Listing belongs to a different consultant',
  })
  @ApiNotFoundResponse({ description: 'Listing not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  uploadPhotos(
    @Param('id') id: string,
    @UploadedFiles() files: UploadedFile[],
    @CurrentUser() user: JwtPayload,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }
    return this.listingsService.uploadPhotos(id, files, user.sub);
  }

  // ── PHOTOS: DELETE ─────────────────────────────────────────────────────────

  @Delete(':id/photos/:photoId')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CONSULTANT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a photo — removes from S3 and DB (CONSULTANT only)',
  })
  @ApiOkResponse({ description: '{ deleted: true }' })
  @ApiNotFoundResponse({ description: 'Photo not found for this listing' })
  @ApiForbiddenResponse({
    description: 'Listing belongs to a different consultant',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  deletePhoto(
    @Param('id') id: string,
    @Param('photoId') photoId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.listingsService.deleteMedia(id, photoId, user.sub);
  }

  // ── PHOTOS: REORDER ────────────────────────────────────────────────────────

  @Patch(':id/photos/order')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CONSULTANT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update photo display order (CONSULTANT only)',
    description:
      'Pass an array of photo IDs in the desired order. ' +
      "Each photo's sortOrder is set to its array index; the first becomes the cover image.",
  })
  @ApiOkResponse({ description: 'Updated array of MediaItem in new order' })
  @ApiBadRequestResponse({ description: 'Invalid UUID in order array' })
  @ApiForbiddenResponse({
    description: 'Listing belongs to a different consultant',
  })
  @ApiNotFoundResponse({ description: 'Listing not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  reorderPhotos(
    @Param('id') id: string,
    @Body() dto: UpdatePhotoOrderDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.listingsService.reorderPhotos(id, dto, user.sub);
  }

  // ── LOCATION UPDATE ────────────────────────────────────────────────────────

  @Patch(':id/location')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CONSULTANT)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Update listing location coordinates and address (CONSULTANT only)',
    description:
      'Upserts the listing_locations row. Provide lat/lng; city, district, neighborhood are optional.',
  })
  @ApiOkResponse({ description: 'Full listing object with updated location' })
  @ApiBadRequestResponse({ description: 'Coordinates out of range' })
  @ApiForbiddenResponse({
    description: 'Listing belongs to a different consultant',
  })
  @ApiNotFoundResponse({ description: 'Listing not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  updateLocation(
    @Param('id') id: string,
    @Body() dto: UpdateLocationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.listingsService.updateLocation(id, dto, user.sub);
  }
}
