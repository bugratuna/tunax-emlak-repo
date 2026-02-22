# AREP Lead Scoring System Specification (Deterministic, Rule-Based)

## 1) Purpose
Compute a deterministic lead score (`0-100`) for real estate inquiries and attach transparent `reasonCodes`.

---

## 2) Inputs
- `listingPrice` (number, required, > 0)
- `messageLength` (integer, required, character count)
- `contactChannel` (enum, required): `call | whatsapp | form`
- `preferredTime` (string, optional)
- `utmSource` (string, optional)
- `repeatInquiryFrequency7d` (integer, required, same phone+listing in trailing 7 days)
- `budgetMentionAmount` (number, optional, parsed from inquiry text)
- `urgencyKeywords` (array, optional): detect exact tokens/phrases `today`, `this week`
- `locationMentionDistrict` (string, optional, district extracted from inquiry text)

---

## 3) Output
```json
{
  "score": "integer (0-100)",
  "bucket": "HOT | WARM | COLD",
  "reasonCodes": ["string"]
}
```

---

## 4) Scoring Formula

### 4.1 Initialization
- `baseScore = 50`
- `score = baseScore + sum(componentPoints)`
- Clamp final score: `score = min(100, max(0, round(score)))`

### 4.2 Component Rules

#### A) Inquiry Message Length (max +15 / min -12)
Use `messageLength` in chars:
- `0-19` => `-12` (`MSG_TOO_SHORT`)
- `20-59` => `-4` (`MSG_SHORT`)
- `60-249` => `+8` (`MSG_GOOD_DETAIL`)
- `250-800` => `+15` (`MSG_HIGH_DETAIL`)
- `801+` => `+6` (`MSG_VERY_LONG`)

#### B) Contact Channel (max +12 / min +3)
- `call` => `+12` (`CHANNEL_CALL_HIGH_INTENT`)
- `whatsapp` => `+9` (`CHANNEL_WHATSAPP_HIGH_INTENT`)
- `form` => `+3` (`CHANNEL_FORM_STANDARD`)

#### C) Preferred Time Presence & Specificity (max +6 / min -2)
If `preferredTime` absent/empty => `-2` (`PREFERRED_TIME_MISSING`)
If present:
- contains specific slot/hour/day (e.g., regex for `\b\d{1,2}(:\d{2})?\b` OR weekday token) => `+6` (`PREFERRED_TIME_SPECIFIC`)
- otherwise generic text => `+2` (`PREFERRED_TIME_PRESENT_GENERIC`)

#### D) UTM Source Quality (max +8 / min 0)
If `utmSource` absent => `0` (`UTM_MISSING`)
If present (case-insensitive):
- in `{google, google_ads, meta_ads, facebook_ads}` => `+8` (`UTM_PAID_PERFORMANCE`)
- in `{instagram, facebook, tiktok, youtube}` => `+5` (`UTM_SOCIAL`)
- in `{organic, seo, direct}` => `+4` (`UTM_ORGANIC_DIRECT`)
- any other non-empty => `+2` (`UTM_OTHER_TRACKED`)

#### E) Repeat Inquiry Frequency 7d (max +6 / min -20)
Using `repeatInquiryFrequency7d` for same phone + same listing:
- `0` => `+6` (`FIRST_CONTACT`)
- `1` => `+2` (`SECOND_CONTACT`)
- `2-3` => `-6` (`REPEAT_CONTACT_HIGH`)
- `4+` => `-20` (`REPEAT_CONTACT_SPAM_RISK`)

#### F) Budget Mention Alignment to Listing Price (max +20 / min -18)
If `budgetMentionAmount` missing => `0` (`BUDGET_NOT_PROVIDED`)
If present, compute ratio: `r = budgetMentionAmount / listingPrice`
- `0.90 <= r <= 1.10` => `+20` (`BUDGET_ALIGNED_STRONG`)
- `0.75 <= r < 0.90` OR `1.10 < r <= 1.25` => `+10` (`BUDGET_ALIGNED_MODERATE`)
- `0.60 <= r < 0.75` OR `1.25 < r <= 1.50` => `-4` (`BUDGET_WEAK_ALIGNMENT`)
- `r < 0.60` OR `r > 1.50` => `-18` (`BUDGET_MISMATCH_HIGH`)

