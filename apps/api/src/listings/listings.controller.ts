import { Body, Controller, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { CreateListingDto } from './dto/create-listing.dto';
import { ListingsService } from './listings.service';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateListingDto) {
    return this.listingsService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.listingsService.findById(id);
  }

  @Patch(':id/resubmit')
  resubmit(@Param('id') id: string) {
    return this.listingsService.resubmit(id);
  }
}
