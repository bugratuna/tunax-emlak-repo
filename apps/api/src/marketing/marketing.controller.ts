import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { InternalApiKeyGuard } from '../admin/moderation/guards/internal-api-key.guard';
import { AttachPackDto } from './dto/attach-pack.dto';
import { MarketingService } from './marketing.service';

@ApiTags('marketing')
@Controller('marketing')
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get(':listingId/pack')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get marketing pack request (ADMIN)' })
  @ApiOkResponse({
    description: 'Marketing asset pack request with HITL prompt',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role' })
  @ApiNotFoundResponse({
    description: 'No pack request found for this listing',
  })
  getPackRequest(@Param('listingId') listingId: string) {
    return this.marketingService.getPackRequest(listingId);
  }

  @Patch(':listingId/pack/result')
  @UseGuards(InternalApiKeyGuard)
  @ApiSecurity('internal-key')
  @ApiOperation({
    summary: 'Attach marketing pack result (INTERNAL — worker only)',
  })
  @ApiOkResponse({ description: 'Pack result attached, status → COMPLETED' })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid x-internal-api-key header',
  })
  @ApiNotFoundResponse({
    description: 'No pack request found for this listing',
  })
  attachResult(
    @Param('listingId') listingId: string,
    @Body() dto: AttachPackDto,
  ) {
    return this.marketingService.attachResult(listingId, dto.result);
  }
}
