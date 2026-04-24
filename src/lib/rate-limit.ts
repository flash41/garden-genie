import type { NextRequest } from 'next/server';
import { supabaseAdmin } from './supabase-server';

/**
 * Simple per-key fixed-window rate limiter, backed by Supabase.
 *
 * Semantics:
 *   - The window is defined by `windowMs`. Each call rounds `now` down to the
 *     nearest window boundary and increments a counter for that (key, window) row.
 *   - `allowed` returns false when count exceeds `limit`.
 *
 * Tradeoffs vs sliding-window / token-bucket:
 *   - Simple, survives cold starts, no separate infra to provision.
 *   - Boundary burst possible (up to 2x limit across a boundary).
 *     Acceptable for our use case — the goal is cost-abuse protection, not
 *     strict per-second fairness.
 *
 * Returns { allowed, remaining, resetAt } so callers can emit useful headers.
 */
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
}

export async function rateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  const { key, limit, windowMs } = params;
  const now = Date.now();
  const windowStartMs = Math.floor(now / windowMs) * windowMs;
  const windowStart = new Date(windowStartMs).toISOString();
  const resetAt = new Date(windowStartMs + windowMs);

  // Upsert+increment in a single round-trip by reading current count first,
  // then updating. Race: two concurrent requests can both read N and both
  // write N+1. Acceptable for a soft cost-abuse throttle; if strictness is
  // ever needed we can move to a Postgres function with atomic increment.
  const { data: existing } = await supabaseAdmin
    .from('rate_limits')
    .select('count')
    .eq('key', key)
    .eq('window_start', windowStart)
    .maybeSingle();

  const prevCount = existing?.count ?? 0;
  const nextCount = prevCount + 1;

  if (prevCount >= limit) {
    return { allowed: false, limit, remaining: 0, resetAt };
  }

  const { error } = await supabaseAdmin
    .from('rate_limits')
    .upsert(
      { key, window_start: windowStart, count: nextCount },
      { onConflict: 'key,window_start' }
    );

  if (error) {
    // Fail open on DB error — we do not want to take the site down if Supabase
    // has a hiccup. Log it for monitoring.
    console.error('[rate-limit] upsert failed, failing open:', error);
    return { allowed: true, limit, remaining: limit - nextCount, resetAt };
  }

  return { allowed: true, limit, remaining: Math.max(0, limit - nextCount), resetAt };
}

/**
 * Extract a caller identifier from a Next.js request. Prefers Vercel's
 * x-forwarded-for, falls back to x-real-ip, then a literal 'unknown'.
 */
export function callerIp(req: NextRequest | Request): string {
  const h = 'headers' in req ? req.headers : (req as NextRequest).headers;
  const fwd = h.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  return h.get('x-real-ip') || 'unknown';
}

/**
 * Opportunistic housekeeping — delete rate-limit rows older than 24h.
 * Fire-and-forget from any handler; don't await.
 */
export function purgeOldRateLimits(): void {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  supabaseAdmin
    .from('rate_limits')
    .delete()
    .lt('window_start', cutoff)
    .then(({ error }) => {
      if (error) console.error('[rate-limit] purge failed:', error);
    });
}
