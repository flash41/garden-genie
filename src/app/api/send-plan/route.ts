import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabase-server';
import { rateLimit } from '@/lib/rate-limit';
import {
  REFERENCE_RE,
  MAX_UPLOAD_BYTES,
  escapeHtml,
  isValidEmail,
  limitOr429,
  parseOwnStorageUrl,
} from '@/lib/route-guards';

export const dynamic = 'force-dynamic';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

// SECURITY (Nov 2026): this route used to email ANY address, with a
// caller-supplied title inserted as raw HTML and ANY caller-supplied URL
// fetched and attached. It now:
//   - only attaches a PDF from our own public `pdfs` bucket,
//   - only for a plan that exists in design_records,
//   - takes the title/style from that record, never from the caller,
//   - accepts one plain recipient address,
//   - is rate limited per IP and per plan.
// The recipient stays caller-chosen because "share with a friend" needs it.
export async function POST(req: NextRequest) {
  const limited = await limitOr429(req, 'send-plan', 5, 60 * 60 * 1000);
  if (limited) return limited;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { recipientEmail, pdfUrl } = body as { recipientEmail?: unknown; pdfUrl?: unknown };

  if (!isValidEmail(recipientEmail)) {
    return NextResponse.json({ error: 'A valid recipient email is required' }, { status: 400 });
  }

  const parsedPdfUrl = parseOwnStorageUrl(pdfUrl, { publicBucket: 'pdfs' });
  const fileName = parsedPdfUrl ? decodeURIComponent(parsedPdfUrl.pathname.split('/').pop() || '') : '';
  const referenceNumber = fileName.endsWith('.pdf') ? fileName.slice(0, -4) : '';
  if (!parsedPdfUrl || !REFERENCE_RE.test(referenceNumber)) {
    return NextResponse.json({ error: 'Invalid plan link' }, { status: 400 });
  }
  // Rebuild the address ourselves: no query string, no caller-controlled parts.
  const safePdfUrl = parsedPdfUrl.origin + '/storage/v1/object/public/pdfs/' + referenceNumber + '.pdf';

  const { data: record } = await supabaseAdmin
    .from('design_records')
    .select('design_style')
    .eq('reference_number', referenceNumber)
    .limit(1)
    .maybeSingle();
  if (!record) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  }

  const planLimit = await rateLimit({
    key: `send-plan:plan:${referenceNumber}`,
    limit: 6,
    windowMs: 24 * 60 * 60 * 1000,
  });
  if (!planLimit.allowed) {
    return NextResponse.json(
      { error: 'rate_limited', message: 'This plan has been emailed several times today. Please try again tomorrow.' },
      { status: 429 },
    );
  }

  // Title and style come from our own record. Escaped for the HTML body.
  const rawStyle = String(record.design_style || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 80);
  const subjectPlain = `Your Dedrab Garden Vision - ${rawStyle ? rawStyle + ' Garden Plan' : 'Garden Design Plan'}`;
  const designStyle = escapeHtml(rawStyle);
  const planTitle = designStyle ? designStyle + ' Garden Plan' : 'Garden Design Plan';
  const subject = escapeHtml(subjectPlain);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#F4EFE4;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4EFE4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#0a3d2b;padding:36px 48px;text-align:center;">
              <div style="font-family:'Georgia',serif;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:4px;text-transform:uppercase;">Dedrab</div>
              <div style="font-size:10px;color:#D4AF37;letter-spacing:4px;text-transform:uppercase;margin-top:6px;">Garden Inspiration</div>
            </td>
          </tr>

          <!-- Gold rule -->
          <tr><td style="height:3px;background:#b8962e;"></td></tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:48px 48px 40px;">
              <p style="margin:0 0 8px;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#b8962e;">Your garden vision is ready.</p>
              <h1 style="margin:0 0 24px;font-family:'Georgia',serif;font-size:28px;font-weight:400;color:#0a3d2b;line-height:1.25;">${planTitle || 'Garden Design Plan'}</h1>

              <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;border-left:3px solid #b8962e;padding-left:20px;">
                <tr>
                  <td style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8a7e6e;">Design Style</td>
                </tr>
                <tr>
                  <td style="font-size:18px;color:#0a3d2b;font-family:'Georgia',serif;padding-top:4px;">${designStyle || 'Custom'}</td>
                </tr>
              </table>

              <p style="margin:0 0 20px;font-size:17px;line-height:1.75;color:#4a3f32;font-family:'Georgia',serif;">
                Your personalised garden design proposal is attached to this email as a PDF. It includes your site analysis, planting specification, spatial layout, and phased implementation plan.
              </p>
              <p style="margin:0 0 32px;font-size:17px;line-height:1.75;color:#4a3f32;font-family:'Georgia',serif;">
                Download it, print it out, or forward it to your gardener or local nursery — everything they need is inside.
              </p>

              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#0a3d2b;padding:14px 32px;">
                    <span style="font-family:'Arial',sans-serif;font-size:11px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:#b8962e;">See your full plan in the PDF attachment</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="height:1px;background:#EDE6D3;"></td></tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9f5ee;padding:28px 48px;text-align:center;">
              <p style="margin:0 0 8px;font-family:'Georgia',serif;font-size:14px;font-weight:700;color:#0a3d2b;letter-spacing:2px;text-transform:uppercase;">Dedrab</p>
              <p style="margin:0 0 14px;font-size:11px;color:#b8962e;letter-spacing:3px;text-transform:uppercase;">dedrab.com</p>
              <p style="margin:0;font-size:11px;color:#8a7e6e;line-height:1.6;">
                You received this because a garden plan was shared with you via Dedrab.<br>
                If you didn&apos;t request this, you can safely ignore it.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  // Fetch the PDF server-side from our own storage (address rebuilt above).
  let pdfBuffer: Buffer;
  try {
    const pdfRes = await fetch(safePdfUrl, { redirect: 'error' });
    if (!pdfRes.ok) throw new Error('PDF fetch failed: ' + pdfRes.status);
    pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
    if (pdfBuffer.byteLength > MAX_UPLOAD_BYTES) throw new Error('PDF too large');
    if (pdfBuffer.subarray(0, 5).toString('latin1') !== '%PDF-') throw new Error('Not a PDF');
  } catch (err) {
    console.error('[send-plan] Failed to fetch PDF:', err);
    return NextResponse.json({ error: 'Could not retrieve PDF for attachment' }, { status: 502 });
  }

  try {
    const { data, error } = await getResend().emails.send({
      from: 'Dedrab <noreply@dedrab.com>',
      to: [recipientEmail],
      subject: subjectPlain,
      html,
      attachments: [
        {
          filename: 'dedrabed-garden-plan.pdf',
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error('Resend error:', JSON.stringify(error));
      return NextResponse.json({ error: 'send_failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err: unknown) {
    console.error('Send plan error:', JSON.stringify(err));
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
