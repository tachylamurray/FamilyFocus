/**
 * Email utility for sending password reset codes
 * Uses SendGrid API for reliable email delivery
 */

import sgMail from "@sendgrid/mail";

export async function sendPasswordResetCode(
  email: string,
  code: string
): Promise<void> {
  const sendGridApiKey = process.env.SENDGRID_API_KEY;
  const sendGridFromEmail = process.env.SENDGRID_FROM_EMAIL;

  // Always log to console for development/debugging
  console.log("=".repeat(60));
  console.log("📧 PASSWORD RESET CODE");
  console.log("=".repeat(60));
  console.log(`Email: ${email}`);
  console.log(`Code: ${code}`);
  console.log(`Expires in: 15 minutes`);
  console.log("=".repeat(60));

  // Check if SendGrid is configured
  if (!sendGridApiKey || !sendGridFromEmail) {
    console.warn("⚠️  SendGrid not configured. Email not sent.");
    console.warn("   To enable email sending:");
    console.warn("   1. Create a SendGrid account at https://sendgrid.com");
    console.warn("   2. Generate an API key in the SendGrid dashboard");
    console.warn("   3. Verify your sender email address");
    console.warn("   4. Add to .env: SENDGRID_API_KEY and SENDGRID_FROM_EMAIL");
    console.warn("   For now, the code is logged above. Use it to test the password reset flow.");
    return;
  }

  try {
    // Set SendGrid API key
    sgMail.setApiKey(sendGridApiKey);

    // Prepare email message
    const msg = {
      to: email,
      from: sendGridFromEmail,
      subject: "Password Reset Code - Family Finance",
      html: generateResetEmailTemplate(code)
    };

    // Send email via SendGrid
    const [response] = await sgMail.send(msg);
    
    console.log("✅ Email sent successfully via SendGrid");
    console.log(`   Status Code: ${response.statusCode}`);
    console.log(`   Check the inbox for: ${email}`);
  } catch (error: any) {
    console.error("❌ Error sending email via SendGrid:", error.message || error);
    
    // Log detailed error information if available
    if (error.response) {
      console.error("   Response body:", JSON.stringify(error.response.body, null, 2));
    }
    
    // Don't throw - we've already logged the code to console
    // This allows the password reset flow to continue even if email fails
  }
}

function generateResetEmailTemplate(code: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .code { font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 8px; padding: 20px; background-color: white; border: 2px dashed #10b981; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>You requested to reset your password for your Family Finance account.</p>
          <p>Use the following code to verify your identity:</p>
          <div class="code">${code}</div>
          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>Family Finance Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

