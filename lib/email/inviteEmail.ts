interface InviteEmailParams {
  recipientEmail: string;
  organizationName: string;
  inviterName: string;
  inviteUrl: string;
}

export function generateInviteEmailHtml({
  recipientEmail,
  organizationName,
  inviterName,
  inviteUrl,
}: InviteEmailParams): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Organization Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                You're Invited!
              </h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px;">
                Hello,
              </p>
              
              <p style="margin: 0 0 20px; font-size: 16px;">
                <strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on Scopebound.
              </p>
              
              <p style="margin: 0 0 30px; font-size: 16px;">
                Scopebound helps teams manage client projects with AI-powered intake forms and timeline generation.
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${inviteUrl}" style="display: inline-block; padding: 14px 32px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; font-size: 14px; color: #666;">
                Or copy and paste this URL into your browser:
              </p>
              <p style="margin: 10px 0 0; font-size: 14px; word-break: break-all; color: #10b981;">
                ${inviteUrl}
              </p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e5e5;">
              
              <p style="margin: 0; font-size: 13px; color: #999;">
                This invitation will expire in 7 days. If you did not expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 20px 40px; background-color: #f9fafb; text-align: center;">
              <p style="margin: 0; font-size: 13px; color: #666;">
                © ${new Date().getFullYear()} Scopebound. All rights reserved.
              </p>
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

export function generateInviteEmailText({
  recipientEmail,
  organizationName,
  inviterName,
  inviteUrl,
}: InviteEmailParams): string {
  return `
You're invited to join ${organizationName}!

${inviterName} has invited you to join ${organizationName} on Scopebound.

Scopebound helps teams manage client projects with AI-powered intake forms and timeline generation.

Accept your invitation by visiting:
${inviteUrl}

This invitation will expire in 7 days. If you did not expect this invitation, you can safely ignore this email.

© ${new Date().getFullYear()} Scopebound. All rights reserved.
  `.trim();
}