#### G) Urgency Keywords (max +14 / min 0)
Normalize text to lowercase and match whole phrase:
- contains `today` => `+8` (`URGENCY_TODAY`)
- contains `this week` => `+6` (`URGENCY_THIS_WEEK`)
- if both present, add both (`+14` total)
- none => `0` (`URGENCY_NOT_EXPRESSED`)

#### H) Location Mention (district) Relevance (max +10 / min -3)
If `locationMentionDistrict` missing => `-3` (`LOCATION_NOT_MENTIONED`)
If present:
- equals listing district (case-insensitive exact) => `+10` (`LOCATION_EXACT_MATCH`)
- valid Antalya district but not listing district => `+3` (`LOCATION_DIFFERENT_DISTRICT`)
- unrecognized/invalid district token => `-2` (`LOCATION_UNRECOGNIZED`)

---

## 5) Classification Thresholds
Apply after final clamp:
- `HOT`: `score >= 75`
- `WARM`: `45 <= score <= 74`
- `COLD`: `score <= 44`

---

## 6) Determinism Rules
1. No probabilistic/ML components allowed.
2. Same normalized input MUST always yield same score and reason codes.
3. Keyword matching is case-insensitive and punctuation-insensitive.
4. Missing optional fields must use explicit default rule paths above.
5. If multiple rules in a component could match, use first match in component order.
6. `reasonCodes` MUST include every applied component outcome (including neutral/missing outcomes).

---

## 7) Reason Code Catalog
- Message: `MSG_TOO_SHORT`, `MSG_SHORT`, `MSG_GOOD_DETAIL`, `MSG_HIGH_DETAIL`, `MSG_VERY_LONG`
- Channel: `CHANNEL_CALL_HIGH_INTENT`, `CHANNEL_WHATSAPP_HIGH_INTENT`, `CHANNEL_FORM_STANDARD`
- Preferred time: `PREFERRED_TIME_MISSING`, `PREFERRED_TIME_SPECIFIC`, `PREFERRED_TIME_PRESENT_GENERIC`
- UTM: `UTM_MISSING`, `UTM_PAID_PERFORMANCE`, `UTM_SOCIAL`, `UTM_ORGANIC_DIRECT`, `UTM_OTHER_TRACKED`
- Repeat frequency: `FIRST_CONTACT`, `SECOND_CONTACT`, `REPEAT_CONTACT_HIGH`, `REPEAT_CONTACT_SPAM_RISK`
- Budget: `BUDGET_NOT_PROVIDED`, `BUDGET_ALIGNED_STRONG`, `BUDGET_ALIGNED_MODERATE`, `BUDGET_WEAK_ALIGNMENT`, `BUDGET_MISMATCH_HIGH`
- Urgency: `URGENCY_TODAY`, `URGENCY_THIS_WEEK`, `URGENCY_NOT_EXPRESSED`
- Location: `LOCATION_NOT_MENTIONED`, `LOCATION_EXACT_MATCH`, `LOCATION_DIFFERENT_DISTRICT`, `LOCATION_UNRECOGNIZED`

---

## 8) Reference Pseudocode
```text
score = 50
reasonCodes = []

score += points_message_length(messageLength); reasonCodes += code_message_length
score += points_channel(contactChannel); reasonCodes += code_channel
score += points_preferred_time(preferredTime); reasonCodes += code_preferred_time
score += points_utm(utmSource); reasonCodes += code_utm
score += points_repeat(repeatInquiryFrequency7d); reasonCodes += code_repeat
score += points_budget(budgetMentionAmount, listingPrice); reasonCodes += code_budget
score += points_urgency(urgencyKeywords); reasonCodes += code_urgency (one or two)
score += points_location(locationMentionDistrict, listingDistrict); reasonCodes += code_location

score = round(score)
if score < 0 then score = 0
if score > 100 then score = 100

bucket = HOT if score >= 75
      else WARM if score >= 45
      else COLD
```
