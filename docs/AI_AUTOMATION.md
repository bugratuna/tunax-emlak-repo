## Automation Events (MVP)

### EVENT: LISTING_SUBMITTED
Trigger: Consultant submits listing for admin review
Outputs:
- moderationReport (JSON)
- suggestedTags (array)
- seoTitleSuggestion (string)
- warnings (array)
- completenessScore (0-100)
Action:
- Save report
- Notify admin queue

### EVENT: LISTING_UPDATED_AFTER_CHANGES
Trigger: Consultant edits after NEEDS_CHANGES and resubmits
Outputs:
- delta summary
- warnings resolved/remaining
Action:
- Save new report
- Notify admin queue
