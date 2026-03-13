import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || '' });

async function generateImage(prompt: string): Promise<string | null> {
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-image-preview',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { responseModalities: ['Text', 'Image'] },
  });
  const imagePart = response.candidates?.[0]?.content?.parts?.find(
    (p: any) => p.inlineData
  );
  if (!imagePart?.inlineData?.data) return null;
  const mime = imagePart.inlineData.mimeType || 'image/png';
  return `data:${mime};base64,${imagePart.inlineData.data}`;
}

export async function POST(request: Request) {
  try {
    const { style, visualPrompt, zones, siteConstraints } = await request.json();

    if (!style) {
      return NextResponse.json({ error: 'Missing required field: style' }, { status: 400 });
    }

    // ── Boundary context (prepended to both prompts) ───────────────────────────
    const boundaryContext = siteConstraints
      ? `SITE BOUNDARIES TO PRESERVE EXACTLY AS PHOTOGRAPHED: Walls/Fences: ${(siteConstraints.boundaries || []).join(', ')}. Fixed Structures: ${(siteConstraints.immovableStructures || []).join(', ')}. The garden footprint is fixed. Only redesign what is inside it. `
      : '';

    // ── Render prompt ──────────────────────────────────────────────────────────
    const fullVisualPrompt = boundaryContext + (visualPrompt
      ? `${visualPrompt}. Photorealistic style, professional garden photography, ${style} style, golden hour lighting, high detail.`
      : `Generate a photorealistic ${style} garden design image. Professional landscape photography, lush planting, carefully composed layout, golden hour lighting. High detail, magazine quality.`);

    // ── Aerial prompt ──────────────────────────────────────────────────────────
    const zoneList = Array.isArray(zones) && zones.length > 0
      ? zones.map((z: any) => z.name || z.type).filter(Boolean).join(', ')
      : 'lawn, mixed borders, patio area, garden path';

    const structureList = siteConstraints
      ? `Show fixed structures in their real positions: ${(siteConstraints.immovableStructures || []).join(', ')}. Show boundaries: ${(siteConstraints.boundaries || []).join(', ')}. `
      : '';

    const aerialPrompt = `Generate a professional hand-drawn aerial garden layout plan, top-down view, ink and watercolour style on cream graph paper, for a ${style} garden. ${structureList}Show clearly labelled zones: ${zoneList}. Include compass direction, scale reference, borders, lawn, paths, and planting areas. Add grid reference marks on edges: columns A through F left to right, rows 1 through 6 top to bottom. Clean architectural illustration style, no perspective, pure flat plan view.`;

    // ── Generate render ────────────────────────────────────────────────────────
    console.log('Starting render generation...');
    let imageBase64: string | null = null;
    try {
      imageBase64 = await generateImage(fullVisualPrompt);
      console.log('Render complete, image size:', imageBase64?.length ?? 0);
    } catch (err: unknown) {
      console.error('Render generation failed:', JSON.stringify(err));
    }

    // ── Generate aerial sketch ─────────────────────────────────────────────────
    console.log('Starting aerial sketch generation...');
    let aerialImageBase64: string | null = null;
    try {
      aerialImageBase64 = await generateImage(aerialPrompt);
      console.log('Aerial sketch complete, image size:', aerialImageBase64?.length ?? 0);
    } catch (err: unknown) {
      console.error('Aerial sketch generation failed:', JSON.stringify(err));
    }

    if (!imageBase64 && !aerialImageBase64) {
      return NextResponse.json({ imageError: true });
    }

    return NextResponse.json({ imageBase64, aerialImageBase64 });

  } catch (error: unknown) {
    console.error('Redesign API error:', JSON.stringify(error));
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
