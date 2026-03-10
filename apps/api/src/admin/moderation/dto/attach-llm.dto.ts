import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject } from 'class-validator';

export class AttachLlmDto {
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'LLM analysis result to attach to the scoring report',
    example: {
      status: 'SUCCESS',
      contentModeration: { status: 'PASS', passed: true, issues: [] },
      riskAssessment: {
        riskLevel: 'LOW',
        requiresManualReview: false,
        fraudIndicators: [],
      },
    },
  })
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
