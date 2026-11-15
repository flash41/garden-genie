/**
 * /lab/site-model — zero-cost test page for the site model geometry
 *
 * Gated by:
 *   1. LAB_ENABLED env var === 'true'
 *   2. A valid dedrab_invite cookie (checked via requireInvite)
 *
 * Returns 404 when the flag is off, so it is invisible in production
 * unless explicitly enabled.
 *
 * Everything runs client-side: the photo never leaves the browser, no
 * AI calls are made, no costs are incurred.
 */
import { headers, cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { requireInvite } from '@/lib/route-guards';
import { NextRequest } from 'next/server';
import SiteModelLabClient from './SiteModelLabClient';

export default async function SiteModelLabPage() {
  if (process.env.LAB_ENABLED !== 'true') notFound();

  // Build a minimal NextRequest-like object so requireInvite can read the cookie
  const cookieStore = await cookies();
  const inviteCode = cookieStore.get('dedrab_invite')?.value?.trim();

  if (!inviteCode || inviteCode.length > 100) notFound();

  // We call requireInvite directly with a stub request
  const stubUrl = 'http://localhost/lab/site-model';
  const stubReq = new NextRequest(stubUrl, {
    headers: { cookie: `dedrab_invite=${inviteCode}` },
  });
  const result = await requireInvite(stubReq);
  // requireInvite returns the code (string) on success or a NextResponse on failure
  if (typeof result !== 'string') notFound();

  return <SiteModelLabClient />;
}
