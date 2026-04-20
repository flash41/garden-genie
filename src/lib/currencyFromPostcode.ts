export type CurrencyConfig = {
  code: string;   // ISO 4217 e.g. 'EUR'
  symbol: string; // e.g. '€'
  locale: string; // e.g. 'en-IE'
};

const CURRENCIES: Record<string, CurrencyConfig> = {
  EUR: { code: 'EUR', symbol: '€', locale: 'en-IE' },
  GBP: { code: 'GBP', symbol: '£', locale: 'en-GB' },
  USD: { code: 'USD', symbol: '$', locale: 'en-US' },
};

/**
 * Derives the most likely currency from a postcode/Eircode string.
 *
 * Rules (in priority order):
 *  1. Irish Eircode — starts with one of the routing key letters A–Y (excl. B, G, I, J, M, O, Q)
 *     followed by a digit, e.g. "D6W 1AB", "T12 A345"  → EUR
 *  2. GB postcode  — starts with 1–2 letters then a digit, e.g. "SW1A 1AA" → GBP
 *  3. US ZIP       — 5 consecutive digits, e.g. "10001"                    → USD
 *  4. Default                                                               → EUR
 */
export function getCurrencyFromPostcode(postcode: string | undefined | null): CurrencyConfig {
  if (!postcode) return CURRENCIES.EUR;

  const pc = postcode.trim().toUpperCase();

  // Irish Eircode routing keys (first character is one of these letters, second is a digit)
  const irishKeys = /^[ACD-FHKNPRSTVWXY]\d/;
  if (irishKeys.test(pc)) return CURRENCIES.EUR;

  // GB: starts with 1–2 letters then a digit (e.g. SW1A, M1, EC1A)
  const gbPattern = /^[A-Z]{1,2}\d/;
  if (gbPattern.test(pc)) return CURRENCIES.GBP;

  // US ZIP: exactly 5 digits (optionally followed by hyphen + 4)
  const usPattern = /^\d{5}(-\d{4})?$/;
  if (usPattern.test(pc)) return CURRENCIES.USD;

  return CURRENCIES.EUR;
}

/**
 * Formats a cost string by replacing any existing currency symbols/codes
 * with the correct symbol for the given currency config.
 *
 * Input examples: "€1,200–€1,500", "$800", "£600–£900", "1000"
 */
export function formatCurrency(val: string | undefined, currency: CurrencyConfig): string {
  if (!val) return '';
  // Strip known currency symbols and ISO codes, then re-prefix each numeric segment
  const stripped = val.replace(/[€£$]|EUR|GBP|USD/g, '').trim();
  // Re-apply symbol: replace sequences like "800" or "1,200" with "£800" etc.
  return stripped.replace(/([\d,]+)/g, `${currency.symbol}$1`);
}
