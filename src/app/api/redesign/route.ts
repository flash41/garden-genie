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

    // ── Boundary description ───────────────────────────────────────────────────
    const boundaryDescription = siteConstraints
      ? `Boundary walls: ${(siteConstraints.boundaries || []).join(', ')}. Fixed structures: ${(siteConstraints.immovableStructures || []).join(', ')}. Access points: ${(siteConstraints.accessPoints || []).join(', ')}.`
      : 'Standard rectangular garden with boundary walls on all sides.';

    // ── Render prompt — photorealistic, no annotations ────────────────────────
    const orientationNote = orientation ? ` The garden entrance faces ${orientation}.` : '';
    const fullVisualPrompt = `${boundaryDescription} ` + (visualPrompt
      ? `${visualPrompt}.${orientationNote} ${style} style. Photorealistic photography style. Natural lighting. No text, no compass, no grid, no annotations, no overlaid graphics of any kind.`
      : `Photorealistic ${style} garden design. Professional landscape photography, lush planting, carefully composed layout, golden hour lighting. High detail, magazine quality.${orientationNote} No text, no compass, no grid, no annotations, no overlaid graphics of any kind.`);

    // ── Aerial prompt — pure orthographic plan ────────────────────────────────
    const compassNote = orientation ? ` showing ${orientation} orientation` : '';
    const aerialPrompt = `Architectural garden layout plan. Pure top-down orthographic view, looking straight down from directly above.

This is a 2D plan drawing of this specific garden: ${boundaryDescription}

The plan must show:
- The exact same boundary walls and fences as the site, drawn as thick lines forming the garden outline
- Garden dimensions/footprint matching the real site
- Every planting bed shown as a shape from above with plant symbols (circles/dots for shrubs, star shapes for perennials, irregular blobs for ground cover)
- Path and paving areas shown as flat shapes with texture
- Lawn areas shown as flat green fill
- A clean A-F column, 1-6 row reference grid overlaid in light gold lines
- A small compass rose in the TOP RIGHT CORNER ONLY${compassNote} — a small diagram in the corner only, not a feature in the garden
- A scale bar at the bottom
- Plant numbers matching the planting schedule

Style: Clean hand-drawn architectural plan on cream paper. Watercolour fills. Ink outlines. Top-down only. No perspective. No 3D. No isometric. Pure flat plan view. No photorealistic elements. This is a 2D drawing only.`;

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
