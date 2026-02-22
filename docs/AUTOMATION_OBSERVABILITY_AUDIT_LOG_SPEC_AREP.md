# AREP Automation Observability & Audit Log Specification

## 1) Scope
Defines observability, structured logging, audit trail, and alerting requirements for AREP automation workflows across API, worker, and related automation services.

This specification covers:
- event/job log contracts
- moderation decision audit trail
- operational alerting thresholds (failures and retry storms)

---

## 2) Structured Log Policy (Global)

1. All automation logs MUST be structured JSON.
2. All timestamps MUST be UTC ISO-8601.
3. Required identity fields MUST be present for every event/job log (see Section 3).
4. Logs MUST be immutable once written; corrections are appended as new entries.
5. PII and secrets MUST follow redaction policy from environment/secrets spec.
6. Correlation fields MUST propagate across synchronous and asynchronous boundaries.

---

## 3) Required Log Fields for Each Event/Job

The following fields are mandatory for every event processing record and job execution record.

| Field | Type | Required | Description |
|---|---|---|---|
| `timestamp` | string(date-time) | Yes | Event/job log emission time in UTC. |
| `service` | string | Yes | Emitter service name (`api`, `worker`, etc.). |
| `environment` | enum | Yes | `staging` or `production`. |
| `eventName` | string | Yes | Canonical event/job name (e.g., `LEAD_CREATED`, `moderation.process`). |
| `correlationId` | string | Yes | Cross-service trace key for request-to-job chain. |
| `idempotencyKey` | string | Yes | Key used for dedupe/idempotent execution. |
| `status` | enum | Yes | `started`, `success`, `retrying`, `failed`, `dead_lettered`, `skipped_duplicate`. |
| `durationMs` | integer | Yes | Total execution duration in ms for current attempt. |
| `attempt` | integer | Yes | Current attempt number (>=1). |
| `maxAttempts` | integer | Yes | Max allowed attempts for this execution. |
| `listingId` | string\|null | Cond. | Required when context involves listing. |
| `leadId` | string\|null | Cond. | Required when context involves lead. |
| `jobId` | string\|null | Cond. | Required for queued/background jobs. |
| `queueName` | string\|null | Cond. | Required for queue-backed jobs. |
| `errorCode` | string\|null | No | Machine-readable failure code. |
| `errorMessage` | string\|null | No | Sanitized human-readable error detail. |

### 3.1 Conditional Identity Rule
- At least one of `listingId` or `leadId` MUST be non-null.
- If both are applicable, both MUST be logged.

### 3.2 Status Semantics
- `started`: attempt has begun.
- `success`: attempt completed and side effects committed.
- `retrying`: attempt failed with retryable reason; next attempt scheduled.
- `failed`: attempt failed terminally without DLQ handoff.
- `dead_lettered`: payload moved to DLQ.
- `skipped_duplicate`: duplicate idempotency key with identical payload; no-op.

---

## 4) Event/Job Lifecycle Logging Requirements

For each processed event/job, the system MUST emit at least:
1. one `started` log
2. one terminal log (`success` or `failed` or `dead_lettered` or `skipped_duplicate`)

If retries occur, each failed attempt MUST emit:
- a failure context log with `status=retrying`
- scheduled backoff delay metadata via `nextRetryAt` (recommended)

### 4.1 Recommended Additional Fields
- `traceId`, `spanId`
- `sourceEventId`
- `payloadHash`
- `nextRetryAt`
- `dependency` (e.g., `crm`, `moderation-engine`)

---

## 5) Audit Trail Requirements for Moderation Decisions

Applies to listing moderation decisions (approve/reject/needs_changes).

