/**
 * generate.ts — Call Gemini to get planting suggestions.
 *
 * Uses the GEMINI_TEXT_MODEL env var (default: gemini-2.5-flash).
 * Single call, 60 s timeout, no retries here (caller handles retry/repair).
 */

import type { GenerateResult } from './types';

const MODEL = process.env.GEMINI_TEXT_MODEL ?? 'gemini-2.5-flash';
const TIMEOUT_MS = 60_000;

export async function generateSuggestions(prompt: string): Promise<GenerateResult> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_API_KEY is not set');

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.4,
      maxOutputTokens: 4096,
    },
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Gemini ${res.status}: ${text.slice(0, 300)}`);
  }

  const json = await res.json();
  const rawText: string =
    json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  // Parse the JSON array from the response
  let suggestions: GenerateResult['suggestions'];
  try {
    suggestions = JSON.parse(rawText);
    if (!Array.isArray(suggestions)) throw new Error('not an array');
  } catch (e) {
    throw new Error(`Gemini response is not a JSON array: ${String(e)}\n---\n${rawText.slice(0, 500)}`);
  }

  return { suggestions, rawText };
}
