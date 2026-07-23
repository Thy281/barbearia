import { cache } from './cache';
import type { NextRequest } from 'next/server';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export async function checkRateLimit(key: string, maxAttempts: number, windowSeconds: number): Promise<RateLimitResult> {
  let attempts: number;
  try {
    attempts = await cache.incr(key);
  } catch {
    return { allowed: true, remaining: maxAttempts };
  }
  if (attempts === 1) {
    await cache.expire(key, windowSeconds).catch(() => {});
  }
  return {
    allowed: attempts <= maxAttempts,
    remaining: Math.max(0, maxAttempts - attempts),
  };
}

export async function resetRateLimit(key: string): Promise<void> {
  await cache.del(key).catch(() => {});
}

export function extractClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (forwarded) return forwarded;
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}
