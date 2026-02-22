# AREP MarketingAssetPack Artifact Specification

## JSON Schema (Strict)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://arep/schemas/marketing.asset.pack.v1.json",
  "title": "AREP MarketingAssetPack v1",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "listingContext",
    "seo",
    "socialCaptionsTr",
    "whatsappBroadcastTr",
    "hashtagsTr",
    "highlights"
  ],
  "properties": {
    "listingContext": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "listingId",
        "category",
        "priceTry",
        "location",
        "facts"
      ],
      "properties": {
        "listingId": {
          "type": "string",
          "minLength": 1,
          "maxLength": 100
        },
        "category": {
          "type": "string",
          "enum": ["RENT", "SALE"]
        },
        "priceTry": {
          "type": "number",
          "exclusiveMinimum": 0
        },
        "location": {
          "type": "object",
          "additionalProperties": false,
          "required": ["district", "neighborhood"],
          "properties": {
            "district": {
              "type": "string",
              "minLength": 1,
              "maxLength": 100
            },
            "neighborhood": {
              "type": "string",
              "minLength": 1,
              "maxLength": 100
            }
          }
        },
        "facts": {
          "type": "array",
          "minItems": 1,
          "items": {
            "type": "string",
            "minLength": 2,
            "maxLength": 200
          },
          "uniqueItems": true
        }
      }
    },
    "seo": {
      "type": "object",
      "additionalProperties": false,
      "required": ["titleEn", "titleTr", "metaDescriptionEn", "metaDescriptionTr"],
      "properties": {
        "titleEn": {
          "type": "string",
          "minLength": 10,
          "maxLength": 70
        },
        "titleTr": {
          "type": "string",
          "minLength": 10,
          "maxLength": 70
        },
        "metaDescriptionEn": {
          "type": "string",
          "minLength": 50,
          "maxLength": 160
        },
        "metaDescriptionTr": {
          "type": "string",
          "minLength": 50,
          "maxLength": 160
        }
      }
    },
    "socialCaptionsTr": {
      "type": "array",
      "minItems": 3,
      "maxItems": 3,
      "items": {
        "type": "string",
        "minLength": 20,
        "maxLength": 140
      },
      "uniqueItems": true
    },
    "whatsappBroadcastTr": {
      "type": "string",
      "minLength": 40,
      "maxLength": 280
    },
    "hashtagsTr": {
      "type": "array",
      "minItems": 5,
      "maxItems": 5,
      "items": {
        "type": "string",
        "pattern": "^#[A-Za-zÇĞİÖŞÜçğıöşü0-9_]{2,30}$"
      },
      "uniqueItems": true
    },
    "highlights": {
      "type": "array",
      "minItems": 1,
      "maxItems": 10,
      "items": {
        "type": "string",
        "minLength": 3,
        "maxLength": 160
      },
      "uniqueItems": true
    }
  }
}
```

## Validation Rules (Normative)

1. **No invention rule (hard fail):**
   - Every claim in `seo.*`, `socialCaptionsTr[*]`, `whatsappBroadcastTr`, and `highlights[*]` MUST be derivable from `listingContext.facts`, `listingContext.category`, `listingContext.priceTry`, `listingContext.location.district`, or `listingContext.location.neighborhood`.
   - If any claim is not grounded in provided inputs, validation MUST fail with `UNSUPPORTED_CLAIM`.

2. **Location inclusion rule (hard fail):**
   - The exact `listingContext.location.district` and exact `listingContext.location.neighborhood` MUST both appear at least once across:
     - `seo.titleTr` or `seo.metaDescriptionTr`, and
     - at least one element of `socialCaptionsTr` or `whatsappBroadcastTr`.
   - Failure code: `LOCATION_MISSING`.

3. **Category reflection rule (hard fail):**
   - Content MUST explicitly reflect listing intent:
     - `RENT` => include Turkish equivalent intent token (`kiralık` or `kiralama`) in at least 2 of: `seo.titleTr`, `socialCaptionsTr[*]`, `whatsappBroadcastTr`.
     - `SALE` => include Turkish equivalent intent token (`satılık` or `satış`) in at least 2 of: `seo.titleTr`, `socialCaptionsTr[*]`, `whatsappBroadcastTr`.
   - Failure code: `CATEGORY_NOT_REFLECTED`.

4. **TRY price reflection rule (hard fail):**
   - `priceTry` MUST be represented in Turkish-facing marketing texts (`seo.titleTr` or `seo.metaDescriptionTr` or `whatsappBroadcastTr`) with TRY currency marker (`₺`, `TL`, or `TRY`).
   - Numeric value must match `listingContext.priceTry` after locale normalization (thousand separators/decimal separators allowed).
   - Failure code: `PRICE_TRY_MISMATCH`.

5. **Language rule (hard fail):**
   - `seo.titleEn` and `seo.metaDescriptionEn` MUST be English.
   - `seo.titleTr`, `seo.metaDescriptionTr`, `socialCaptionsTr[*]`, `whatsappBroadcastTr`, `hashtagsTr[*]`, `highlights[*]` MUST be Turkish.
   - Failure code: `LANGUAGE_CONSTRAINT_VIOLATION`.

6. **Hashtag rule:**
   - Exactly 5 hashtags, unique, each beginning with `#` and matching schema regex.
   - At least 1 hashtag MUST encode district or neighborhood token (normalized, diacritics-insensitive).
   - Failure code: `HASHTAG_POLICY_VIOLATION`.

7. **Highlights facts-only rule (hard fail):**
   - Each `highlights[*]` item MUST be a direct fact statement from `listingContext.facts` or a direct composition of:
     - category (`RENT|SALE`),
     - exact TRY price,
     - district/neighborhood.
   - No superlatives/comparatives allowed (e.g., “en iyi”, “mükemmel”, “kaçırılmaz”) unless present verbatim in `facts`.
   - Failure code: `HIGHLIGHTS_NOT_FACTUAL`.

8. **Consistency rule:**
   - No field may contradict another field (e.g., RENT in one place, SALE in another; different district names; mismatched price).
   - Failure code: `INTERNAL_INCONSISTENCY`.

9. **Safety/format rule:**
   - Output MUST validate against schema with `additionalProperties=false` at all levels.
   - No markdown, HTML tags, or URLs unless URL exists in `facts`.
   - Failure code: `FORMAT_VIOLATION`.
