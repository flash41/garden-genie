import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI, Modality } from '@google/genai';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Old SDK for text (plan generation)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// New SDK for image generation
const imageAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || '' });

export async function POST(request: Request) {
  try {
    const { image, style, orientation } = await request.json();

    if (!image || !style || !orientation) {
      return NextResponse.json(
        { error: 'Missing required fields: image, style, orientation' },
        { status: 400 }
      );
    }

    const base64Data = image.includes(',') ? image.split(',')[1] : image;
    const mimeType = image.includes('data:') ? image.split(';')[0].split(':')[1] : 'image/jpeg';

    // ── STEP 1: Generate written plan (text model) ───────────────────────────
    const textModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const planPrompt = `You are a senior landscape architect producing a client-ready design proposal.

Carefully study this garden photograph. Note the exact spatial boundaries: position and height of walls or fences, shape and dimensions of the plot, any existing trees or structures that must be retained, and any slopes or level changes.

Write a professional redesign plan in Markdown with these exact sections:

## Design Concept
## Planting Palette
(List 6-8 specific plant species by full botanical name. For each: common name, why it suits a ${orientation} garden, and its role in the ${style} design language.)
## Hardscape & Materials
## Maintenance Notes

All plant selections MUST be appropriate for a ${orientation} garden.`;

    const planResult = await textModel.generateContent([
      { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
      { text: planPrompt },
    ]);

    const planMarkdown = planResult.response.text().trim();

    // ── STEP 2: Generate render (Gemini image model) ─────────────────────────
    // This model takes the actual photo and transforms it directly,
    // preserving the real garden boundaries and spatial layout.
    const imagePrompt = `Transform this garden photograph into a photorealistic ${style} landscape design render.

CRITICAL REQUIREMENTS:
- Keep the EXACT same viewpoint, camera angle, and perspective as the original photo
- Preserve ALL boundary walls and fences — same position, same height
- Preserve the exact plot shape, dimensions, and any slopes or level changes
- Keep any mature trees visible in the original photo
- Apply ${style} planting and hardscape WITHIN these unchanged boundaries
- Lighting should reflect ${orientation} conditions
- Result must look like a professional architectural visualisation of the SAME garden transformed

Do not invent a new space. This must be the same garden, redesigned.`;

    const imageResult = await imageAI.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [
        {
          role: 'user',
          parts: [
            { text: imagePrompt },
            { inlineData: { mimeType, data: base64Data } },
          ],
        },
      ],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    // Extract the generated image from response
    let imageBase64 = '';
    const parts = imageResult.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        imageBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }

    return NextResponse.json({
      plan: planMarkdown,
      imageBase64,
      imageUrl: '',
    });

  } catch (error: unknown) {
    console.error('❌ GardenAI API Error:', error);

    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred.';

    if (message.includes('API_KEY') || message.includes('api key')) {
      return NextResponse.json({ error: 'Invalid or missing Google API key. Check your .env.local file.' }, { status: 500 });
    }
    if (message.includes('quota') || message.includes('429')) {
      return NextResponse.json({ error: 'Google API quota exceeded. Please wait a moment and try again.' }, { status: 429 });
    }
    if (message.includes('503') || message.includes('overloaded')) {
      return NextResponse.json({ error: 'Google AI is currently over capacity. Please wait 30 seconds and try again.' }, { status: 503 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}