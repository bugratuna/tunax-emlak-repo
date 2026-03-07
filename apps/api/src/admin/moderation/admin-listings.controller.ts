import { Body, Controller, Get, HttpCode, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ListListingsDto } from '../../listings/dto/list-listings.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ListingsService } from '../../listings/listings.service';
import { SetFeaturedDto } from './dto/set-featured.dto';
import { SetShowcaseDto } from './dto/set-showcase.dto';

@ApiTags('admin/listings')
@Controller('admin/listings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AdminListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get()
  @ApiOperation({
    summary: 'List all listings across all statuses (ADMIN only)',
    description:
      'Returns paginated listings with no default status filter. ' +
      'Supports ?status=, ?search= (title ILIKE), ?page=, ?limit=, and all standard filters.',
  })
  @ApiOkResponse({ description: 'Paginated listing results: { data, total, page, limit }' })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT','PENDING_REVIEW','NEEDS_CHANGES','PUBLISHED','ARCHIVED','UNPUBLISHED'] })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Title search (case-insensitive substring)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  listAll(@Query() dto: ListListingsDto) {
    return this.listingsService.listAll(dto);
  }

  @Patch(':id/featured')
  @ApiOperation({
    summary: 'Toggle featured status for a PUBLISHED listing (ADMIN only)',
    description:
      'Sets isFeatured and optionally featuredSortOrder. ' +
      'Only PUBLISHED listings can be featured — returns 422 otherwise.',
  })
  @ApiOkResponse({ description: 'Listing with updated isFeatured + featuredSortOrder' })
  @ApiNotFoundResponse({ description: 'Listing not found' })
  @ApiUnprocessableEntityResponse({ description: 'Listing is not PUBLISHED' })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  setFeatured(
    @Param('id') id: string,
    @Body() dto: SetFeaturedDto,
  ) {
    return this.listingsService.setFeatured(id, dto.isFeatured, dto.sortOrder);
  }

  @Patch(':id/showcase')
  @ApiOperation({
    summary: 'Toggle Vitrin (showcase) status for a PUBLISHED listing (ADMIN only)',
    description:
      'Sets isShowcase and optionally showcaseOrder. ' +
      'Only PUBLISHED listings can be added to Vitrin — returns 422 otherwise.',
  })
  @ApiOkResponse({ description: 'Listing with updated isShowcase + showcaseOrder' })
  @ApiNotFoundResponse({ description: 'İlan bulunamadı' })
  @ApiUnprocessableEntityResponse({ description: 'İlan yayında değil' })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  setShowcase(
    @Param('id') id: string,
    @Body() dto: SetShowcaseDto,
  ) {
    return this.listingsService.setShowcase(id, dto.isShowcase, dto.sortOrder);
  }

  @Patch(':id/unpublish')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Unpublish any PUBLISHED listing (ADMIN only)',
    description:
      'Moves listing PUBLISHED → UNPUBLISHED. Resets isFeatured and isShowcase. ' +
      'Listing can be re-approved or resubmitted for review afterwards.',
  })
  @ApiOkResponse({ description: 'Listing with updated status UNPUBLISHED' })
  @ApiNotFoundResponse({ description: 'Listing not found' })
  @ApiUnprocessableEntityResponse({ description: 'Listing is not PUBLISHED' })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  unpublish(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.listingsService.unpublishListing(id, user.sub, 'ADMIN');
  }
}
