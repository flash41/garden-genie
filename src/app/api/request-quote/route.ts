import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  const { sessionId, email, postcode, quotesRequested } = body as {
    sessionId?: string;
    email?: string;
    postcode?: string;
    quotesRequested?: number;
  };

  if (!email || !postcode || !sessionId) {
    return NextResponse.json({ success: false, error: 'email, postcode and sessionId are required' }, { status: 400 });
  }

  if (quotesRequested !== 1 && quotesRequested !== 3) {
    return NextResponse.json({ success: false, error: 'quotesRequested must be 1 or 3' }, { status: 400 });
  }

  // Look up design_records by session_id
  const { data: designRecord } = await supabase
    .from('design_records')
    .select('id, design_style, pdf_url, reference_number')
    .eq('session_id', sessionId)
    .maybeSingle();

  // Insert quote request
  const { data: quoteData, error: insertError } = await supabase
    .from('quote_requests')
    .insert({
      design_record_id: designRecord?.id || null,
      session_id: sessionId,
      email,
      postcode,
      quotes_requested: quotesRequested,
      confirmation_sent: false,
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('Quote request insert error:', insertError);
    return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
  }

  // Geocode postcode — non-blocking, coordinates are optional enrichment
  try {
    const geocodeUrl = 'https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(postcode) + '&limit=1';
    const geoResponse = await fetch(geocodeUrl, {
      headers: { 'User-Agent': 'Dedrab/1.0 (dedrab.com)' },
    });
    const geoData = await geoResponse.json();
    if (geoData && geoData.length > 0) {
      const latitude = parseFloat(geoData[0].lat);
      const longitude = parseFloat(geoData[0].lon);
      await supabase
        .from('quote_requests')
        .update({ latitude, longitude })
        .eq('id', quoteData.id);
    }
  } catch (geoErr) {
    console.error('Geocoding error (non-fatal):', geoErr);
  }

  const designStyle = designRecord?.design_style || 'Custom';
  const quotesLabel = quotesRequested === 1 ? '1 quote' : '3 quotes';
  const refNum = designRecord?.reference_number || null;
  const pdfUrl = designRecord?.pdf_url || null;

  const subject = refNum
    ? 'Your garden plan [' + refNum + '] — quote request confirmed'
    : 'Your Dedrab quote request is confirmed';

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
              <p style="margin:0 0 8px;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#b8962e;">Quote request received.</p>
              <h1 style="margin:0 0 24px;font-family:'Georgia',serif;font-size:28px;font-weight:400;color:#0a3d2b;line-height:1.25;">We&apos;re finding your landscaper</h1>

              ${refNum ? '<table cellpadding="0" cellspacing="0" style="margin-bottom:24px;background:#f0f4f0;padding:16px 20px;border-radius:4px;width:100%;border-left:3px solid #0a3d2b;"><tr><td style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#0a3d2b;padding-bottom:6px;font-weight:700;">Your reference number</td></tr><tr><td style="font-size:20px;color:#0a3d2b;font-family:monospace;font-weight:700;letter-spacing:1px;">' + refNum + '</td></tr><tr><td style="font-size:12px;color:#4a3f32;padding-top:6px;">Please quote this reference in any correspondence with us or your landscaper.</td></tr></table>' : ''}

              <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;border-left:3px solid #b8962e;padding-left:20px;">
                <tr>
                  <td style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8a7e6e;">Design Style</td>
                </tr>
                <tr>
                  <td style="font-size:18px;color:#0a3d2b;font-family:'Georgia',serif;padding-top:4px;">${designStyle}</td>
                </tr>
              </table>

              <p style="margin:0 0 20px;font-size:17px;line-height:1.75;color:#4a3f32;font-family:'Georgia',serif;">
                Thank you for your request. We will be in touch in the coming days with ${quotesLabel} from landscape professionals in your area.
              </p>

              <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;background:#f9f5ee;padding:16px 20px;border-radius:4px;width:100%;">
                <tr>
                  <td style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8a7e6e;padding-bottom:6px;">Your details</td>
                </tr>
                <tr>
                  <td style="font-size:14px;color:#4a3f32;line-height:1.7;">
                    Postcode: ${postcode}<br>
                    Contact email: ${email}<br>
                    Quotes requested: ${quotesLabel}
                  </td>
                </tr>
              </table>

              ${pdfUrl ? '<table cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr><td style="background:#0a3d2b;padding:12px 24px;border-radius:4px;"><a href="' + pdfUrl + '" style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#b8962e;text-decoration:none;">View your full garden plan &rarr;</a></td></tr></table>' : ''}

              <p style="margin:0 0 32px;font-size:17px;line-height:1.75;color:#4a3f32;font-family:'Georgia',serif;">
                Your garden design plan will be shared with each landscaper so they can provide an accurate, personalised quote.
              </p>
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
                You received this because you requested landscaping quotes via Dedrab.<br>
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

  try {
    const { error: emailError } = await resend.emails.send({
      from: 'Dedrab <noreply@dedrab.com>',
      to: [email],
      subject,
      html,
    });

    if (emailError) {
      console.error('Resend error:', emailError);
      // Don't fail the whole request — quote was saved
    } else {
      // Update confirmation_sent flag
      await supabase
        .from('quote_requests')
        .update({ confirmation_sent: true })
        .eq('id', quoteData.id);
    }
  } catch (err) {
    console.error('Email send error:', err);
    // Don't fail — quote was saved
  }

  return NextResponse.json({ success: true });
}
