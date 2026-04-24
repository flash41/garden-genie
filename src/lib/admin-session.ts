import crypto from 'crypto';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { supabaseAdmin } from './supabase-server';

export const ADMIN_COOKIE = 'admin_session';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function generateToken(): string {
  // 32 bytes → 43 chars base64url. Plenty of entropy.
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Constant-time password check against ADMIN_PASSWORD env var.
 * Returns false fast on mismatched lengths (length is not a secret).
 */
export function checkAdminPassword(submitted: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    console.error('[admin-session] ADMIN_PASSWORD env var is not set');
    return false;
  }
  const a = Buffer.from(submitted);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Create a new admin session. Returns the plaintext token that should be set
 * as the cookie value. The hash goes to the database.
 */
export async function createAdminSession(params: {
  userAgent?: string | null;
  ip?: string | null;
}): Promise<string> {
  const token = generateToken();
  const tokenHash = sha256Hex(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  const { error } = await supabaseAdmin.from('admin_sessions').insert({
    token_hash: tokenHash,
    expires_at: expiresAt,
    user_agent: params.userAgent ?? null,
    ip: params.ip ?? null,
  });

  if (error) {
    console.error('[admin-session] failed to create session', error);
    throw new Error('session_create_failed');
  }

  return token;
}

/**
 * Validate a cookie value against the database. Returns true iff the session
 * exists and has not expired.
 */
export async function validateAdminToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const tokenHash = sha256Hex(token);
  const { data, error } = await supabaseAdmin
    .from('admin_sessions')
    .select('id, expires_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (error || !data) return false;
  return new Date(data.expires_at) > new Date();
}

/**
 * Invalidate a specific session (logout).
 */
export async function destroyAdminSession(token: string | undefined | null): Promise<void> {
  if (!token) return;
  const tokenHash = sha256Hex(token);
  await supabaseAdmin.from('admin_sessions').delete().eq('token_hash', tokenHash);
}

/**
 * Purge all expired sessions. Safe to call from any admin route.
 */
export async function purgeExpiredAdminSessions(): Promise<void> {
  await supabaseAdmin
    .from('admin_sessions')
    .delete()
    .lt('expires_at', new Date().toISOString());
}

/**
 * Convenience: validate the admin cookie from an App Router server context.
 * Use in server components and route handlers.
 */
export async function isAuthenticatedAdmin(): Promise<boolean> {
  const store = await cookies();
  const cookie = store.get(ADMIN_COOKIE);
  return validateAdminToken(cookie?.value);
}

/**
 * Same as isAuthenticatedAdmin but reads from a NextRequest (middleware / API
 * routes that have req in scope).
 */
export async function isAuthenticatedAdminRequest(req: NextRequest): Promise<boolean> {
  return validateAdminToken(req.cookies.get(ADMIN_COOKIE)?.value);
}

export const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  path: '/',
  maxAge: SESSION_TTL_MS / 1000,
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
};
