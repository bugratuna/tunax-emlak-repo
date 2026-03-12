import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListingsService } from '../listings/listings.service';

@ApiTags('public')
@Controller('public')
export class PublicController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get('stats')
  @ApiOperation({
    summary: 'Get public platform statistics (no auth)',
    description:
      'Returns activeListings (PUBLISHED + not sold), completedSales (isSold=true), ' +
      'and expertConsultants (ACTIVE CONSULTANTs). Used for the homepage stats bar.',
  })
  @ApiOkResponse({
    description: '{ activeListings, completedSales, expertConsultants }',
    schema: {
      type: 'object',
      properties: {
        activeListings: { type: 'number' },
        completedSales: { type: 'number' },
        expertConsultants: { type: 'number' },
      },
    },
  })
  getStats() {
    return this.listingsService.getPublicStats();
  }
}
