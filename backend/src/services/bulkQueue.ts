import { Queue } from 'bullmq';
import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Setup connection options for BullMQ
export const connectionOptions = {
  host: new URL(redisUrl).hostname || 'localhost',
  port: parseInt(new URL(redisUrl).port || '6379'),
  password: new URL(redisUrl).password || undefined,
};

// Create bulk issuance queue
export let bulkQueue: any;

if (process.env.NODE_ENV === 'test') {
  bulkQueue = {
    add: async (name: string, data: any) => {
      console.log(`[Test Mode] Mock bulkQueue.add called with:`, name, data);
      return { id: 'mock-job-id' };
    },
    on: () => {},
    close: async () => {},
  };
} else {
  bulkQueue = new Queue('bulk-issuance', {
    connection: connectionOptions,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  });

  bulkQueue.on('error', (err: any) => {
    console.warn('⚠️ BullMQ Queue: Redis connection error (using in-memory fallback):', err.message);
  });

  console.log('📦 BullMQ: Bulk issuance queue initialized.');
}
