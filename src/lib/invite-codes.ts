import { supabaseAdmin } from '@/lib/supabase-server';

// Alphanumeric without visually ambiguous characters (0/O, 1/I/l)
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
const MAX_ATTEMPTS = 5;

function generateCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

/**
 * Creates a new invite code in the invite_codes table.
 * Retries up to MAX_ATTEMPTS times on unique-key collisions.
 *
 * @param maxRenders  How many times the code can be used (2 for buyer, 1 for share)
 * @param label       Human-readable label for admin visibility (e.g. 'stripe_payment_primary')
 * @param email       Optional: email of the recipient (for audit trail)
 * @returns           The generated code string (uppercase, 6 chars)
 */
export async function createInviteCode(
  maxRenders: number,
  label: string,
  email?: string,
): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code = generateCode();

    const { error } = await supabaseAdmin.from('invite_codes').insert({
      code,
      max_renders: maxRenders,
      renders_used: 0,
      label,
      email: email ?? null,
    });

    if (!error) return code;

    // 23505 = unique_violation — try a different code
    if ((error as { code?: string }).code !== '23505') {
      throw new Error(`[createInviteCode] Supabase error: ${error.message}`);
    }
  }

  throw new Error(
    `[createInviteCode] Failed to generate a unique code after ${MAX_ATTEMPTS} attempts`,
  );
}
