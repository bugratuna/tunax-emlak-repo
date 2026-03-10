export interface ScoringWarning {
    code: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    field: string | null;
}
export interface DeterministicScores {
    completenessScore: number;
    descriptionQualityScore: number;
    missingFields: string[];
    warnings: ScoringWarning[];
    detectedTags: string[];
}
export interface ListingSpecifications {
    roomCount?: number;
    bathroomCount?: number;
    floorNumber?: number;
    totalFloors?: number;
    grossArea?: number;
    netArea?: number;
    buildingAge?: number;
    hasParking?: boolean;
    hasBalcony?: boolean;
    heatingType?: string;
}
export interface ListingJobData {
    listingId: string;
    consultantId: string;
    title?: string;
    description?: string;
    price?: {
        amount?: number;
        currency?: string;
        isNegotiable?: boolean;
    } | null;
    propertyType?: string | null;
    category?: string | null;
    location?: {
        city?: string;
        district?: string;
        neighborhood?: string;
        coordinates?: {
            latitude?: number;
            longitude?: number;
        } | null;
    } | null;
    specifications?: ListingSpecifications | null;
    imageCount?: number;
    submittedAt?: string;
    status?: string;
    isResubmission?: boolean;
    previousState?: 'DRAFT' | 'NEEDS_CHANGES';
    previousModerationReportId?: string | null;
    correlationId?: string;
}
export declare function score(data: ListingJobData): DeterministicScores;
