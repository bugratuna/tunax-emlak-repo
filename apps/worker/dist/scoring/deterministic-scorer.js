"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.score = score;
const ANTALYA_BOUNDS = {
    latMin: 36.0,
    latMax: 37.6,
    lonMin: 29.5,
    lonMax: 32.5,
};
const ANTALYA_DISTRICTS = new Set([
    'muratpaşa',
    'kepez',
    'konyaaltı',
    'döşemealtı',
    'aksu',
    'alanya',
    'manavgat',
    'serik',
    'kemer',
    'kumluca',
    'finike',
    'kaş',
    'demre',
    'elmalı',
    'korkuteli',
    'akseki',
    'gündoğmuş',
    'ibradı',
    'gazipaşa',
]);
const REALESTATE_KEYWORDS = [
    'daire', 'villa', 'arsa', 'satılık', 'kiralık', 'oda', 'm²', 'm2',
    'balkon', 'otopark', 'asansör', 'havuz', 'konut', 'bahçe', 'site',
    'kat', 'eşyalı', 'merkezi', 'yatırım', 'deniz', 'manzara',
];
const WEIGHTS = {
    title: 8,
    description: 20,
    price: 15,
    propertyType: 10,
    category: 10,
    locationCity: 2,
    locationDistrict: 6,
    locationNeighborhood: 4,
    locationCoordinates: 3,
    specifications: 12,
    images: 10,
};
function score(data) {
    const warnings = [];
    const missingFields = [];
    const detectedTags = [];
    let weightedScore = 0;
    if (data.title && data.title.trim().length >= 10) {
        weightedScore += WEIGHTS.title;
    }
    else {
        missingFields.push('title');
        warnings.push({
            code: 'TITLE_TOO_SHORT',
            severity: 'HIGH',
            message: 'Title must be at least 10 characters.',
            field: 'title',
        });
    }
    const descLen = data.description?.trim().length ?? 0;
    if (!data.description || descLen === 0) {
        missingFields.push('description');
        warnings.push({
            code: 'DESCRIPTION_TOO_SHORT',
            severity: 'HIGH',
            message: 'Description is required and must be at least 50 characters.',
            field: 'description',
        });
    }
    else if (descLen < 50) {
        warnings.push({
            code: 'DESCRIPTION_TOO_SHORT',
            severity: 'HIGH',
            message: 'Description must be at least 50 characters.',
            field: 'description',
        });
    }
    else if (descLen < 200) {
        warnings.push({
            code: 'DESCRIPTION_SUBOPTIMAL',
            severity: 'MEDIUM',
            message: 'Description is recommended to be at least 200 characters for higher quality.',
            field: 'description',
        });
        weightedScore += WEIGHTS.description;
    }
    else if (descLen > 5000) {
        warnings.push({
            code: 'DESCRIPTION_TOO_LONG',
            severity: 'MEDIUM',
            message: 'Description must not exceed 5000 characters.',
            field: 'description',
        });
        weightedScore += WEIGHTS.description;
    }
    else {
        weightedScore += WEIGHTS.description;
    }
    if (!data.price || data.price.amount == null) {
        missingFields.push('price');
        warnings.push({
            code: 'PRICE_MISSING',
            severity: 'HIGH',
            message: 'Price is required.',
            field: 'price',
        });
    }
    else {
        weightedScore += WEIGHTS.price;
    }
    if (!data.propertyType) {
        missingFields.push('propertyType');
        warnings.push({
            code: 'PROPERTY_TYPE_MISSING',
            severity: 'MEDIUM',
            message: 'Property type is required (e.g. DAIRE, VILLA, ARSA).',
            field: 'propertyType',
        });
    }
    else {
        weightedScore += WEIGHTS.propertyType;
    }
    if (!data.category) {
        missingFields.push('category');
        warnings.push({
            code: 'CATEGORY_MISSING',
            severity: 'MEDIUM',
            message: 'Category is required (SATILIK or KIRALIK).',
            field: 'category',
        });
    }
    else {
        weightedScore += WEIGHTS.category;
        if (data.category.toUpperCase() === 'SATILIK')
            detectedTags.push('for-sale');
        else if (data.category.toUpperCase() === 'KIRALIK')
            detectedTags.push('for-rent');
    }
    if (!data.location) {
        missingFields.push('location');
        warnings.push({
            code: 'LOCATION_MISSING',
            severity: 'HIGH',
            message: 'Location is required.',
            field: 'location',
        });
    }
    else {
        if (data.location.city) {
            weightedScore += WEIGHTS.locationCity;
        }
        if (!data.location.district) {
            warnings.push({
                code: 'INVALID_DISTRICT',
                severity: 'HIGH',
                message: 'District is required and must be one of the 19 Antalya districts.',
                field: 'location.district',
            });
        }
        else if (!ANTALYA_DISTRICTS.has(data.location.district.toLowerCase())) {
            warnings.push({
                code: 'INVALID_DISTRICT',
                severity: 'HIGH',
                message: `District "${data.location.district}" is not in the Antalya district whitelist.`,
                field: 'location.district',
            });
        }
        else {
            weightedScore += WEIGHTS.locationDistrict;
        }
        if (!data.location.neighborhood) {
            warnings.push({
                code: 'NEIGHBORHOOD_MISSING',
                severity: 'MEDIUM',
                message: 'Neighborhood is recommended for better listing quality.',
                field: 'location.neighborhood',
            });
        }
        else {
            weightedScore += WEIGHTS.locationNeighborhood;
        }
        const coords = data.location.coordinates;
        if (coords && coords.latitude != null && coords.longitude != null) {
            if (coords.latitude < ANTALYA_BOUNDS.latMin ||
                coords.latitude > ANTALYA_BOUNDS.latMax ||
                coords.longitude < ANTALYA_BOUNDS.lonMin ||
                coords.longitude > ANTALYA_BOUNDS.lonMax) {
                warnings.push({
                    code: 'COORDINATES_OUT_OF_BOUNDS',
                    severity: 'HIGH',
                    message: `Coordinates (${coords.latitude}, ${coords.longitude}) are outside the Antalya province bounding box.`,
                    field: 'location.coordinates',
                });
            }
            else {
                weightedScore += WEIGHTS.locationCoordinates;
            }
        }
    }
    if (!data.specifications) {
        missingFields.push('specifications');
        warnings.push({
            code: 'SPECIFICATIONS_MISSING',
            severity: 'LOW',
            message: 'Specifications (room count, area, etc.) improve listing quality.',
            field: 'specifications',
        });
    }
    else {
        weightedScore += WEIGHTS.specifications;
    }
    const imageCount = data.imageCount ?? 0;
    if (imageCount === 0) {
        missingFields.push('images');
        warnings.push({
            code: 'NO_IMAGES',
            severity: 'CRITICAL',
            message: 'At least one image is required. Listings with no images are automatically rejected.',
            field: 'images',
        });
    }
    else if (imageCount < 3) {
        warnings.push({
            code: 'INSUFFICIENT_IMAGES',
            severity: 'MEDIUM',
            message: `Only ${imageCount} image(s) provided. At least 3 images are recommended.`,
            field: 'images',
        });
        weightedScore += WEIGHTS.images;
    }
    else {
        weightedScore += WEIGHTS.images;
    }
    const specs = data.specifications;
    const descLower = data.description?.toLowerCase() ?? '';
    const titleLower = data.title?.toLowerCase() ?? '';
    if (specs?.hasParking === true)
        detectedTags.push('has-parking');
    if (specs?.hasBalcony === true)
        detectedTags.push('has-balcony');
    if (descLower.includes('havuz'))
        detectedTags.push('has-pool');
    if (descLower.includes('asansör'))
        detectedTags.push('has-elevator');
    if (descLower.includes('bahçe'))
        detectedTags.push('has-garden');
    if (descLower.includes('deniz manzara') || titleLower.includes('deniz manzara'))
        detectedTags.push('sea-view');
    if (descLower.includes('dağ manzara') || titleLower.includes('dağ manzara'))
        detectedTags.push('mountain-view');
    if (descLower.includes('lüks') || titleLower.includes('lüks'))
        detectedTags.push('luxury');
    if (specs?.buildingAge === 0)
        detectedTags.push('new-building');
    if (specs?.heatingType?.toLowerCase().includes('merkezi'))
        detectedTags.push('central-heating');
    if (descLower.includes('eşyalı'))
        detectedTags.push('furnished');
    if (descLower.includes('evcil hayvan'))
        detectedTags.push('pet-friendly');
    if (descLower.includes('yatırım') || titleLower.includes('yatırım'))
        detectedTags.push('investment');
    const completenessScore = Math.min(100, Math.round(weightedScore));
    let descriptionQualityScore = 0;
    if (descLen >= 200) {
        const lengthScore = 50;
        const richnessScore = Math.min(30, Math.round(((descLen - 200) / 1800) * 30));
        const foundKeywords = REALESTATE_KEYWORDS.filter((kw) => descLower.includes(kw));
        const keywordScore = Math.min(20, foundKeywords.length * 2);
        descriptionQualityScore = Math.min(100, lengthScore + richnessScore + keywordScore);
    }
    else if (descLen >= 50) {
        descriptionQualityScore = 30;
    }
    return {
        completenessScore,
        descriptionQualityScore,
        missingFields,
        warnings,
        detectedTags,
    };
}
//# sourceMappingURL=deterministic-scorer.js.map