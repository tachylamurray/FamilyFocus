/**
 * Test script to verify email configuration
 * Run with: node scripts/test-email.js
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('Testing email configuration...\n');

  // Check Gmail configuration
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  // Check SMTP configuration
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (gmailUser && gmailAppPassword) {
    console.log('✅ Gmail configuration found');
    console.log(`   User: ${gmailUser}`);
    console.log(`   App Password: ${gmailAppPassword.substring(0, 4)}...${gmailAppPassword.substring(gmailAppPassword.length - 4)}`);
    
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailAppPassword
        }
      });

      // Verify connection
      await transporter.verify();
      console.log('✅ Gmail connection verified successfully!\n');
      
      // Ask for test email
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      readline.question('Enter an email address to send a test email: ', async (testEmail) => {
        try {
          const info = await transporter.sendMail({
            from: gmailUser,
            to: testEmail,
            subject: 'Test Email - Family Finance',
            html: '<h1>Email Configuration Test</h1><p>If you received this email, your email configuration is working correctly!</p>'
          });
          
          console.log(`\n✅ Test email sent successfully!`);
          console.log(`   Message ID: ${info.messageId}`);
          console.log(`   Check ${testEmail} for the test email.\n`);
        } catch (error) {
          console.error(`\n❌ Error sending test email:`, error.message);
        }
        readline.close();
      });
    } catch (error) {
      console.error('❌ Gmail connection failed:', error.message);
      console.error('\nTroubleshooting:');
      console.error('1. Make sure 2-Step Verification is enabled on your Google Account');
      console.error('2. Verify the App Password is correct (16 characters, no spaces)');
      console.error('3. Check that "Less secure app access" is not required (App Passwords should work)');
    }
  } else if (smtpHost && smtpPort && smtpUser && smtpPassword) {
    console.log('✅ SMTP configuration found');
    console.log(`   Host: ${smtpHost}`);
    console.log(`   Port: ${smtpPort}`);
    console.log(`   User: ${smtpUser}`);
    
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(smtpPort),
        secure: Number(smtpPort) === 465,
        auth: {
          user: smtpUser,
          pass: smtpPassword
        }
      });

      await transporter.verify();
      console.log('✅ SMTP connection verified successfully!\n');
    } catch (error) {
      console.error('❌ SMTP connection failed:', error.message);
    }
  } else {
    console.log('❌ No email configuration found');
    console.log('\nTo set up email, add one of the following to your .env file:');
    console.log('\nOption 1: Gmail');
    console.log('GMAIL_USER="your-email@gmail.com"');
    console.log('GMAIL_APP_PASSWORD="your-16-character-app-password"');
    console.log('\nOption 2: SMTP');
    console.log('SMTP_HOST="smtp.gmail.com"');
    console.log('SMTP_PORT="587"');
    console.log('SMTP_USER="your-email@gmail.com"');
    console.log('SMTP_PASSWORD="your-password"');
    console.log('SMTP_FROM="your-email@gmail.com"');
  }
}

testEmail().catch(console.error);



