import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing imageUrl' }, { status: 400 });
    }

    const response = await fetch(imageUrl, {
      headers: { 'User-Agent': 'GardenAI/1.0' },
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Image service returned ${response.status}` },
        { status: 502 }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const dataUrl = `data:${contentType};base64,${base64}`;

    return NextResponse.json({ dataUrl });

  } catch (error: any) {
    console.error('❌ Image proxy error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}