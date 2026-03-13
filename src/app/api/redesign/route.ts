import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || '' });

async function generateImage(prompt: string): Promise<string | null> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
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
    const { style, visualPrompt, zones, siteConstraints, orientation } = await request.json();

    if (!style) {
      return NextResponse.json({ error: 'Missing required field: style' }, { status: 400 });
    }

    // ── Boundary context (prepended to both prompts) ───────────────────────────
    const boundaryContext = siteConstraints
      ? `SITE BOUNDARIES TO PRESERVE EXACTLY AS PHOTOGRAPHED: Walls/Fences: ${(siteConstraints.boundaries || []).join(', ')}. Fixed Structures: ${(siteConstraints.immovableStructures || []).join(', ')}. The garden footprint is fixed. Only redesign what is inside it. `
      : '';

    // ── Render prompt ──────────────────────────────────────────────────────────
    const orientationNote = orientation ? ` The garden entrance/photo was taken facing ${orientation}. Show compass orientation clearly with ${orientation} marked.` : '';
    const fullVisualPrompt = boundaryContext + (visualPrompt
      ? `${visualPrompt}. Photorealistic style, professional garden photography, ${style} style, golden hour lighting, high detail.${orientationNote}`
      : `Generate a photorealistic ${style} garden design image. Professional landscape photography, lush planting, carefully composed layout, golden hour lighting. High detail, magazine quality.${orientationNote}`);

    // ── Aerial prompt — top-down birds-eye view of the same garden ─────────────
    const aerialPrompt = `Top-down birds-eye view garden layout plan. Looking directly down from above at this exact garden: ${fullVisualPrompt}.

Style: Clean architectural illustration, watercolour on cream paper.
Show exactly the same layout as the rendered design but from above.
Include:
- The same boundary walls, fences and structures in their exact positions
- Every planting bed and lawn area in the same location as the render
- Path and paving layout matching the render exactly
- Individual plant positions shown as top-down botanical illustrations
- A clean A-F column, 1-6 row reference grid overlaid on top
- A compass rose in the corner${orientation ? ` showing ${orientation} facing` : ''}
- Scale bar showing approximate metres
- No perspective, pure top-down orthographic view
- Soft watercolour fill colours matching the render palette`;

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
      return NextResponse.json({ imageError: true, error: 'Google image service is over capacity. Please try again shortly.' }, { status: 503 });
    }

    return NextResponse.json({ imageError: true, error: message }, { status: 500 });
  }
}
