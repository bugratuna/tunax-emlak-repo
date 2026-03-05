import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject } from 'class-validator';

export class GenerateReportDto {
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'Deterministic scoring payload computed by the worker',
    example: {
      completenessScore: 85,
      descriptionQualityScore: 70,
      missingFields: ['coordinates'],
      warnings: [{ code: 'LOW_DESCRIPTION', severity: 'LOW', message: 'Short description' }],
      detectedTags: ['APARTMENT', 'ANTALYA'],
    },
  })
  @IsObject()
  @IsNotEmpty()
  deterministicScores: {
    completenessScore: number;
    descriptionQualityScore: number;
    missingFields: string[];
    warnings: Array<{
      code: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      message: string;
      field?: string | null;
    }>;
    detectedTags: string[];
  };
}
