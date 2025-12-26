/**
 * Email utility for sending password reset codes
 * In development, logs to console
 * In production, integrate with email service (SendGrid, AWS SES, etc.)
 */

export async function sendPasswordResetCode(
  email: string,
  code: string
): Promise<void> {
  const isDevelopment = process.env.NODE_ENV !== "production";

  if (isDevelopment) {
    // In development, log the code to console
    console.log("=".repeat(60));
    console.log("📧 PASSWORD RESET CODE (Development Mode)");
    console.log("=".repeat(60));
    console.log(`Email: ${email}`);
    console.log(`Code: ${code}`);
    console.log(`Expires in: 15 minutes`);
    console.log("=".repeat(60));
    return;
  }

  // Production: Integrate with email service
  // Example with SendGrid:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send({
  //   to: email,
  //   from: process.env.FROM_EMAIL,
  //   subject: 'Password Reset Code',
  //   html: generateResetEmailTemplate(code)
  // });

  // For now, in production without email service configured, log it
  console.log(`Password reset code for ${email}: ${code}`);
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

