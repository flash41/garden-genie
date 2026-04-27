/**
 * validate-image.ts — Sprint 2 / H3+M3
 *
 * Validates a base64 data URL image before it is sent to Gemini.
 * Called in /api/analyse/route.ts immediately after request.json().
 *
 * Checks (in order, cheapest first):
 *  1. Data URL format is well-formed
 *  2. Declared MIME type is on the allowlist
 *  3. Base64 payload does not exceed MAX_BYTES
 *  4. Magic bytes match the declared MIME type (prevents MIME spoofing)
 */

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
type AllowedMime = (typeof ALLOWED_MIME_TYPES)[number];

/** 10 MB ceiling — base64 chars × 0.75 ≈ raw bytes */
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_B64_CHARS = Math.ceil((MAX_BYTES * 4) / 3);

/** Magic byte signatures for each allowed type */
const MAGIC: Record<AllowedMime, (buf: Buffer) => boolean> = {
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) =>
    b[0] === 0x89 &&
    b[1] === 0x50 &&
    b[2] === 0x4e &&
    b[3] === 0x47 &&
    b[4] === 0x0d &&
    b[5] === 0x0a &&
    b[6] === 0x1a &&
    b[7] === 0x0a,
  'image/webp': (b) =>
    b[0] === 0x52 && // R
    b[1] === 0x49 && // I
    b[2] === 0x46 && // F
    b[3] === 0x46 && // F
    b[8] === 0x57 && // W
    b[9] === 0x45 && // E
    b[10] === 0x42 && // B
    b[11] === 0x50,  // P
};

export type ImageValidationError =
  | 'INVALID_FORMAT'
  | 'UNSUPPORTED_TYPE'
  | 'TOO_LARGE'
  | 'MAGIC_MISMATCH';

export interface ImageValidationResult {
  valid: boolean;
  error?: ImageValidationError;
  message?: string;
  mimeType?: AllowedMime;
  base64Data?: string;
}

/**
 * Validates a base64 data URL.
 * Returns { valid: true, mimeType, base64Data } on success.
 * Returns { valid: false, error, message } on failure.
 */
export function validateImage(dataUrl: unknown): ImageValidationResult {
  // 1. Type guard
  if (typeof dataUrl !== 'string' || dataUrl.length === 0) {
    return { valid: false, error: 'INVALID_FORMAT', message: 'Image must be a non-empty string.' };
  }

  // 2. Parse data URL — must match data:<mime>;base64,<payload>
  const match = dataUrl.match(/^data:([^;]+);base64,([\s\S]+)$/);
  if (!match) {
    return { valid: false, error: 'INVALID_FORMAT', message: 'Image must be a base64 data URL.' };
  }

  const declaredMime = match[1].toLowerCase();
  const base64Data = match[2];

  // 3. MIME allowlist
  if (!ALLOWED_MIME_TYPES.includes(declaredMime as AllowedMime)) {
    return {
      valid: false,
      error: 'UNSUPPORTED_TYPE',
      message: `Unsupported image type "${declaredMime}". Accepted: ${ALLOWED_MIME_TYPES.join(', ')}.`,
    };
  }

  // 4. Size check (on the base64 string — avoids decoding a huge payload)
  if (base64Data.length > MAX_B64_CHARS) {
    return {
      valid: false,
      error: 'TOO_LARGE',
      message: `Image exceeds the 10 MB limit.`,
    };
  }

  // 5. Magic bytes — decode first 12 bytes only
  let headerBuf: Buffer;
  try {
    headerBuf = Buffer.from(base64Data.slice(0, 16), 'base64');
  } catch {
    return { valid: false, error: 'INVALID_FORMAT', message: 'Image payload could not be decoded.' };
  }

  const mimeType = declaredMime as AllowedMime;
  if (!MAGIC[mimeType](headerBuf)) {
    return {
      valid: false,
      error: 'MAGIC_MISMATCH',
      message: 'Image content does not match its declared type.',
    };
  }

  return { valid: true, mimeType, base64Data };
}
