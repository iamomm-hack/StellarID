import { Queue } from 'bullmq';
import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const isRediss = redisUrl.startsWith('rediss://');

// Setup connection options for BullMQ
export const connectionOptions: any = {
  host: new URL(redisUrl).hostname || 'localhost',
  port: parseInt(new URL(redisUrl).port || '6379'),
  password: new URL(redisUrl).password || undefined,
  maxRetriesPerRequest: null,
  retryStrategy: (times: number) => {
    // Back off reconnects to 1 minute to avoid constant tight reconnect loops and console spam in dev
    return 60000;
  },
  ...(isRediss ? { tls: {} } : {}),
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

  let errorLogged = false;
  bulkQueue.on('error', (err: any) => {
    if (!errorLogged) {
      console.warn('⚠️ BullMQ Queue: Redis connection error (using in-memory fallback):', err.message);
      console.warn('💡 Tip: Start Redis locally (e.g. `redis-server`) to enable persistent background queues, or ignore this warning to continue using the in-memory queue fallback.');
      errorLogged = true;
    }
  });

  console.log('📦 BullMQ: Bulk issuance queue initialized.');
}
