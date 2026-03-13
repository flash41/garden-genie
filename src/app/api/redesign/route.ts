import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || '' });

// ── Generate a photorealistic render, optionally using original photo as reference ──
async function generateImage(
  prompt: string,
  referenceBase64?: string,
  referenceMimeType?: string,
): Promise<string | null> {
  const parts: any[] = [];

  if (referenceBase64) {
    parts.push({
      inlineData: { mimeType: referenceMimeType || 'image/jpeg', data: referenceBase64 },
    });
    parts.push({
      text: `This is the BEFORE photo of the garden. Generate an AFTER version of THIS EXACT SAME GARDEN with the following design applied. The garden must be immediately recognisable as the same space.\n\n${prompt}`,
    });
  } else {
    parts.push({ text: prompt });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{ role: 'user', parts }],
    config: { responseModalities: ['Text', 'Image'] },
  });

  const imagePart = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
  if (!imagePart?.inlineData?.data) return null;
  const mime = imagePart.inlineData.mimeType || 'image/png';
  return `data:${mime};base64,${imagePart.inlineData.data}`;
}

// ── Validate that the generated render matches the original garden ──────────────
async function validateRender(
  originalBase64: string,
  originalMimeType: string,
  generatedBase64: string,
): Promise<any> {
  const validationPrompt = `You are a quality checker for a garden design app.

Compare these two images:
Image 1: The original garden photo (Before)
Image 2: The AI-generated render (After)

Answer these questions:
1. Is the garden the same shape in both images?
2. Are the boundary walls in the same position in both images?
3. Is the camera viewpoint the same in both images?
4. Could a person standing in the Before garden recognise the After image as the same space?
5. Are there any structures in the After that do not exist in the Before (invented staircases, pergolas, buildings etc)?

Return ONLY valid JSON, no markdown:
{
  "sameGarden": true,
  "sameViewpoint": true,
  "boundariesRespected": true,
  "recognisableSameSpace": true,
  "hallucinatedStructures": [],
  "overallPass": true,
  "failReasons": []
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType: originalMimeType, data: originalBase64 } },
        { inlineData: { mimeType: 'image/png', data: generatedBase64 } },
        { text: validationPrompt },
      ],
    }],
    config: { responseMimeType: 'application/json', temperature: 0.1 },
  });

  const text = response.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text || '';
  const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(clean);
}

export async function POST(request: Request) {
  try {
    const {
      style,
      visualPrompt,
      zones,
      siteConstraints,
      orientation,
      plantCount,
      originalImageBase64,
      originalImageMimeType,
    } = await request.json();

    if (!style) {
      return NextResponse.json({ error: 'Missing required field: style' }, { status: 400 });
    }

    const sc = siteConstraints || {};
    const numPlants = typeof plantCount === 'number' && plantCount > 0 ? plantCount : 10;

    // ── Build the spatial lock string ─────────────────────────────────────────
    const structuresList = (sc.immovableStructures || []).map((s: string) => `- ${s}`).join('\n') || '- None identified';
    const vegetationList = (sc.existingVegetation || []).map((v: string) => `- ${v}`).join('\n') || '- None identified';

    const spatialLock = `SPATIAL LOCK — THIS RENDER MUST SHOW THE SAME GARDEN AS THE BEFORE PHOTO:

CAMERA POSITION: ${sc.cameraPosition || 'ground level at garden entrance'}
The After render must be photographed from EXACTLY the same position and height as the Before photo. Same viewpoint. Same angle.

GARDEN GEOMETRY TO PRESERVE EXACTLY:
- Shape: ${sc.gardenShape || 'rectangular'}
- Width: ${sc.gardenWidth || 'as in photo'}
- Depth: ${sc.gardenDepth || 'as in photo'}
- Aspect ratio: ${sc.aspectRatio || 'as in photo'}
- Ground level: ${sc.groundLevel || 'flat'}
DO NOT change the garden dimensions. DO NOT widen or shorten it. DO NOT change the perspective or camera angle.

BOUNDARIES — PRESERVE EXACTLY AS PHOTOGRAPHED:
- Left boundary: ${sc.leftBoundary || 'as in photo'}
- Right boundary: ${sc.rightBoundary || 'as in photo'}
- Rear boundary: ${sc.rearBoundary || 'as in photo'}
Every wall and fence must appear at the same height and position.

FIXED STRUCTURES — THESE MUST APPEAR IN THE AFTER IMAGE:
${structuresList}
Do not remove, hide or replace these structures.

EXISTING LARGE PLANTS — RETAIN UNLESS EXPLICITLY REMOVED:
${vegetationList}

WHAT YOU ARE ALLOWED TO CHANGE:
- Ground surface treatment within the existing footprint
- Planting in beds along boundaries
- Addition of small moveable elements (pots, furniture, lighting)
- Surface of paths within existing layout
- Addition of climbers on existing walls

WHAT YOU MUST NOT CHANGE:
- The shape or size of the garden space
- The position or height of any boundary wall or fence
- Any fixed building or permanent structure
- The camera viewpoint or angle
- The overall sense of enclosure and scale

The person looking at the Before and After must immediately recognise it as the SAME garden.`;

    const designStyle = visualPrompt
      ? `${visualPrompt}. ${style} style.`
      : `Photorealistic ${style} garden design. Professional landscape photography. Natural lighting.`;

    const finalPrompt = `${spatialLock}

DESIGN STYLE: ${designStyle}${orientation ? ` The garden entrance faces ${orientation}.` : ''}

FINAL CHECK BEFORE GENERATING:
- Is the garden the same shape as the Before? Must be YES
- Is the camera at the same position? Must be YES
- Are all boundary walls in the same place? Must be YES
- Does it look like the same garden? Must be YES

Style: Photorealistic garden photography. Natural daylight. No text overlays. No compass. No grid. No annotations.`;

    // ── Generate render ────────────────────────────────────────────────────────
    console.log('Starting render generation...');
    let imageBase64: string | null = null;
    try {
      imageBase64 = await generateImage(finalPrompt, originalImageBase64, originalImageMimeType);
      console.log('Render complete, size:', imageBase64?.length ?? 0);
    } catch (err) {
      console.error('Render generation failed:', JSON.stringify(err));
    }

    // ── Validate & retry ──────────────────────────────────────────────────────
    let validationResult: any = null;
    let retried = false;

    if (imageBase64 && originalImageBase64) {
      const generatedRaw = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      try {
        validationResult = await validateRender(
          originalImageBase64,
          originalImageMimeType || 'image/jpeg',
          generatedRaw,
        );
        console.log('Validation result:', JSON.stringify(validationResult));

        if (!validationResult?.overallPass) {
          retried = true;
          const failReasons = (validationResult?.failReasons || []).join('; ');
          const retryPrompt = `${finalPrompt}

PREVIOUS ATTEMPT FAILED — THESE SPECIFIC ISSUES MUST BE CORRECTED:
${failReasons}
Fix all of these in this new attempt. The result must pass all checks.`;

          console.log('Retrying render after validation failure...');
          try {
            imageBase64 = await generateImage(retryPrompt, originalImageBase64, originalImageMimeType);
          } catch (err) {
            console.error('Retry render failed:', JSON.stringify(err));
          }
        }
      } catch (err) {
        console.error('Validation failed:', JSON.stringify(err));
      }
    }

    // ── Aerial sketch prompt ──────────────────────────────────────────────────
    const gardenShape = sc.gardenShape || 'rectangular plot';
    const aspectRatio = sc.aspectRatio || '1:1';
    const compassNote = orientation ? ` showing ${orientation} orientation` : '';
    const boundaryDescription = sc.boundaries?.length
      ? `Boundary walls: ${sc.boundaries.join(', ')}.`
      : 'Standard rectangular garden.';

    const aerialPrompt = `Architectural top-down garden plan drawing. STRICT REQUIREMENTS:

GARDEN SHAPE: This garden is a ${gardenShape}. Aspect ratio is ${aspectRatio}. The plan outline MUST match this exact shape. A narrow garden must be drawn tall and narrow, NOT square.

PLANT COUNT: Show exactly ${numPlants} numbered plant positions (circles numbered 1–${numPlants}).

BOUNDARY: ${boundaryDescription}

Include: thick ink boundary outline matching garden shape, ${numPlants} numbered plant positions, planting bed shapes, hard surfaces, lawn areas, reference grid (columns A–F, rows 1–6 in light gold), small compass rose in TOP RIGHT CORNER only${compassNote}, scale bar at bottom.

VIEWPOINT: Strict top-down orthographic only. No perspective. No 3D. No isometric.

Style: Hand-drawn architectural plan. Cream paper. Watercolour fills. Ink outlines. No photorealistic elements.`;

    // ── Generate aerial sketch ────────────────────────────────────────────────
    console.log('Starting aerial sketch generation...');
    let aerialImageBase64: string | null = null;
    try {
      aerialImageBase64 = await generateImage(aerialPrompt);
      console.log('Aerial sketch complete, size:', aerialImageBase64?.length ?? 0);
    } catch (err) {
      console.error('Aerial sketch generation failed:', JSON.stringify(err));
    }

    if (!imageBase64 && !aerialImageBase64) {
      return NextResponse.json({ imageError: true });
    }

    return NextResponse.json({ imageBase64, aerialImageBase64, validationResult, retried });

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
