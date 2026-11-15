/**
 * plan-email.ts — Send the plan-ready email.
 *
 * Copied from src/inngest/functions/pipeline.ts sendPlanReadyEmail.
 * Called from the garden-render function once the render completes or fails
 * (so the user always gets the email regardless of render outcome).
 */

const PLAN_READY_EMAIL_HTML = (params: {
  planTitle: string;
  resumeUrl: string;
}) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Garden Plan is Ready</title>
</head>
<body style="margin:0;padding:0;background:#F4EFE4;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4EFE4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background:#0a3d2b;padding:36px 48px;text-align:center;">
              <div style="font-family:'Georgia',serif;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:4px;text-transform:uppercase;">Dedrab</div>
              <div style="font-size:10px;color:#D4AF37;letter-spacing:4px;text-transform:uppercase;margin-top:6px;">Garden Inspiration</div>
            </td>
          </tr>
          <tr><td style="height:3px;background:#b8962e;"></td></tr>
          <tr>
            <td style="background:#ffffff;padding:48px 48px 40px;">
              <p style="margin:0 0 8px;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#b8962e;">Your garden plan is ready</p>
              <h1 style="margin:0 0 24px;font-family:'Georgia',serif;font-size:28px;font-weight:400;color:#0a3d2b;line-height:1.25;">${params.planTitle}</h1>
              <p style="margin:0 0 20px;font-size:17px;line-height:1.75;color:#4a3f32;font-family:'Georgia',serif;">
                Your planting plan, layout, and shopping list are waiting for you. Click below to view your plan.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="background:#0a3d2b;padding:0;">
                    <a href="${params.resumeUrl}" style="display:inline-block;padding:14px 32px;font-family:'Arial',sans-serif;font-size:12px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:#b8962e;text-decoration:none;">Open Your Garden Plan</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:13px;line-height:1.65;color:#8a7e6e;font-family:'Georgia',serif;">
                The link stays live. Open it on your phone, your laptop, or forward it to whoever is doing the work.
              </p>
            </td>
          </tr>
          <tr><td style="height:1px;background:#EDE6D3;"></td></tr>
          <tr>
            <td style="background:#f9f5ee;padding:28px 48px;text-align:center;">
              <p style="margin:0 0 8px;font-family:'Georgia',serif;font-size:14px;font-weight:700;color:#0a3d2b;letter-spacing:2px;text-transform:uppercase;">Dedrab</p>
              <p style="margin:0;font-size:11px;color:#8a7e6e;line-height:1.6;">
                You received this because you asked us to put together a garden plan for you.
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

export async function sendPlanReadyEmail(params: {
  to: string;
  planTitle: string;
  resumeUrl: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    return { ok: false, error: 'RESEND_API_KEY missing' };
  }
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: 'Dedrab <noreply@dedrab.com>',
      to: [params.to],
      subject: `Your Garden Plan is ready`,
      html: PLAN_READY_EMAIL_HTML(params),
    });
    if (error) {
      return { ok: false, error: error.message || 'Resend send failed' };
    }
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown email send error' };
  }
}
