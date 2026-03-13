import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || '' });

async function generateImage(prompt: string, aspectRatio: '16:9' | '1:1'): Promise<string | null> {
  const res = await ai.models.generateImages({
    model: 'imagen-3.0-generate-002',
    prompt,
    config: { numberOfImages: 1, aspectRatio },
  });
  const bytes = res.generatedImages?.[0]?.image?.imageBytes;
  return bytes ? `data:image/png;base64,${bytes}` : null;
}

export async function POST(request: Request) {
  try {
    const { style, visualPrompt, zones } = await request.json();

    if (!style) {
      return NextResponse.json({ error: 'Missing required field: style' }, { status: 400 });
    }

    // ── Render prompt ──────────────────────────────────────────────────────────
    const renderPrompt = visualPrompt
      ? `${visualPrompt} Photorealistic garden design render, professional architectural visualisation, ${style} style, golden hour lighting, high detail.`
      : `A photorealistic ${style} garden design render. Professional landscape architectural visualisation. Lush planting, carefully composed layout, golden hour lighting. High detail, magazine quality.`;

    // ── Aerial prompt ──────────────────────────────────────────────────────────
    const zoneList = Array.isArray(zones) && zones.length > 0
      ? zones.map((z: any) => z.name || z.type).filter(Boolean).join(', ')
      : 'lawn, mixed borders, patio area, garden path';

    const aerialPrompt = `A professional top-down overhead garden design plan illustration for a ${style} garden. Pure aerial view, looking directly down. Architectural watercolour and ink illustration on cream parchment paper. Clean ink outlines. Show clearly labelled zones: ${zoneList}. Include plant groupings, lawn areas, paths, borders, and patio spaces. Add grid reference marks on edges: columns A through F left to right, rows 1 through 6 top to bottom. No perspective, no shadows, pure flat plan view. Magazine-quality landscape design illustration.`;

    // ── Generate both in parallel ──────────────────────────────────────────────
    const [renderResult, aerialResult] = await Promise.allSettled([
      generateImage(renderPrompt, '16:9'),
      generateImage(aerialPrompt, '1:1'),
    ]);

    const imageBase64 = renderResult.status === 'fulfilled' ? renderResult.value : null;
    const aerialImageBase64 = aerialResult.status === 'fulfilled' ? aerialResult.value : null;

    if (!imageBase64 && !aerialImageBase64) {
      return NextResponse.json({ imageError: true });
    }

    return NextResponse.json({ imageBase64, aerialImageBase64 });

  } catch (error: unknown) {
    console.error('Redesign API error:', error);
    const message = error instanceof Error ? error.message : 'Unexpected error';

    if (message.includes('API_KEY') || message.includes('api key')) {
      return NextResponse.json({ imageError: true, error: 'Invalid or missing Google API key.' }, { status: 500 });
    }
    if (message.includes('quota') || message.includes('429')) {
      return NextResponse.json({ imageError: true, error: 'API quota exceeded. Please wait and try again.' }, { status: 429 });
    }
    if (message.includes('503') || message.includes('overloaded')) {
      return NextResponse.json({ imageError: true, error: 'Google AI is over capacity. Please try again shortly.' }, { status: 503 });
    }

    return NextResponse.json({ imageError: true, error: message }, { status: 500 });
  }
}
