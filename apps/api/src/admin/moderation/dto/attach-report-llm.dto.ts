import { IsNotEmpty, IsObject } from 'class-validator';

// Body DTO for PATCH /api/admin/moderation/:listingId/report/llm
// The service performs deep structural validation against LLM_RESULT_SCHEMA;
// class-validator only guards that the field is a non-null object (not a string/array).
export class AttachReportLlmDto {
  @IsObject()
  @IsNotEmpty()
  llmResult: {
    status: 'SUCCESS' | 'PARTIAL' | 'ERROR';
    contentModeration?: {
      status: 'PASS' | 'FAIL' | 'WARNING';
      passed: boolean;
      issues: Array<{
        type: string;
        severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        message: string;
        field?: string | null;
        confidence?: number;
      }>;
    };
    factVerification?: {
      status: 'CONSISTENT' | 'INCONSISTENT' | 'INSUFFICIENT_DATA';
      consistencyScore?: number | null;
      inconsistencies: Array<{
        type: string;
        severity: 'LOW' | 'MEDIUM' | 'HIGH';
        message: string;
        field: string;
      }>;
    };
    riskAssessment?: {
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      requiresManualReview: boolean;
      fraudIndicators: Array<{
        indicator: string;
        severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        message: string;
        evidence: string;
      }>;
    };
    error?: { code: string; message: string };
  };
}
