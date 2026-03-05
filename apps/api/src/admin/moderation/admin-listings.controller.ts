import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ListingsService } from '../../listings/listings.service';
import { SetFeaturedDto } from './dto/set-featured.dto';

@ApiTags('admin/listings')
@Controller('admin/listings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AdminListingsController {
  constructor(private readonly listingsService: ListingsService) {}

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
}
