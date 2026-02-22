# Lead Event Specification for AREP

## Schemas

### Shared Envelope Schema (`lead.event.envelope.v1`)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://arep/schemas/lead.event.envelope.v1.json",
  "title": "AREP Lead Event Envelope v1",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "eventId",
    "eventType",
    "eventVersion",
    "occurredAt",
    "producer",
    "idempotencyKey",
    "payload"
  ],
  "properties": {
    "eventId": {
      "type": "string",
      "format": "uuid"
    },
    "eventType": {
      "type": "string",
      "enum": ["LEAD_CREATED", "LEAD_UPDATED", "LEAD_ASSIGNED"]
    },
    "eventVersion": {
      "type": "string",
      "const": "1.0.0"
    },
    "occurredAt": {
      "type": "string",
      "format": "date-time"
    },
    "producer": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
    "correlationId": {
      "type": "string",
      "format": "uuid"
    },
    "causationId": {
      "type": ["string", "null"],
      "format": "uuid"
    },
    "idempotencyKey": {
      "type": "string",
      "pattern": "^[A-Za-z0-9:_\\-]{16,200}$"
    },
    "payload": {
      "type": "object"
    }
  },
  "allOf": [
    {
      "if": {
        "properties": {
          "eventType": { "const": "LEAD_CREATED" }
        }
      },
      "then": {
        "properties": {
          "payload": { "$ref": "https://arep/schemas/lead.created.payload.v1.json" }
        }
      }
    },
    {
      "if": {
        "properties": {
          "eventType": { "const": "LEAD_UPDATED" }
        }
      },
      "then": {
        "properties": {
          "payload": { "$ref": "https://arep/schemas/lead.updated.payload.v1.json" }
        }
      }
    },
    {
      "if": {
        "properties": {
          "eventType": { "const": "LEAD_ASSIGNED" }
        }
      },
      "then": {
        "properties": {
          "payload": { "$ref": "https://arep/schemas/lead.assigned.payload.v1.json" }
        }
      }
    }
  ]
}
```

### Base Lead Payload Schema (`lead.base.payload.v1`)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://arep/schemas/lead.base.payload.v1.json",
  "title": "AREP Lead Base Payload v1",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "leadId",
    "listingId",
    "contactChannel",
    "name",
    "phone",
    "message",
    "preferredTime",
    "createdAt"
  ],
  "properties": {
    "leadId": {
      "type": "string",
      "format": "uuid"
    },
    "listingId": {
      "type": "string",
      "format": "uuid"
    },
    "contactChannel": {
      "type": "string",
      "enum": ["call", "whatsapp", "form"]
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 120
    },
    "phone": {
      "type": "string",
      "pattern": "^\\+[1-9]\\d{7,14}$"
    },
    "message": {
      "type": "string",
      "minLength": 1,
      "maxLength": 5000
    },
    "preferredTime": {
      "type": "string",
      "maxLength": 100
    },
    "utmSource": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    }
  }
}
```

### `LEAD_CREATED` Payload Schema (`lead.created.payload.v1`)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://arep/schemas/lead.created.payload.v1.json",
  "title": "AREP LEAD_CREATED Payload v1",
  "allOf": [
    { "$ref": "https://arep/schemas/lead.base.payload.v1.json" },
    {
      "type": "object",
      "additionalProperties": false,
      "required": ["status", "source"],
      "properties": {
        "status": {
          "type": "string",
          "const": "NEW"
        },
        "source": {
          "type": "string",
          "enum": ["web", "mobile", "api", "import"]
        }
      }
    }
  ]
}
```

### `LEAD_UPDATED` Payload Schema (`lead.updated.payload.v1`)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://arep/schemas/lead.updated.payload.v1.json",
  "title": "AREP LEAD_UPDATED Payload v1",
  "allOf": [
    { "$ref": "https://arep/schemas/lead.base.payload.v1.json" },
    {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "updatedAt",
        "updatedBy",
        "changeSet"
      ],
      "properties": {
        "updatedAt": {
          "type": "string",
          "format": "date-time"
        },
        "updatedBy": {
          "type": "object",
          "additionalProperties": false,
          "required": ["actorType", "actorId"],
          "properties": {
            "actorType": {
              "type": "string",
              "enum": ["admin", "system"]
            },
            "actorId": {
              "type": "string",
              "format": "uuid"
            }
          }
        },
        "changeSet": {
          "type": "object",
          "additionalProperties": false,
          "required": ["changedFields"],
          "properties": {
            "changedFields": {
              "type": "array",
              "minItems": 1,
              "items": {
                "type": "string",
                "enum": ["status", "adminNotes"]
              },
              "uniqueItems": true
            },
            "status": {
              "type": "object",
              "additionalProperties": false,
              "required": ["from", "to"],
              "properties": {
                "from": {
                  "type": "string",
                  "enum": ["NEW", "OPEN", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CLOSED"]
                },
                "to": {
                  "type": "string",
                  "enum": ["NEW", "OPEN", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CLOSED"]
                }
              }
            },
            "adminNotes": {
              "type": "object",
              "additionalProperties": false,
              "required": ["value"],
              "properties": {
                "value": {
                  "type": "string",
                  "minLength": 1,
                  "maxLength": 4000
                }
              }
            }
          },
          "allOf": [
            {
              "if": {
                "properties": {
                  "changedFields": {
                    "contains": { "const": "status" }
                  }
                }
              },
              "then": { "required": ["status"] }
            },
            {
              "if": {
                "properties": {
                  "changedFields": {
                    "contains": { "const": "adminNotes" }
                  }
                }
              },
              "then": { "required": ["adminNotes"] }
            }
          ]
        }
      }
    }
  ]
}
```

