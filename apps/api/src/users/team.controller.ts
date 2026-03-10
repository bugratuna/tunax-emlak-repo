import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('team')
@Controller('team')
export class TeamController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all active consultants (public)' })
  @ApiOkResponse({ description: 'Array of ConsultantPublicProfile' })
  listConsultants() {
    return this.usersService.findPublicConsultants();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single active consultant by ID (public)' })
  @ApiOkResponse({ description: 'ConsultantPublicProfile' })
  @ApiNotFoundResponse({ description: 'Consultant not found or not active' })
  async getConsultant(@Param('id') id: string) {
    const consultant = await this.usersService.findPublicConsultantById(id);
    if (!consultant) throw new NotFoundException('Danışman bulunamadı');
    return consultant;
  }
}
