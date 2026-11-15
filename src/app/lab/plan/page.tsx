/**
 * /lab/plan — Generate and display a full planting plan.
 *
 * Gated by:
 *   1. LAB_ENABLED env var === 'true'
 *   2. A valid dedrab_invite cookie (checked via requireInvite)
 *
 * Returns 404 when the flag is off, invisible in production.
 * Everything runs client-side after a minimal server gate check.
 */
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { requireInvite } from '@/lib/route-guards';
import { NextRequest } from 'next/server';
import PlanLabClient from './PlanLabClient';

export default async function PlanLabPage() {
  if (process.env.LAB_ENABLED !== 'true') notFound();

  const cookieStore = await cookies();
  const inviteCode = cookieStore.get('dedrab_invite')?.value?.trim();

  if (!inviteCode || inviteCode.length > 100) notFound();

  const stubReq = new NextRequest('http://localhost/lab/plan', {
    headers: { cookie: `dedrab_invite=${inviteCode}` },
  });
  const result = await requireInvite(stubReq);
  if (typeof result !== 'string') notFound();

  return <PlanLabClient />;
}