### `LEAD_ASSIGNED` Payload Schema (`lead.assigned.payload.v1`)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://arep/schemas/lead.assigned.payload.v1.json",
  "title": "AREP LEAD_ASSIGNED Payload v1",
  "allOf": [
    { "$ref": "https://arep/schemas/lead.base.payload.v1.json" },
    {
      "type": "object",
      "additionalProperties": false,
      "required": ["assignedAt", "assignedBy", "consultant"],
      "properties": {
        "assignedAt": {
          "type": "string",
          "format": "date-time"
        },
        "assignedBy": {
          "type": "object",
          "additionalProperties": false,
          "required": ["actorType", "actorId"],
          "properties": {
            "actorType": {
              "type": "string",
              "enum": ["admin", "system"]
            },
            "actorId": {
              "type": "string",
              "format": "uuid"
            }
          }
        },
        "consultant": {
          "type": "object",
          "additionalProperties": false,
          "required": ["consultantId"],
          "properties": {
            "consultantId": {
              "type": "string",
              "format": "uuid"
            }
          }
        }
      }
    }
  ]
}
```

## Policies

### Idempotency Key Policy

```yaml
idempotency:
  required: true
  location: "event.idempotencyKey"
  ttlHours: 72
  uniquenessScope: "eventType + aggregateId(leadId)"
  canonicalFormat: "<eventType>:<leadId>:<revision-or-effective-timestamp>"
  producerRules:
    - "Producer MUST generate deterministic key for retries of same logical mutation."
    - "Producer MUST change key when any business-meaningful field changes."
  consumerRules:
    - "Consumer MUST upsert dedupe record before side effects."
    - "If duplicate key with byte-identical payload: ACK and no-op."
    - "If duplicate key with different payload: reject with conflict and audit."
```

### PII Handling (Masking & Logging) Policy

```yaml
pii:
  classifiedFields:
    direct:
      - "payload.name"
      - "payload.phone"
      - "payload.message"
      - "payload.preferredTime"
    conditional:
      - "payload.utmSource"
  logging:
    defaultMode: "deny-raw-pii"
    allowedRawFields:
      - "payload.listingId"
      - "payload.contactChannel"
      - "payload.createdAt"
      - "payload.leadId"
    maskedFields:
      payload.name: "first character + ***"
      payload.phone: "show country code + last 2 digits; mask middle"
      payload.message: "store length + SHA-256 hash only"
      payload.preferredTime: "redact to coarse bucket (morning/afternoon/evening)"
      payload.utmSource: "log only when present; truncate to 100 chars; strip query params"
  storage:
    encryptionAtRest: true
    transportTlsMinVersion: "1.2"
  access:
    leastPrivilege: true
    auditReadAccess: true
  retention:
    rawPiiDays: 365
    maskedLogsDays: 730
  operationalRules:
    - "Never emit raw phone/message into app logs, traces, or metrics labels."
    - "Never use name/phone/message in idempotency key generation."
    - "Support subject erasure by leadId tombstone workflow."
```
