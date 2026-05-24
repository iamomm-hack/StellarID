import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@stellarid.io';

const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Clean, modern dark-themed HTML email template for claim invitation
 */
function getClaimInvitationHtml(
  issuerName: string,
  credentialName: string,
  claimUrl: string,
  expiresAt: Date
): string {
  const formattedExpiry = expiresAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Claim Your StellarID Credential</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0b0e17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f5f5f0; -webkit-font-smoothing: antialiased;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0e17; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #121624; border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                <!-- Header -->
                <tr>
                  <td style="padding: 32px 32px 24px 32px; border-bottom: 1px solid rgba(255, 255, 255, 0.04); text-align: center;">
                    <span style="font-size: 24px; font-weight: 800; letter-spacing: 0.1em; color: #ff6a00; text-transform: uppercase;">STELLARID</span>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding: 40px 32px;">
                    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #ffffff; text-align: center; line-height: 1.3;">
                      You Received a Credential!
                    </h1>
                    <p style="margin: 0 0 24px 0; font-size: 14px; color: #a0a5b5; line-height: 1.6; text-align: center;">
                      <strong>${issuerName}</strong> has issued a digital credential to you on the StellarID platform.
                    </p>
                    
                    <!-- Credential Preview Card -->
                    <div style="background-color: rgba(255, 255, 255, 0.02); border: 1px dashed rgba(255, 106, 0, 0.2); border-radius: 12px; padding: 20px; margin-bottom: 32px; text-align: center;">
                      <span style="display: block; font-size: 10px; font-family: monospace; color: #ff6a00; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 8px;">Credential Type</span>
                      <strong style="display: block; font-size: 18px; color: #ffffff; font-weight: 700;">${credentialName}</strong>
                      <span style="display: block; font-size: 12px; color: #6e768a; margin-top: 6px;">Issued by ${issuerName}</span>
                    </div>

                    <!-- Button -->
                    <div style="text-align: center; margin-bottom: 32px;">
                      <a href="${claimUrl}" target="_blank" style="display: inline-block; background-color: #ff6a00; color: #0a0a0a; font-weight: 700; font-size: 14px; text-decoration: none; padding: 16px 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(255, 106, 0, 0.25); text-transform: uppercase; letter-spacing: 0.05em; transition: background-color 0.2s;">
                        Claim Your Credential
                      </a>
                    </div>

                    <p style="margin: 0 0 8px 0; font-size: 11px; color: #6e768a; text-align: center; line-height: 1.4;">
                      This claim link is unique to your email address.
                    </p>
                    <p style="margin: 0; font-size: 11px; color: #ff3333; text-align: center; line-height: 1.4; font-weight: bold;">
                      Notice: This invitation link expires on ${formattedExpiry}.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding: 24px; background-color: rgba(0, 0, 0, 0.2); border-t: 1px solid rgba(255,255,255,0.04); text-align: center;">
                    <p style="margin: 0; font-size: 11px; color: #4e5566;">
                      StellarID &copy; 2026. Decentralized Self-Sovereign Identity Protocol.
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
}

/**
 * Clean, modern dark-themed HTML email template for confirmation
 */
