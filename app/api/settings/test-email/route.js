import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const body = await request.json();
    const { smtpHost, smtpPort, emailFrom, emailUsername, emailPassword, testRecipient } = body;

    // Validate required fields
    if (!smtpHost || !smtpPort || !emailFrom) {
      return NextResponse.json(
        { error: 'SMTP Host, Port, and From Address are required' },
        { status: 400 }
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: parseInt(smtpPort) === 465, // true for 465, false for other ports
      auth: emailUsername && emailPassword ? {
        user: emailUsername,
        pass: emailPassword,
      } : undefined,
      tls: {
        rejectUnauthorized: false, // For self-signed certificates in development
      },
    });

    // Verify connection configuration
    try {
      await transporter.verify();
    } catch (verifyError) {
      return NextResponse.json(
        { error: `SMTP connection failed: ${verifyError.message}` },
        { status: 500 }
      );
    }

    // Send test email
    const info = await transporter.sendMail({
      from: emailFrom,
      to: testRecipient || emailFrom,
      subject: 'Autoclik - Test Email',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #ffffff;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #00A859;
              margin-bottom: 10px;
            }
            .success-badge {
              display: inline-block;
              background-color: #00A859;
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 600;
              margin: 20px 0;
            }
            .details {
              background-color: #f8f9fa;
              border-left: 4px solid #00A859;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .details p {
              margin: 8px 0;
              font-size: 14px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e9ecef;
              font-size: 12px;
              color: #6c757d;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Autoclik</div>
              <h2 style="color: #495057; margin: 0;">SMTP Test Email</h2>
            </div>

            <div style="text-align: center;">
              <span class="success-badge">✓ Email Configuration Successful</span>
            </div>

            <p>This is a test email to verify your SMTP configuration in Autoclik.</p>

            <div class="details">
              <p><strong>SMTP Server:</strong> ${smtpHost}:${smtpPort}</p>
              <p><strong>From Address:</strong> ${emailFrom}</p>
              <p><strong>Test Recipient:</strong> ${testRecipient || emailFrom}</p>
              <p><strong>Date/Time:</strong> ${new Date().toLocaleString()}</p>
            </div>

            <p>If you received this email, your SMTP settings are configured correctly and Autoclik can send email notifications.</p>

            <div class="footer">
              <p>This email was sent from Autoclik Automation Platform</p>
              <p>Do not reply to this automated message</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Autoclik - SMTP Test Email

        This is a test email to verify your SMTP configuration.

        SMTP Server: ${smtpHost}:${smtpPort}
        From Address: ${emailFrom}
        Test Recipient: ${testRecipient || emailFrom}
        Date/Time: ${new Date().toLocaleString()}

        If you received this email, your SMTP settings are configured correctly.

        ---
        This email was sent from Autoclik Automation Platform
      `,
    });

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${testRecipient || emailFrom}`,
      messageId: info.messageId,
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send test email' },
      { status: 500 }
    );
  }
}
