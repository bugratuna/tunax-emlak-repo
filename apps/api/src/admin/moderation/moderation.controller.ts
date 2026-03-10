import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AttachLlmDto } from './dto/attach-llm.dto';
import { AttachReportLlmDto } from './dto/attach-report-llm.dto';
import { ApproveDto } from './dto/approve.dto';
import { GenerateReportDto } from './dto/generate-report.dto';
import { RejectDto } from './dto/reject.dto';
import { RequestChangesDto } from './dto/request-changes.dto';
import { InternalApiKeyGuard } from './guards/internal-api-key.guard';
import { ModerationService } from './moderation.service';

@ApiTags('admin/moderation')
@Controller('admin/moderation')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  // --- Queue & reports (ADMIN only) ---

  @Get('queue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pending review queue (ADMIN)' })
  @ApiOkResponse({ description: 'Array of listings in PENDING_REVIEW status' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role' })
  getQueue() {
    return this.moderationService.getQueue();
  }

  @Get(':listingId/report')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get moderation report (ADMIN)' })
  @ApiOkResponse({ description: 'Moderation report for the listing' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role' })
  @ApiNotFoundResponse({ description: 'No report found for this listing' })
  getReport(@Param('listingId') listingId: string) {
    return this.moderationService.getReport(listingId);
  }

  @Get(':listingId/audit-log')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get audit log entries (ADMIN)' })
  @ApiOkResponse({ description: 'Array of audit log entries for the listing' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role' })
  @ApiNotFoundResponse({ description: 'Listing not found' })
  getAuditLog(@Param('listingId') listingId: string) {
    return this.moderationService.getModerationAuditLog(listingId);
  }

  @Get(':listingId/score')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get scoring report (ADMIN)' })
  @ApiOkResponse({
    description: 'Scoring report with deterministic + LLM scores',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role' })
  @ApiNotFoundResponse({
    description: 'No scoring report found for this listing',
  })
  getScoringReport(@Param('listingId') listingId: string) {
    return this.moderationService.getScoringReport(listingId);
  }

  // --- Scoring pipeline (INTERNAL — worker only) ---

  @Post(':listingId/score')
  @HttpCode(201)
  @UseGuards(InternalApiKeyGuard)
  @ApiSecurity('internal-key')
  @ApiOperation({ summary: 'Generate score (INTERNAL — worker only)' })
  @ApiCreatedResponse({ description: 'Scoring report created' })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid x-internal-api-key header',
  })
  @ApiNotFoundResponse({ description: 'Listing not found' })
  generateScore(
    @Param('listingId') listingId: string,
    @Body() dto: GenerateReportDto,
  ) {
    return this.moderationService.generateScore(
      listingId,
      dto.deterministicScores,
    );
  }

  @Patch(':listingId/score/llm')
  @UseGuards(InternalApiKeyGuard)
  @ApiSecurity('internal-key')
  @ApiOperation({ summary: 'Attach LLM result to scoring report (INTERNAL)' })
  @ApiOkResponse({ description: 'LLM result attached to scoring report' })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid x-internal-api-key header',
  })
  @ApiNotFoundResponse({ description: 'Scoring report not found' })
  attachLlm(@Param('listingId') listingId: string, @Body() dto: AttachLlmDto) {
    return this.moderationService.attachLlm(listingId, dto.llmResult);
  }

  // --- HITL Enrichment (INTERNAL — worker / operator only) ---

  @Post(':listingId/enrich')
  @HttpCode(201)
  @UseGuards(InternalApiKeyGuard)
  @ApiSecurity('internal-key')
  @ApiOperation({
    summary: 'Init HITL enrichment scaffold (INTERNAL — worker only)',
  })
  @ApiCreatedResponse({
    description: 'Enrichment scaffold with llmPrompt + llmJsonSchema created',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid x-internal-api-key header',
  })
  @ApiNotFoundResponse({
    description: 'Listing not found (or scoring report not yet created)',
  })
  initEnrichment(@Param('listingId') listingId: string) {
    return this.moderationService.initEnrichment(listingId);
  }

  @Patch(':listingId/report/llm')
  @UseGuards(InternalApiKeyGuard)
  @ApiSecurity('internal-key')
  @ApiOperation({
    summary: 'Attach operator LLM result to moderation report (INTERNAL)',
  })
  @ApiOkResponse({
    description: 'LLM result attached and validated against llmJsonSchema',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid x-internal-api-key header',
  })
  @ApiUnprocessableEntityResponse({
    description: 'llmResult does not match the stored llmJsonSchema',
  })
  attachReportLlm(
    @Param('listingId') listingId: string,
    @Body() dto: AttachReportLlmDto,
  ) {
    return this.moderationService.attachReportLlm(listingId, dto.llmResult);
  }

  // --- Admin decision actions (ADMIN + JWT) ---

  @Patch(':listingId/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a listing (ADMIN)' })
  @ApiOkResponse({ description: 'Listing approved, status → PUBLISHED' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role' })
  @ApiNotFoundResponse({ description: 'Listing not found' })
  @ApiConflictResponse({
    description: 'Listing is not in PENDING_REVIEW status',
  })
  approve(
    @Param('listingId') listingId: string,
    @Body() dto: ApproveDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.moderationService.approve(listingId, user.sub, dto.notes);
  }

  @Patch(':listingId/request-changes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request changes on a listing (ADMIN)' })
  @ApiOkResponse({ description: 'Changes requested, status → NEEDS_CHANGES' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role' })
  @ApiNotFoundResponse({ description: 'Listing not found' })
  @ApiConflictResponse({
    description: 'Listing is not in PENDING_REVIEW status',
  })
  requestChanges(
    @Param('listingId') listingId: string,
    @Body() dto: RequestChangesDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.moderationService.requestChanges(
      listingId,
      dto.feedback,
      user.sub,
    );
  }

  @Patch(':listingId/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a listing (ADMIN)' })
  @ApiOkResponse({ description: 'Listing rejected, status → ARCHIVED' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role' })
  @ApiNotFoundResponse({ description: 'Listing not found' })
  @ApiConflictResponse({
    description: 'Listing is not in PENDING_REVIEW status',
  })
  reject(
    @Param('listingId') listingId: string,
    @Body() dto: RejectDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.moderationService.reject(listingId, user.sub, dto.reason);
  }
}