function getClaimConfirmationHtml(
  credentialName: string,
  txHash: string
): string {
  const explorerUrl = `https://stellar.expert/explorer/testnet/tx/${txHash}`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Credential Claimed Successfully</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0b0e17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f5f5f0; -webkit-font-smoothing: antialiased;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0e17; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #121624; border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                <!-- Header -->
                <tr>
                  <td style="padding: 32px 32px 24px 32px; border-bottom: 1px solid rgba(255, 255, 255, 0.04); text-align: center;">
                    <span style="font-size: 24px; font-weight: 800; letter-spacing: 0.1em; color: #adff2f; text-transform: uppercase;">STELLARID</span>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding: 40px 32px;">
                    <div style="text-align: center; margin-bottom: 24px;">
                      <span style="display: inline-block; background-color: rgba(173, 255, 47, 0.1); border: 1px solid rgba(173, 255, 47, 0.3); border-radius: 50%; padding: 12px; color: #adff2f;">
                        <!-- Checkmark SVG -->
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display: block;"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </span>
                    </div>
                    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #ffffff; text-align: center; line-height: 1.3;">
                      Credential Claimed!
                    </h1>
                    <p style="margin: 0 0 24px 0; font-size: 14px; color: #a0a5b5; line-height: 1.6; text-align: center;">
                      Your credential <strong>${credentialName}</strong> has been successfully claimed and minted on-chain.
                    </p>

                    <!-- Transaction Details -->
                    <div style="background-color: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 12px; padding: 16px; margin-bottom: 32px; word-break: break-all; font-family: monospace; font-size: 12px; text-align: center;">
                      <span style="display: block; font-size: 10px; color: #6e768a; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.1em;">Transaction Hash</span>
                      <a href="${explorerUrl}" target="_blank" style="color: #adff2f; text-decoration: none; word-wrap: break-word;">
                        ${txHash}
                      </a>
                    </div>

                    <!-- Button -->
                    <div style="text-align: center; margin-bottom: 16px;">
                      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" target="_blank" style="display: inline-block; background-color: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.1); color: #ffffff; font-weight: 600; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 8px; transition: all 0.2s;">
                        Go to Control Center
                      </a>
                    </div>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding: 24px; background-color: rgba(0, 0, 0, 0.2); border-t: 1px solid rgba(255,255,255,0.04); text-align: center;">
                    <p style="margin: 0; font-size: 11px; color: #4e5566;">
                      StellarID &copy; 2026. Decentralized Self-Sovereign Identity Protocol.
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
}

/**
 * Send claim invitation email to recipient
 */
