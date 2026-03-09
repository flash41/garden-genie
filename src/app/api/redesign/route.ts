import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(request: Request) {
  try {
    const { image, style, orientation } = await request.json();
    const base64Data = image.includes(',') ? image.split(',')[1] : image;

    // MARCH 2026: Using Gemini 3 Flash for elite vision performance
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

    const prompt = `Act as a professional landscape architect. Analyze this garden photo and:
    1. Write a professional "Redesign Plan" in Markdown with sections for 'Design Concept', 'Planting Palette', and 'Hardscape Materials'.
    2. CRITICAL: The garden is ${orientation}. You MUST select plant species that thrive in these specific lighting conditions.
    3. End the response with exactly this separator '---IMAGE_PROMPT---' followed by a detailed, one-paragraph description for an AI to generate a photorealistic 3D render of this new ${style} garden. Focus on textures and lighting.`;

    const result = await model.generateContent([
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
      { text: prompt },
    ]);

    const fullResponse = result.response.text();
    const [planMarkdown, visualDescription] = fullResponse.split('---IMAGE_PROMPT---');

    const seed = Math.floor(Math.random() * 1000000);
    const encodedPrompt = encodeURIComponent(visualDescription?.trim() || `A beautiful ${style} garden redesign`);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${seed}`;

    return NextResponse.json({ 
      plan: planMarkdown.trim(),
      imageUrl: imageUrl 
    });

  } catch (error: any) {
    console.error('❌ Error in /api/redesign:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}