import { createClient, RedisClientType } from 'redis';

let client: RedisClientType | null = null;
let isConnected = false;
let warningLogged = false;
let lastAttemptTime = 0;
const RETRY_COOLDOWN_MS = 60 * 1000; // 1 minute cooldown between reconnection attempts

async function getClient(): Promise<RedisClientType | null> {
  const now = Date.now();

  if (client) {
    if (!isConnected) {
      if (now - lastAttemptTime < RETRY_COOLDOWN_MS) {
        return null;
      }
      lastAttemptTime = now;
      try {
        await client.connect();
        isConnected = true;
        warningLogged = false;
      } catch (err) {
        if (!warningLogged) {
          console.warn('⚠️ Redis connection failed. Falling back to in-memory/no-cache behavior.');
          warningLogged = true;
        }
        return null;
      }
    }
    return client;
  }

  if (now - lastAttemptTime < RETRY_COOLDOWN_MS) {
    return null;
  }
  lastAttemptTime = now;

  try {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    client = createClient({
      url,
      socket: {
        reconnectStrategy: (retries) => {
          // In local dev without Redis, back off reconnects to 1 minute to avoid console spam
          return 60000;
        }
      }
    }) as RedisClientType;

    client.on('error', (err) => {
      // Quiet errors to prevent server crash
      if (!warningLogged) {
        console.warn('⚠️ Redis error:', err.message);
        warningLogged = true;
      }
      isConnected = false;
    });

    await client.connect();
    isConnected = true;
    warningLogged = false; // Reset warning if successful
    return client;
  } catch (err: any) {
    if (!warningLogged) {
      console.warn('⚠️ Redis client creation or connection failed:', err.message);
      warningLogged = true;
    }
    client = null;
    isConnected = false;
    return null;
  }
}

// In-memory fallback cache for development/environments without Redis
const memoryCache: Record<string, { value: string; expiresAt: number }> = {};

export async function getCache(key: string): Promise<string | null> {
  const redis = await getClient();
  if (redis && isConnected) {
    try {
      return await redis.get(key);
    } catch (err) {
      // Fallback
    }
  }

  // Memory fallback logic
  const item = memoryCache[key];
  if (item) {
    if (Date.now() < item.expiresAt) {
      return item.value;
    }
    delete memoryCache[key];
  }
  return null;
}

export async function setCache(key: string, value: string, ttlSeconds: number): Promise<void> {
  const redis = await getClient();
  if (redis && isConnected) {
    try {
      await redis.setEx(key, ttlSeconds, value);
      return;
    } catch (err) {
      // Fallback
    }
  }

  // Memory fallback logic
  memoryCache[key] = {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  };
}

export async function deleteCache(key: string): Promise<void> {
  const redis = await getClient();
  if (redis && isConnected) {
    try {
      await redis.del(key);
      return;
    } catch (err) {
      // Fallback
    }
  }

  delete memoryCache[key];
}

/**
 * Invalidate all cache entries associated with a user's wallet address
 */
export async function invalidateProfileCache(walletAddress: string): Promise<void> {
  const normalizedWallet = walletAddress.trim();
  await Promise.all([
    deleteCache(`card_data_${normalizedWallet}`),
    deleteCache(`og_image_${normalizedWallet}`),
    deleteCache(`reputation_data_${normalizedWallet}`),
  ]);
}