export async function sendClaimInvitationEmail(
  email: string,
  issuerName: string,
  credentialName: string,
  claimUrl: string,
  expiresAt: Date
): Promise<boolean> {
  const html = getClaimInvitationHtml(issuerName, credentialName, claimUrl, expiresAt);

  if (!resend) {
    console.log('\n--- [MOCK EMAIL] ---');
    console.log(`To: ${email}`);
    console.log(`From: ${resendFromEmail}`);
    console.log(`Subject: Claim Your StellarID Credential: ${credentialName}`);
    console.log(`Claim Link: ${claimUrl}`);
    console.log(`Expires At: ${expiresAt.toISOString()}`);
    console.log('--------------------\n');
    return true;
  }

  try {
    const response = await resend.emails.send({
      from: resendFromEmail,
      to: email,
      subject: `Claim Your StellarID Credential: ${credentialName}`,
      html,
    });
    if (response.error) {
      console.error('[Email Service] Resend send invitation error:', response.error);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error('[Email Service] Resend send invitation failure:', err.message);
    return false;
  }
}

/**
 * Send claim confirmation email to recipient
 */
export async function sendClaimConfirmationEmail(
  email: string,
  credentialName: string,
  txHash: string
): Promise<boolean> {
  const html = getClaimConfirmationHtml(credentialName, txHash);

  if (!resend) {
    console.log('\n--- [MOCK EMAIL] ---');
    console.log(`To: ${email}`);
    console.log(`From: ${resendFromEmail}`);
    console.log(`Subject: Credential Claimed: ${credentialName}`);
    console.log(`Transaction Hash: ${txHash}`);
    console.log('--------------------\n');
    return true;
  }

  try {
    const response = await resend.emails.send({
      from: resendFromEmail,
      to: email,
      subject: `Credential Claimed Successfully: ${credentialName}`,
      html,
    });
    if (response.error) {
      console.error('[Email Service] Resend send confirmation error:', response.error);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error('[Email Service] Resend send confirmation failure:', err.message);
    return false;
  }
}

/**
 * Send bulk issuance summary email to organizer
 */
export async function sendBulkSummaryEmail(
  email: string,
  jobName: string,
  successCount: number,
  failedCount: number,
  errorReportUrl: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Bulk Issuance Job Summary</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0b0e17; font-family: sans-serif; color: #f5f5f0;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="padding: 40px 20px;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #121624; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 40px 32px;">
                <tr>
                  <td style="text-align: center; padding-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.04);">
                    <span style="font-size: 24px; font-weight: 800; color: #ff6a00; letter-spacing: 0.1em;">STELLARID</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 32px;">
                    <h1 style="font-size: 20px; color: #ffffff; margin: 0 0 16px 0; text-align: center;">Bulk Issuance Completed</h1>
                    <p style="font-size: 14px; color: #a0a5b5; line-height: 1.6; text-align: center;">
                      Your bulk issuance job <strong>${jobName}</strong> has finished processing.
                    </p>
                    
                    <div style="background-color: rgba(255,255,255,0.02); border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
                      <table width="100%" cellpadding="5">
                        <tr>
                          <td style="color: #6e768a; font-size: 14px;">Success Count:</td>
                          <td style="color: #adff2f; font-size: 18px; font-weight: bold;">${successCount}</td>
                        </tr>
                        <tr>
                          <td style="color: #6e768a; font-size: 14px;">Failed Count:</td>
                          <td style="color: #ff3333; font-size: 18px; font-weight: bold;">${failedCount}</td>
                        </tr>
                      </table>
                    </div>

                    ${failedCount > 0 ? `
                    <div style="text-align: center; margin-bottom: 24px;">
                      <a href="${errorReportUrl}" target="_blank" style="display: inline-block; background-color: #ff3333; color: #ffffff; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 24px; border-radius: 8px;">
                        Download Error Report
                      </a>
                    </div>
                    ` : ''}
                    
                    <div style="text-align: center;">
                      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/bulk-issue" target="_blank" style="display: inline-block; background-color: #ff6a00; color: #0a0a0a; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 8px;">
                        Go to Dashboard
                      </a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  if (!resend) {
    console.log('\n--- [MOCK SUMMARY EMAIL] ---');
    console.log(`To: ${email}`);
    console.log(`Subject: Bulk Issuance Completed: ${jobName}`);
    console.log(`Results: ${successCount} Succeeded, ${failedCount} Failed`);
    console.log(`Error Report: ${errorReportUrl}`);
    console.log('----------------------------\n');
    return true;
  }

  try {
    const response = await resend.emails.send({
      from: resendFromEmail,
      to: email,
      subject: `Bulk Issuance Job Completed: ${jobName}`,
      html,
    });
    return !response.error;
  } catch (err: any) {
    console.error('[Email Service] Resend send summary failure:', err.message);
    return false;
  }
}

/**
 * Send domain verification email (fallback method)
 */
export async function sendDomainVerificationEmail(
  email: string,
  domain: string,
  token: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Domain Ownership - StellarID</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0b0e17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f5f5f0;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0e17; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #121624; border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); padding: 40px 32px;">
                <tr>
                  <td style="text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.04); padding-bottom: 24px;">
                    <span style="font-size: 24px; font-weight: 800; color: #ff6a00; letter-spacing: 0.1em; text-transform: uppercase;">STELLARID</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 32px;">
                    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #ffffff; text-align: center;">
                      Verify Your Domain
                    </h1>
                    <p style="margin: 0 0 24px 0; font-size: 14px; color: #a0a5b5; line-height: 1.6; text-align: center;">
                      You are receiving this email to verify ownership of the domain <strong>${domain}</strong> for your StellarID Issuer Profile.
                    </p>
                    
                    <div style="background-color: rgba(255, 255, 255, 0.02); border: 1px dashed rgba(255, 106, 0, 0.3); border-radius: 12px; padding: 24px; margin-bottom: 32px; text-align: center;">
                      <span style="display: block; font-size: 11px; font-family: monospace; color: #ff6a00; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 8px;">Verification Token</span>
                      <strong style="display: block; font-size: 22px; color: #ffffff; font-family: monospace; letter-spacing: 0.05em;">${token}</strong>
                    </div>

                    <p style="margin: 0 0 24px 0; font-size: 13px; color: #8e95a5; line-height: 1.6; text-align: center;">
                      Please enter this verification token in your StellarID Control Panel to confirm ownership.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.04); text-align: center;">
                    <p style="margin: 0; font-size: 11px; color: #4e5566;">
                      StellarID &copy; 2026. Decentralized Self-Sovereign Identity Protocol.
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

  if (!resend) {
    console.log('\n--- [MOCK EMAIL] ---');
    console.log(`To: ${email}`);
    console.log(`Subject: Verify Domain Ownership - StellarID`);
    console.log(`Token: ${token}`);
    console.log('--------------------\n');
    return true;
  }

  try {
    const response = await resend.emails.send({
      from: resendFromEmail,
      to: email,
      subject: `Verify Domain Ownership for ${domain} - StellarID`,
      html,
    });
    return !response.error;
  } catch (err: any) {
    console.error('[Email Service] Resend send domain verification email failure:', err.message);
    return false;
  }
}

/**
 * Send endorsement notification email
 */
export async function sendEndorsementReceivedEmail(
  email: string,
  endorserName: string,
  endorsedName: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>New Endorsement Received - StellarID</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0b0e17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f5f5f0;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0e17; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #121624; border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); padding: 40px 32px;">
                <tr>
                  <td style="text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.04); padding-bottom: 24px;">
                    <span style="font-size: 24px; font-weight: 800; color: #ff6a00; letter-spacing: 0.1em; text-transform: uppercase;">STELLARID</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 32px;">
                    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #ffffff; text-align: center;">
                      New Peer Endorsement!
                    </h1>
                    <p style="margin: 0 0 24px 0; font-size: 14px; color: #a0a5b5; line-height: 1.6; text-align: center;">
                      Congratulations <strong>${endorsedName}</strong>! You have received a peer endorsement from verified issuer <strong>${endorserName}</strong>.
                    </p>
                    <p style="margin: 0 0 24px 0; font-size: 13px; color: #8e95a5; line-height: 1.6; text-align: center;">
                      Gathering 5 peer endorsements automatically upgrades your verification status to <strong>Community Verified</strong>.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.04); text-align: center;">
                    <p style="margin: 0; font-size: 11px; color: #4e5566;">
                      StellarID &copy; 2026. Decentralized Self-Sovereign Identity Protocol.
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

  if (!resend) {
    console.log('\n--- [MOCK EMAIL] ---');
    console.log(`To: ${email}`);
    console.log(`Subject: New Endorsement Received - StellarID`);
    console.log(`Endorser: ${endorserName}`);
    console.log('--------------------\n');
    return true;
  }

  try {
    const response = await resend.emails.send({
      from: resendFromEmail,
      to: email,
      subject: `New Endorsement Received from ${endorserName} - StellarID`,
      html,
    });
    return !response.error;
  } catch (err: any) {
    console.error('[Email Service] Resend send endorsement email failure:', err.message);
    return false;
  }
}

