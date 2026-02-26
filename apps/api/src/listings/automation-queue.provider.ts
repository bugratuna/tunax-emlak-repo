import { Provider } from '@nestjs/common';
import { Queue } from 'bullmq';

export const AUTOMATION_QUEUE = 'AUTOMATION_QUEUE';

export const AutomationQueueProvider: Provider = {
  provide: AUTOMATION_QUEUE,
  useFactory: () => {
    const redisUrl = process.env.REDIS_URL!;
    const url = new URL(redisUrl);
    return new Queue('automation', {
      connection: {
        host: url.hostname,
        port: parseInt(url.port || '6379', 10),
      },
    });
  },
};