### 5.1 Mandatory Audit Fields
| Field | Type | Required | Description |
|---|---|---|---|
| `auditId` | string | Yes | Unique immutable audit record ID. |
| `timestamp` | string(date-time) | Yes | Decision timestamp (UTC). |
| `listingId` | string | Yes | Listing under moderation. |
| `reportId` | string | Yes | Moderation report identifier used for decision. |
| `reportVersion` | string | Yes | Exact report/schema version evaluated. |
| `decision` | enum | Yes | `approved`, `rejected`, `needs_changes`. |
| `decisionReason` | string | Yes | Human-readable justification. |
| `warnings` | array(string) | Yes | Warning codes present at decision time (empty array allowed). |
| `riskLevel` | enum | Yes | `low`, `medium`, `high`, `critical`. |
| `decidedBy.actorType` | enum | Yes | `admin` or `system`. |
| `decidedBy.actorId` | string | Yes | User/service ID who made decision. |
| `policyVersion` | string | Yes | Moderation policy version applied. |
| `previousDecisionId` | string\|null | No | Link for reversals/overrides. |
| `overrideFlag` | boolean | Yes | Indicates decision override occurred. |
| `overrideReason` | string\|null | Cond. | Required when `overrideFlag=true`. |

### 5.2 Explicit Decision Accountability Requirements
1. Audit trail MUST capture **who approved**:
   - `decidedBy.actorType`
   - `decidedBy.actorId`
2. Audit trail MUST capture **which report version**:
   - `reportVersion`
3. Audit trail MUST capture **what warnings existed**:
   - `warnings[]` with stable warning codes
4. Decision updates MUST not overwrite old records; they MUST append a new record linked by `previousDecisionId`.

### 5.3 Integrity & Retention
- Audit records MUST be write-once (append-only).
- Retention minimum: 24 months.
- Access to audit records MUST be role-restricted and access-audited.

---

## 6) Alerting Thresholds

Alerting is mandatory for production; optional-but-recommended for staging.

## 6.1 Job Failure Alerts
| Condition | Threshold | Window | Severity | Action |
|---|---|---|---|---|
| Single critical pipeline job failure | >=1 | immediate | High | Notify on-call immediately. |
| General automation failure rate | >5% failed terminal jobs | 15 min rolling | High | Trigger incident investigation. |
| Sustained elevated failure rate | >2% failed terminal jobs | 60 min rolling | Medium | Notify operations + product owner. |
| DLQ insertions | >=10 messages | 10 min rolling | High | Open incident and triage queue. |

## 6.2 Retry Storm Alerts
| Condition | Threshold | Window | Severity | Action |
|---|---|---|---|---|
| Retry ratio spike | retries / total attempts > 0.25 | 10 min rolling | High | Check downstream dependency health. |
| Consecutive retries per job | >=4 attempts on same jobId | immediate | Medium | Flag potential poison message. |
| System-wide retry burst | >=100 retry events | 5 min rolling | Critical | Page on-call + throttle non-critical jobs. |
| Same error concentration | >=30 retries with same `errorCode` | 10 min rolling | High | Trigger targeted runbook for dependency/circuit breaker. |

### 6.3 Alert Payload Requirements
Every alert MUST include:
- `environment`
- `service`
- `eventName`/`jobType`
- affected `listingId` and/or `leadId` when available
- `correlationId`
- `idempotencyKey`
- `errorCode` (if any)
- count metrics and evaluation window
- dashboard/runbook link

---

## 7) Dashboards & SLO Metrics (Minimum)

Required metrics:
- `automation_jobs_total`
- `automation_jobs_success_total`
- `automation_jobs_failed_total`
- `automation_jobs_retry_total`
- `automation_jobs_dead_lettered_total`
- `automation_job_duration_ms` (histogram)
- `automation_idempotency_duplicates_total`

Required dimensions:
- `service`
- `environment`
- `eventName`
- `status`

Minimum SLO targets (production):
- Success rate >= 98% (excluding `skipped_duplicate`)
- P95 `durationMs` within service-defined latency budgets
- DLQ rate < 1% of total jobs per day

---

## 8) Compliance Checklist
- [ ] All event/job logs include required fields from Section 3.
- [ ] Correlation and idempotency fields propagate end-to-end.
- [ ] Moderation decisions recorded with actor, report version, and warnings.
- [ ] Append-only audit storage enabled.
- [ ] Production alert rules configured to Section 6 thresholds.
- [ ] Dashboard metrics and dimensions configured per Section 7.
- [ ] Periodic audit log access review is enabled.