/**
 * Send verification revoked email
 */
export async function sendVerificationRevokedEmail(
  email: string,
  issuerName: string,
  reason: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Issuer Verification Revoked - StellarID</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0b0e17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f5f5f0;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0e17; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #121624; border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); padding: 40px 32px;">
                <tr>
                  <td style="text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.04); padding-bottom: 24px;">
                    <span style="font-size: 24px; font-weight: 800; color: #ff3333; letter-spacing: 0.1em; text-transform: uppercase;">STELLARID</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 32px;">
                    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #ff3333; text-align: center;">
                      Verification Status Revoked
                    </h1>
                    <p style="margin: 0 0 24px 0; font-size: 14px; color: #a0a5b5; line-height: 1.6; text-align: center;">
                      The verification status of your issuer profile <strong>${issuerName}</strong> has been revoked by an administrator.
                    </p>
                    
                    <div style="background-color: rgba(255, 51, 51, 0.05); border: 1px solid rgba(255, 51, 51, 0.2); border-radius: 12px; padding: 20px; margin-bottom: 32px; text-align: center;">
                      <span style="display: block; font-size: 10px; color: #ff8888; text-transform: uppercase; margin-bottom: 6px; font-family: monospace;">Reason for Revocation</span>
                      <p style="margin: 0; font-size: 14px; color: #ffffff; line-height: 1.5;">${reason}</p>
                    </div>

                    <p style="margin: 0; font-size: 12px; color: #8e95a5; line-height: 1.5; text-align: center;">
                      If you believe this was an error, please reach out to the support team or submit a new domain verification request.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.04); text-align: center;">
                    <p style="margin: 0; font-size: 11px; color: #4e5566;">
                      StellarID &copy; 2026. Decentralized Self-Sovereign Identity Protocol.
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

  if (!resend) {
    console.log('\n--- [MOCK EMAIL] ---');
    console.log(`To: ${email}`);
    console.log(`Subject: Issuer Verification Revoked - StellarID`);
    console.log(`Reason: ${reason}`);
    console.log('--------------------\n');
    return true;
  }

  try {
    const response = await resend.emails.send({
      from: resendFromEmail,
      to: email,
      subject: `Issuer Verification Revoked - StellarID`,
      html,
    });
    return !response.error;
  } catch (err: any) {
    console.error('[Email Service] Resend send revocation email failure:', err.message);
    return false;
  }
}


