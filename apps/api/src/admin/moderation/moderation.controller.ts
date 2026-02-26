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
import { AttachLlmDto } from './dto/attach-llm.dto';
import { AttachReportLlmDto } from './dto/attach-report-llm.dto';
import { ApproveDto } from './dto/approve.dto';
import { GenerateReportDto } from './dto/generate-report.dto';
import { RejectDto } from './dto/reject.dto';
import { RequestChangesDto } from './dto/request-changes.dto';
import { InternalApiKeyGuard } from './guards/internal-api-key.guard';
import { ModerationService } from './moderation.service';

@Controller('admin/moderation')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  // --- Queue & reports ---

  @Get('queue')
  getQueue() {
    return this.moderationService.getQueue();
  }

  @Get(':listingId/report')
  getReport(@Param('listingId') listingId: string) {
    return this.moderationService.getReport(listingId);
  }

  @Get(':listingId/audit-log')
  getAuditLog(@Param('listingId') listingId: string) {
    return this.moderationService.getModerationAuditLog(listingId);
  }

  @Get(':listingId/score')
  getScoringReport(@Param('listingId') listingId: string) {
    return this.moderationService.getScoringReport(listingId);
  }

  // --- Scoring pipeline (internal — worker only) ---

  @Post(':listingId/score')
  @HttpCode(201)
  @UseGuards(InternalApiKeyGuard)
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
  attachLlm(
    @Param('listingId') listingId: string,
    @Body() dto: AttachLlmDto,
  ) {
    return this.moderationService.attachLlm(listingId, dto.llmResult);
  }

  // --- HITL Enrichment (Module 3) ---

  // Internal: worker calls this after POST /score to embed llmPrompt + llmJsonSchema.
  @Post(':listingId/enrich')
  @HttpCode(201)
  @UseGuards(InternalApiKeyGuard)
  initEnrichment(@Param('listingId') listingId: string) {
    return this.moderationService.initEnrichment(listingId);
  }

  // Internal: operator pastes LLM output here after running llmPrompt externally.
  // Returns 422 if llmResult does not match llmJsonSchema.
  @Patch(':listingId/report/llm')
  @UseGuards(InternalApiKeyGuard)
  attachReportLlm(
    @Param('listingId') listingId: string,
    @Body() dto: AttachReportLlmDto,
  ) {
    return this.moderationService.attachReportLlm(listingId, dto.llmResult);
  }

  // --- Admin decision actions ---

  @Patch(':listingId/approve')
  approve(@Param('listingId') listingId: string, @Body() dto: ApproveDto) {
    return this.moderationService.approve(listingId, dto.adminId, dto.notes);
  }

  @Patch(':listingId/request-changes')
  requestChanges(
    @Param('listingId') listingId: string,
    @Body() dto: RequestChangesDto,
  ) {
    return this.moderationService.requestChanges(
      listingId,
      dto.feedback,
      dto.adminId,
    );
  }

  @Patch(':listingId/reject')
  reject(@Param('listingId') listingId: string, @Body() dto: RejectDto) {
    return this.moderationService.reject(listingId, dto.adminId, dto.reason);
  }
}
