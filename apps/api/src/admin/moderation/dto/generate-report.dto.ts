import { IsNotEmpty, IsObject } from 'class-validator';

export class GenerateReportDto {
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
