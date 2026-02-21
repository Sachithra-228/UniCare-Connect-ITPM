/**
 * Branded HTML template for the verification email (UniCare Connect site colors).
 * Used when you send verification emails via your own provider (e.g. Resend, SendGrid)
 * instead of Firebase’s default. Firebase’s built-in email cannot be fully styled;
 * use this template with a custom send flow (e.g. Firebase Admin generateEmailVerificationLink + your sender).
 */
const PRIMARY = "#2563eb";
const PRIMARY_LIGHT = "#eff6ff";
const TEXT = "#1e293b";
const MUTED = "#64748b";

export function getVerificationEmailHtml(options: {
  verifyUrl: string;
  appName?: string;
}) {
  const { verifyUrl, appName = "UniCare Connect" } = options;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Verify your email – ${appName}</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background-color:#f8fafc;color:${TEXT};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.06);overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg, ${PRIMARY} 0%, #1d4ed8 100%);padding:28px 24px;text-align:center;">
              <span style="font-size:13px;font-weight:600;letter-spacing:0.12em;color:rgba(255,255,255,0.95);">${appName}</span>
              <h1 style="margin:12px 0 0;font-size:22px;font-weight:600;color:#ffffff;">Verify your email</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${TEXT};">Hello,</p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${TEXT};">Thanks for signing up. Click the button below to verify your email and get started.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="border-radius:10px;background-color:${PRIMARY};">
                    <a href="${verifyUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Verify email</a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:${MUTED};">If you didn’t create an account, you can ignore this email.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;background-color:${PRIMARY_LIGHT};border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:${MUTED};text-align:center;">${appName} – Student support ecosystem</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

export function getVerificationEmailText(options: { verifyUrl: string; appName?: string }) {
  const { verifyUrl, appName = "UniCare Connect" } = options;
  return [
    `${appName} – Verify your email`,
    "",
    "Hello,",
    "Thanks for signing up. Open the link below to verify your email:",
    verifyUrl,
    "",
    "If you didn't create an account, you can ignore this email.",
    "",
    `— ${appName}`,
  ].join("\n");
}
