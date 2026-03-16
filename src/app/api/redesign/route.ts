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

Style: Photorealistic garden photography. Natural daylight. No text overlays. No compass. No grid. No annotations.

IMAGE CLEANLINESS — MANDATORY:
Do NOT draw any grid lines, column letters (A-F), row numbers (1-6), reference numbers, scale bars, numbered circles, or any alphanumeric annotation on the generated image.
Do NOT add any markers, labels, or text inside the image.
The image must contain ONLY the photorealistic garden scene — no overlays of any kind.
All grids and annotations are added separately by the application.`;

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

    // ── Spatial Audit — analyse original photo to understand garden layout ────
    const gardenShape = sc.gardenShape || 'rectangular plot';
    const aspectRatio = sc.aspectRatio || '1:1';

    let spatialAudit: any = {};
    if (originalImageBase64) {
      const spatialAuditPrompt = `You are creating a garden layout plan.
Analyse this garden photo and produce a precise SPATIAL AUDIT as a structured JSON object.

For each element in the garden, identify:
1. Its position in the A-F column, 1-6 row grid (A=leftmost, F=rightmost, 1=top/rear, 6=bottom/front)
2. Its approximate size relative to the garden
3. Its relationship to boundary walls and other elements

Return ONLY valid JSON, no markdown:
{
  "gardenShape": "description of overall shape",
  "gardenOrientation": "${orientation || 'N'}",
  "zones": [
    {
      "name": "zone name e.g. Main Lawn",
      "type": "lawn/path/border/structure/patio",
      "gridPosition": "e.g. B3 to E5",
      "relativeSize": "e.g. covers 40% of garden",
      "description": "brief spatial description"
    }
  ],
  "plants": [
    {
      "number": 1,
      "name": "plant name",
      "gridPosition": "e.g. B2",
      "nearestBoundary": "left wall / rear wall etc",
      "distanceFromCenter": "e.g. 2m left of centre"
    }
  ],
  "boundaries": {
    "top": "description of top/rear boundary",
    "bottom": "description of bottom/front boundary",
    "left": "description of left boundary",
    "right": "description of right boundary"
  }
}`;

      try {
        const auditResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{
            role: 'user',
            parts: [
              { inlineData: { mimeType: originalImageMimeType || 'image/jpeg', data: originalImageBase64 } },
              { text: spatialAuditPrompt },
            ],
          }],
        });
        const auditText = auditResponse.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text || '';
        const auditClean = auditText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        spatialAudit = JSON.parse(auditClean);
        console.log('Spatial audit complete:', JSON.stringify(spatialAudit).slice(0, 300));
      } catch (err) {
        console.error('Spatial audit failed, using defaults:', JSON.stringify(err));
      }
    }

    // ── Compass orientation lock ───────────────────────────────────────────────
    const compassLock = orientation ? `COMPASS ORIENTATION — CRITICAL:
The user indicated their garden faces: ${orientation}
Draw a compass rose in the top-right corner of the image.
The compass rose MUST show ${orientation} as the PRIMARY direction (the main arrow must point toward ${orientation}).
This compass must agree with the orientation selected by the user.
DO NOT default to North-up if the user selected a different orientation.` : '';

    // ── Aerial plan prompt using spatial audit ─────────────────────────────────
    const aerialPrompt = `You are generating a precise architectural garden layout plan.

SPATIAL AUDIT OF THIS GARDEN:
${JSON.stringify(spatialAudit, null, 2)}

GENERATION RULES — READ ALL BEFORE DRAWING:

VIEWPOINT: Directly vertical, 90 degrees straight down. Pure 2D orthographic top-down view. No perspective. No isometric. No 3D. Completely flat.

GARDEN SHAPE: ${spatialAudit.gardenShape || gardenShape}
Draw the garden outline as a bold black shape that EXACTLY matches this shape and aspect ratio: ${aspectRatio}.
If the garden is narrow, draw it narrow. If wide, draw it wide. Match the proportions precisely.

ORIENTATION: Garden faces ${orientation || 'N'}
Top of the plan = the rear boundary (furthest from camera in the photo)
Bottom of the plan = the front boundary (closest to camera in the photo)

BOUNDARIES — draw as thick black lines (3px minimum):
Top: ${spatialAudit.boundaries?.top || sc.rearBoundary || 'rear boundary'}
Bottom: ${spatialAudit.boundaries?.bottom || sc.frontBoundary || 'front boundary'}
Left: ${spatialAudit.boundaries?.left || sc.leftBoundary || 'left boundary'}
Right: ${spatialAudit.boundaries?.right || sc.rightBoundary || 'right boundary'}

ZONES — draw each zone in its correct position:
${(spatialAudit.zones || []).map((z: any) => `- ${z.name}: at grid position ${z.gridPosition}, ${z.relativeSize || ''}, type: ${z.type}`).join('\n') || '- Distribute zones evenly within the garden boundary'}

PLANTS — mark each plant position with a small numbered circle:
${(spatialAudit.plants || []).map((p: any) => `- Plant ${p.number} (${p.name}): at grid position ${p.gridPosition}`).join('\n') || '- Place plant markers evenly in border areas'}
ALL plant markers must be INSIDE the garden boundary. NO markers outside the boundary lines.

STYLE:
- Clean black ink outlines for all boundaries and beds
- Light watercolour zone fills: Lawn = soft green, Paths/Paving = warm grey/sand, Planting beds = soft terracotta/blush, Structures = light blue-grey
- Cream/off-white paper background
- Hand-drawn sketch quality — precise but with slight hand-drawn character

IMAGE CLEANLINESS — MANDATORY:
Do NOT draw any grid lines, column letters (A-F), row numbers (1-6), reference numbers, scale bars, or any alphanumeric grid overlay on this image.
Do NOT add any numbered circles or markers — these will be added by the application.
Do NOT add any annotation text other than the zone labels and compass below.
All grid lines and plant number markers will be added separately by the application.

TEXT LABELS:
- Label major zones only: LAWN, PATH, BORDER, PATIO, SHED
- Single clean word labels, no codes or abbreviations
- Maximum 6 text labels total

${compassLock}

SCALE BAR: Simple horizontal scale bar at bottom. Label it "Scale: 1cm = 1m" approximately.

ACCURACY PRIORITY:
Geometric accuracy of zone placement is more important than artistic quality. The zones must be in the right positions relative to each other and to the boundaries.`;

    // ── Generate aerial sketch ─────────────────────────────────────────────────
    console.log('Starting aerial sketch generation...');
    let aerialImageBase64: string | null = null;
    try {
      aerialImageBase64 = await generateImage(aerialPrompt, originalImageBase64, originalImageMimeType);
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
