import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadsService } from './leads.service';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateLeadDto) {
    return this.leadsService.create(dto);
  }

  @Get(':leadId')
  findOne(@Param('leadId') leadId: string) {
    return this.leadsService.findById(leadId);
  }

  @Get(':leadId/score')
  getScore(@Param('leadId') leadId: string) {
    return this.leadsService.getScore(leadId);
  }
}
