import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { EmailRequest } from '../types';

export class EmailService {
  private transporter: nodemailer.Transporter;
  private templatesDir: string;

  constructor() {
    this.templatesDir = path.join(__dirname, '../templates');
    
    // Create transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const shouldVerify = process.env.NODE_ENV !== 'test' && process.env.DISABLE_EMAIL !== 'true';

    // Verify connection (skip during tests)
    if (shouldVerify) {
      this.transporter.verify((error, _success) => {
        if (error) {
          console.error('Email service connection error:', error);
        } else {
          console.log('✅ Email service connected successfully');
        }
      });
    }
  }

  /**
   * Send email using template
   */
  async sendEmail(emailData: EmailRequest): Promise<void> {
    try {
      const { to, subject, template, context } = emailData;
      
      const html = this.renderTemplate(template, context);

      // Send email
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${to}`);
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error('Failed to send email');
    }
  }

  private renderTemplate(template: string, context: Record<string, any>): string {
    const templatePath = path.join(this.templatesDir, `${template}.hbs`);
    if (!fs.existsSync(templatePath)) {
      return this.renderFallback(template, context);
    }

    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    const compiledTemplate = handlebars.compile(templateContent);
    return compiledTemplate(context);
  }

  private renderFallback(template: string, context: Record<string, any>): string {
    const title = template.replace(/-/g, ' ');
    const details = Object.entries(context)
      .map(([key, value]) => `<li><strong>${key}:</strong> ${String(value)}</li>`)
      .join('');

    return `
      <html>
        <body style="font-family: Arial, sans-serif; color: #111827;">
          <h2>${title}</h2>
          <p>Template introuvable. Voici les informations disponibles :</p>
          <ul>${details}</ul>
        </body>
      </html>
    `;
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Welcome to KeyNection!',
      template: 'welcome',
      context: {
        firstName,
        loginUrl: `${process.env.FRONTEND_URL}/login`,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@keynection.com'
      }
    });
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    await this.sendEmail({
      to: email,
      subject: 'Verify your email address',
      template: 'email-verification',
      context: {
        verificationUrl,
        email,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@keynection.com'
      }
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    await this.sendEmail({
      to: email,
      subject: 'Reset your password',
      template: 'password-reset',
      context: {
        resetUrl,
        email,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@keynection.com'
      }
    });
  }

  /**
   * Send application notification email
   */
  async sendApplicationNotification(
    email: string, 
    propertyTitle: string, 
    applicantName: string
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: `New application for ${propertyTitle}`,
      template: 'application-notification',
      context: {
        propertyTitle,
        applicantName,
        dashboardUrl: `${process.env.FRONTEND_URL}/dashboard/applications`,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@keynection.com'
      }
    });
  }

  /**
   * Send contract notification email
   */
  async sendContractNotification(
    email: string,
    contractType: string,
    propertyTitle: string
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: `New ${contractType} contract for ${propertyTitle}`,
      template: 'contract-notification',
      context: {
        contractType,
        propertyTitle,
        dashboardUrl: `${process.env.FRONTEND_URL}/dashboard/contracts`,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@keynection.com'
      }
    });
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(
    email: string,
    amount: number,
    description: string,
    transactionId: string
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Payment confirmation',
      template: 'payment-confirmation',
      context: {
        amount: amount.toFixed(2),
        description,
        transactionId,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@keynection.com'
      }
    });
  }

  /**
   * Send maintenance request notification
   */
  async sendMaintenanceNotification(
    email: string,
    propertyTitle: string,
    requestTitle: string,
    priority: string
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: `New maintenance request for ${propertyTitle}`,
      template: 'maintenance-notification',
      context: {
        propertyTitle,
        requestTitle,
        priority,
        dashboardUrl: `${process.env.FRONTEND_URL}/dashboard/maintenance`,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@keynection.com'
      }
    });
  }

  /**
   * Send general notification email
   */
  async sendGeneralNotification(
    email: string,
    title: string,
    message: string,
    actionUrl?: string
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: title,
      template: 'general-notification',
      context: {
        title,
        message,
        actionUrl,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@keynection.com'
      }
    });
  }

  /**
   * Send test email
   */
  async sendTestEmail(email: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'KeyNection Email Service Test',
      template: 'test',
      context: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      }
    });
  }
}

export const emailService = new EmailService(); 
