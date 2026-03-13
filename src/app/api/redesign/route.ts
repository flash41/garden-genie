import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || '' });

export async function POST(request: Request) {
  try {
    const { style, visualPrompt } = await request.json();

    if (!style) {
      return NextResponse.json({ error: 'Missing required field: style' }, { status: 400 });
    }

    // Build the image generation prompt from the AI-generated visualPrompt
    // (passed through from the analyse step) or fall back to a style description.
    const prompt = visualPrompt
      ? `${visualPrompt} Photorealistic garden design render, professional architectural visualisation, ${style} style, golden hour lighting, high detail.`
      : `A photorealistic ${style} garden design render. Professional landscape architectural visualisation. Lush planting, carefully composed layout, golden hour lighting. High detail, magazine quality.`;

    const imageResponse = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '16:9',
      },
    });

    const imageBytes = imageResponse.generatedImages?.[0]?.image?.imageBytes;
    if (!imageBytes) {
      return NextResponse.json({ imageError: true });
    }

    return NextResponse.json({
      imageBase64: `data:image/png;base64,${imageBytes}`,
    });

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
