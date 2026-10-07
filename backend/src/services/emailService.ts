import nodemailer, { Transporter } from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

class EmailService {
  private transporter: Transporter | null = null;
  private enabled: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const host = process.env.EMAIL_HOST;
    const port = parseInt(process.env.EMAIL_PORT || '587');
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASSWORD;

    if (host && user && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465, // true for 465, false for other ports
          auth: { user, pass },
        });

        this.enabled = true;
        console.log('[EmailService] Initialized successfully');
      } catch (err) {
        console.error('[EmailService] Failed to initialize:', err);
        this.enabled = false;
      }
    } else {
      console.warn('[EmailService] Email configuration missing. Email service disabled.');
      this.enabled = false;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, resetToken: string, resetUrl: string): Promise<boolean> {
    if (!this.enabled || !this.transporter) {
      console.warn('[EmailService] Email service disabled. Reset token:', resetToken);
      return false;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@smarthealth.com',
        to: email,
        subject: 'SmartHealth - Password Reset Request',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0284c7;">Password Reset Request</h2>
            <p>You have requested to reset your password for your SmartHealth account.</p>
            <p>Click the link below to reset your password:</p>
            <p>
              <a href="${resetUrl}" style="background: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Reset Password
              </a>
            </p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you did not request this password reset, please ignore this email.</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 12px;">
              This is an automated email from SmartHealth. Please do not reply.
            </p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`[EmailService] Password reset email sent to ${email}`);
      return true;
    } catch (err) {
      console.error('[EmailService] Failed to send password reset email:', err);
      return false;
    }
  }

  /**
   * Send security notification email
   */
  async sendSecurityNotification(email: string, subject: string, message: string): Promise<boolean> {
    if (!this.enabled || !this.transporter) {
      console.warn('[EmailService] Email service disabled. Security notification:', subject);
      return false;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@smarthealth.com',
        to: email,
        subject: `SmartHealth Security Alert: ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Security Alert</h2>
            <p>${message}</p>
            <p>If you did not perform this action, please contact support immediately.</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 12px;">
              This is an automated email from SmartHealth. Please do not reply.
            </p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`[EmailService] Security notification sent to ${email}`);
      return true;
    } catch (err) {
      console.error('[EmailService] Failed to send security notification:', err);
      return false;
    }
  }

  /**
   * Check if email service is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Singleton instance
export const emailService = new EmailService();
