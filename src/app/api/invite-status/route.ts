import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'code is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('invite_codes')
    .select('renders_used, max_renders')
    .eq('code', code.toUpperCase())
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({
    renders_used: data.renders_used,
    max_renders: data.max_renders,
    remaining: Math.max(0, data.max_renders - data.renders_used),
  });
}
