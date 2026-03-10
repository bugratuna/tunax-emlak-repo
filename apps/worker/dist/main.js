"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const worker_module_1 = require("./worker.module");
const REQUIRED_ENV = [
    'REDIS_URL',
    'INTERNAL_API_KEY',
    'INTERNAL_API_BASE_URL',
];
function validateWorkerEnv() {
    const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
    if (missing.length > 0) {
        console.error(`\n[WORKER] Missing required environment variables:\n${missing.join('\n')}\n`);
        process.exit(1);
    }
}
async function bootstrap() {
    validateWorkerEnv();
    const app = await core_1.NestFactory.createApplicationContext(worker_module_1.WorkerModule, {
        logger: ['log', 'warn', 'error'],
    });
    app.enableShutdownHooks();
    console.log('[WORKER] Automation worker started — queue: automation');
}
bootstrap();
//# sourceMappingURL=main.js.map