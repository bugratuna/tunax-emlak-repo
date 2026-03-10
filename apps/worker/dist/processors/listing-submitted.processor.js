"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ListingSubmittedProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListingSubmittedProcessor = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("bullmq");
const deterministic_scorer_1 = require("../scoring/deterministic-scorer");
let ListingSubmittedProcessor = ListingSubmittedProcessor_1 = class ListingSubmittedProcessor {
    constructor() {
        this.logger = new common_1.Logger(ListingSubmittedProcessor_1.name);
    }
    onModuleInit() {
        const redisUrl = process.env.REDIS_URL;
        const parsedUrl = new URL(redisUrl);
        const internalApiKey = process.env.INTERNAL_API_KEY;
        const apiBaseUrl = process.env.INTERNAL_API_BASE_URL;
        const worker = new bullmq_1.Worker('automation', async (job) => {
            if (job.name !== 'LISTING_SUBMITTED') {
                this.logger.log(`Ignoring job "${job.name}" — not LISTING_SUBMITTED`);
                return;
            }
            const data = job.data;
            const { listingId } = data;
            const startedAt = Date.now();
            const attempt = job.attemptsMade + 1;
            const maxAttempts = job.opts?.attempts ?? 3;
            const baseLog = {
                service: 'worker',
                environment: process.env.NODE_ENV ?? 'staging',
                eventName: 'LISTING_SUBMITTED',
                correlationId: job.id ?? listingId,
                idempotencyKey: listingId,
                attempt,
                maxAttempts,
                listingId,
                leadId: null,
                jobId: job.id ?? null,
                queueName: 'automation',
            };
            this.logger.log(JSON.stringify({
                ...baseLog,
                timestamp: new Date().toISOString(),
                status: 'started',
                durationMs: 0,
                errorCode: null,
                errorMessage: null,
            }));
            this.logger.log(`Processing LISTING_SUBMITTED job ${job.id} for listing ${listingId}`);
            const deterministicScores = (0, deterministic_scorer_1.score)(data);
            this.logger.log(`Scores computed for listing ${listingId}: ` +
                `completeness=${deterministicScores.completenessScore}, ` +
                `descriptionQuality=${deterministicScores.descriptionQualityScore}, ` +
                `warnings=${deterministicScores.warnings.length}, ` +
                `detectedTags=${deterministicScores.detectedTags.length}`);
            const endpoint = `${apiBaseUrl}/api/admin/moderation/${listingId}/score`;
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-internal-api-key': internalApiKey,
                },
                body: JSON.stringify({ deterministicScores }),
            });
            if (!response.ok) {
                const body = await response.text();
                const errorMessage = `Score endpoint returned ${response.status}: ${body}`;
                this.logger.error(JSON.stringify({
                    ...baseLog,
                    timestamp: new Date().toISOString(),
                    status: 'retrying',
                    durationMs: Date.now() - startedAt,
                    errorCode: 'SCORE_API_ERROR',
                    errorMessage,
                }));
                throw new Error(`Score endpoint returned ${response.status} for listing ${listingId}`);
            }
            this.logger.log(`ScoringReport stored for listing ${listingId} (HTTP ${response.status})`);
            const enrichEndpoint = `${apiBaseUrl}/api/admin/moderation/${listingId}/enrich`;
            const enrichResponse = await fetch(enrichEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-internal-api-key': internalApiKey,
                },
            });
            if (!enrichResponse.ok) {
                const body = await enrichResponse.text();
                const errorMessage = `Enrich endpoint returned ${enrichResponse.status}: ${body}`;
                this.logger.error(JSON.stringify({
                    ...baseLog,
                    timestamp: new Date().toISOString(),
                    status: 'retrying',
                    durationMs: Date.now() - startedAt,
                    errorCode: 'ENRICH_API_ERROR',
                    errorMessage,
                }));
                throw new Error(`Enrich endpoint returned ${enrichResponse.status} for listing ${listingId}`);
            }
            this.logger.log(`Enrichment scaffold created for listing ${listingId} (HTTP ${enrichResponse.status})`);
            this.logger.log(JSON.stringify({
                ...baseLog,
                timestamp: new Date().toISOString(),
                status: 'success',
                durationMs: Date.now() - startedAt,
                errorCode: null,
                errorMessage: null,
            }));
        }, {
            connection: {
                host: parsedUrl.hostname,
                port: parseInt(parsedUrl.port || '6379', 10),
            },
            concurrency: parseInt(process.env.WORKER_CONCURRENCY ?? '1', 10),
        });
        worker.on('failed', (job, err) => {
            this.logger.error(JSON.stringify({
                timestamp: new Date().toISOString(),
                service: 'worker',
                environment: process.env.NODE_ENV ?? 'staging',
                eventName: 'LISTING_SUBMITTED',
                correlationId: job?.id ?? null,
                idempotencyKey: job?.data?.listingId ?? null,
                status: 'failed',
                durationMs: 0,
                attempt: job?.attemptsMade ?? 0,
                maxAttempts: job?.opts?.attempts ?? 3,
                listingId: job?.data?.listingId ?? null,
                leadId: null,
                jobId: job?.id ?? null,
                queueName: 'automation',
                errorCode: 'JOB_TERMINAL_FAILURE',
                errorMessage: err.message,
            }));
        });
        this.logger.log('ListingSubmittedProcessor ready — listening on queue: automation');
    }
};
exports.ListingSubmittedProcessor = ListingSubmittedProcessor;
exports.ListingSubmittedProcessor = ListingSubmittedProcessor = ListingSubmittedProcessor_1 = __decorate([
    (0, common_1.Injectable)()
], ListingSubmittedProcessor);
//# sourceMappingURL=listing-submitted.processor.js.map