import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { AttachPackDto } from './dto/attach-pack.dto';
import { MarketingService } from './marketing.service';

@Controller('marketing')
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get(':listingId/pack')
  getPackRequest(@Param('listingId') listingId: string) {
    return this.marketingService.getPackRequest(listingId);
  }

  @Patch(':listingId/pack/result')
  attachResult(
    @Param('listingId') listingId: string,
    @Body() dto: AttachPackDto,
  ) {
    return this.marketingService.attachResult(listingId, dto.result);
  }
}
