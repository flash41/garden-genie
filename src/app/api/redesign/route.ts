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
    const { style, visualPrompt, zones, siteConstraints, orientation, plantCount } = await request.json();

    if (!style) {
      return NextResponse.json({ error: 'Missing required field: style' }, { status: 400 });
    }

    // ── Shape and boundary info ────────────────────────────────────────────────
    const gardenShape  = siteConstraints?.gardenShape  || null;
    const aspectRatio  = siteConstraints?.aspectRatio  || '1:1';
    const numPlants    = typeof plantCount === 'number' && plantCount > 0 ? plantCount : 10;

    const boundaryDescription = siteConstraints
      ? `Boundary walls: ${(siteConstraints.boundaries || []).join(', ')}. Fixed structures: ${(siteConstraints.immovableStructures || []).join(', ')}. Access points: ${(siteConstraints.accessPoints || []).join(', ')}.`
      : 'Standard rectangular garden with boundary walls on all sides.';

    // ── Render prompt — photorealistic, no annotations ────────────────────────
    const orientationNote = orientation ? ` The garden entrance faces ${orientation}.` : '';
    const boundaryPrefix = gardenShape
      ? `THIS GARDEN IS A ${gardenShape.toUpperCase()}. The garden outline has this EXACT shape and footprint — you must preserve it precisely in the render. `
      : '';
    const fullVisualPrompt = `${boundaryPrefix}${boundaryDescription} ` + (visualPrompt
      ? `${visualPrompt}.${orientationNote} ${style} style. Photorealistic photography style. Natural lighting. No text, no compass, no grid, no annotations, no overlaid graphics of any kind.`
      : `Photorealistic ${style} garden design. Professional landscape photography, lush planting, carefully composed layout, golden hour lighting. High detail, magazine quality.${orientationNote} No text, no compass, no grid, no annotations, no overlaid graphics of any kind.`);

    // ── Aerial prompt — pure orthographic plan ────────────────────────────────
    const compassNote = orientation ? ` showing ${orientation} orientation` : '';
    const aerialPrompt = `Architectural top-down garden plan drawing. STRICT REQUIREMENTS — follow every point exactly:

GARDEN SHAPE: This garden is a ${gardenShape || 'rectangular plot'}. The width-to-length aspect ratio is ${aspectRatio}. You MUST draw the garden boundary outline to match this exact shape and ratio. If the aspect ratio is 1:3 or similar, the plan outline must be tall and narrow, NOT square. The shape of the boundary outline is the most critical constraint.

PLANT COUNT: Show exactly ${numPlants} numbered plant positions inside the garden boundary. Number each from 1 to ${numPlants}. Do not show more or fewer plant markers than this count.

BOUNDARY: ${boundaryDescription}

The plan MUST include:
- Garden boundary outline drawn as thick ink lines matching the ${gardenShape || 'garden'} shape exactly
- ${numPlants} plant positions inside the boundary, each shown as a filled circle with a number (1–${numPlants})
- Planting bed areas as soft irregular shapes filled with watercolour green
- Hard surfaces (paths, paving) as flat geometric shapes in grey/buff tones
- Lawn areas as flat pale green fill
- A reference grid in light gold lines: columns A–F left to right, rows 1–6 top to bottom
- A small compass rose in the TOP RIGHT CORNER only${compassNote}
- A scale bar at the bottom edge

VIEWPOINT: Strict top-down orthographic only. Absolutely no perspective, no 3D, no isometric view. This is a flat 2D plan — as if looking straight down from a drone directly overhead.

Style: Hand-drawn architectural plan. Cream or white paper background. Watercolour fills. Ink outlines. No photorealistic elements. No shadows suggesting 3D.`;

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
