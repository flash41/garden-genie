/**
 * scripts/regen-pdf.ts
 *
 * One-off script to regenerate a Garden Plan PDF for a given reference_number.
 *
 * Usage:
 *   npx tsx scripts/regen-pdf.ts DED-202605-QFEG
 *
 * Reads .env.local for NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { createClient } from '@supabase/supabase-js';
import { GardenPlanPDF } from '../src/components/GardenPlanPDF';

// ── env ──────────────────────────────────────────────────────────────────────

// Load .env.local from project root (same vars Next.js uses)
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ── helpers ──────────────────────────────────────────────────────────────────

async function fetchImageAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const mime = res.headers.get('content-type') || 'image/png';
  return `data:${mime};base64,${buf.toString('base64')}`;
}

async function getSignedUrl(bucket: string, storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, 3600);
  if (error || !data?.signedUrl) throw new Error(`Signed URL failed for ${bucket}/${storagePath}: ${error?.message}`);
  return data.signedUrl;
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const ref = process.argv[2];
  if (!ref) {
    console.error('Usage: npx tsx scripts/regen-pdf.ts <REFERENCE_NUMBER>');
    process.exit(1);
  }

  console.log(`[regen-pdf] Looking up design_records for ${ref}...`);

  // 1. Fetch the design record
  const { data: record, error: recErr } = await supabase
    .from('design_records')
    .select('id, session_id, full_report, render_url, design_style, email, reference_number')
    .eq('reference_number', ref)
    .limit(1)
    .single();

  if (recErr || !record) {
    console.error('[regen-pdf] design_records lookup failed:', recErr?.message ?? 'not found');
    process.exit(1);
  }

  console.log(`[regen-pdf] Found record id=${record.id}, session=${record.session_id}`);

  const doc = record.full_report;
  if (!doc) {
    console.error('[regen-pdf] full_report is null — cannot generate PDF');
    process.exit(1);
  }

  // 2. Look for aerial_url on pipeline_jobs (linked by session_id or reference)
  const { data: job } = await supabase
    .from('pipeline_jobs')
    .select('aerial_url, render_url')
    .eq('reference_number', ref)
    .limit(1)
    .maybeSingle();

  // 3. Fetch images as base64
  console.log('[regen-pdf] Fetching images...');

  // Render image — try pipeline_jobs first, fall back to design_records
  const renderStoragePath = job?.render_url || record.render_url;
  let renderBase64 = '';
  if (renderStoragePath) {
    try {
      // If it's already a full URL, fetch directly; otherwise get a signed URL
      const url = renderStoragePath.startsWith('http')
        ? renderStoragePath
        : await getSignedUrl('pipeline-assets', renderStoragePath);
      renderBase64 = await fetchImageAsBase64(url);
      console.log(`[regen-pdf] Render image fetched (${renderBase64.length} chars)`);
    } catch (e: any) {
      console.warn('[regen-pdf] Could not fetch render image:', e.message);
    }
  }

  // Aerial image
  let aerialBase64 = '';
  if (job?.aerial_url) {
    try {
      const url = job.aerial_url.startsWith('http')
        ? job.aerial_url
        : await getSignedUrl('pipeline-assets', job.aerial_url);
      aerialBase64 = await fetchImageAsBase64(url);
      console.log(`[regen-pdf] Aerial image fetched (${aerialBase64.length} chars)`);
    } catch (e: any) {
      console.warn('[regen-pdf] Could not fetch aerial image:', e.message);
    }
  }

  // Logo
  const logoPath = path.resolve(__dirname, '..', 'public', 'dd_logo.png');
  let logoBase64 = '';
  if (fs.existsSync(logoPath)) {
    const logoBuf = fs.readFileSync(logoPath);
    logoBase64 = `data:image/png;base64,${logoBuf.toString('base64')}`;
  }

  // 4. Render PDF
  console.log('[regen-pdf] Rendering PDF...');

  const element = React.createElement(GardenPlanPDF, {
    doc,
    imageBase64: renderBase64,
    aerialImageUrl: aerialBase64 || undefined,
    logoBase64: logoBase64 || undefined,
    style: record.design_style || '',
    referenceNumber: ref,
  });

  const pdfBuffer = await renderToBuffer(element as any);
  console.log(`[regen-pdf] PDF rendered: ${pdfBuffer.length} bytes`);

  if (pdfBuffer.length < 5000) {
    console.error('[regen-pdf] PDF suspiciously small — aborting upload');
    process.exit(1);
  }

  // 5. Upload to pdfs bucket
  const filePath = `${ref}.pdf`;
  console.log(`[regen-pdf] Uploading to pdfs/${filePath}...`);

  const { error: uploadErr } = await supabase.storage
    .from('pdfs')
    .upload(filePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadErr) {
    console.error('[regen-pdf] Upload failed:', uploadErr.message);
    process.exit(1);
  }

  const publicUrl = `${SUPABASE_URL!.replace(/\/$/, '')}/storage/v1/object/public/pdfs/${filePath}`;
  console.log(`[regen-pdf] Uploaded. Public URL: ${publicUrl}`);

  // 6. Patch design_records.pdf_url
  const { error: updateErr } = await supabase
    .from('design_records')
    .update({ pdf_url: publicUrl })
    .eq('reference_number', ref);

  if (updateErr) {
    console.error('[regen-pdf] Failed to update design_records.pdf_url:', updateErr.message);
    process.exit(1);
  }

  console.log(`[regen-pdf] design_records.pdf_url updated.`);

  // 7. Quick sanity check — fetch the PDF URL
  const checkRes = await fetch(publicUrl, { method: 'HEAD' });
  console.log(`[regen-pdf] HEAD ${publicUrl} => ${checkRes.status} (${checkRes.headers.get('content-length')} bytes)`);

  if (checkRes.status === 200) {
    console.log('[regen-pdf] Done. PDF is live and serving.');
  } else {
    console.warn('[regen-pdf] PDF URL returned non-200 — check bucket permissions.');
  }
}

main().catch((err) => {
  console.error('[regen-pdf] Unhandled error:', err);
  process.exit(1);
});
