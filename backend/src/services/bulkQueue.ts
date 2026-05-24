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
export const bulkQueue = new Queue('bulk-issuance', {
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

bulkQueue.on('error', (err) => {
  console.warn('⚠️ BullMQ Queue: Redis connection error (using in-memory fallback):', err.message);
});

console.log('📦 BullMQ: Bulk issuance queue initialized.');
