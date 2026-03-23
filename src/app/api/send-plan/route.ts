import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  let recipientEmail: string, pdfBase64: string, planTitle: string, designStyle: string;
  try {
    ({ recipientEmail, pdfBase64, planTitle, designStyle } = await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!recipientEmail || !pdfBase64) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const payloadSize = pdfBase64 ? Buffer.byteLength(pdfBase64, 'utf8') : 0;
  console.log('[send-plan] PDF payload size (bytes):', payloadSize);

  if (payloadSize > 3 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'PDF is too large to send by email. Please download it directly instead.' },
      { status: 413 }
    );
  }

  const subject = `Your Dedrab Garden Vision — ${planTitle || 'Garden Design Plan'}`;

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

  // Strip data URL prefix if present
  const base64Data = pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Dedrab <noreply@dedrab.com>',
      to: [recipientEmail],
      subject,
      html,
      attachments: [
        {
          filename: 'dedrabed-garden-plan.pdf',
          content: base64Data,
        },
      ],
    });

    if (error) {
      console.error('Resend error:', JSON.stringify(error));
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err: unknown) {
    console.error('Send plan error:', JSON.stringify(err));
    return NextResponse.json(
      { error: 'Failed to send email', details: String(err) },
      { status: 500 }
    );
  }
}
