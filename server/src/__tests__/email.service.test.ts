jest.mock('nodemailer', () => {
  const sendMail = jest.fn().mockResolvedValue(undefined);
  const verify = jest.fn((_cb: (err: Error | null, success?: boolean) => void) => {
    _cb(null, true);
  });
  const createTransport = jest.fn(() => ({ sendMail, verify }));
  return { __esModule: true, default: { createTransport }, createTransport };
});

jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  readFileSync: jest.fn(() => '<h1>{{title}}</h1>')
}));

import { EmailService } from '../services/emailService';

describe('EmailService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.FRONTEND_URL = 'http://localhost:3000';
    process.env.SUPPORT_EMAIL = 'support@keynection.com';
    process.env.SMTP_USER = 'smtp@example.com';
    process.env.SMTP_PASS = 'pass';
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_SECURE = 'false';
    process.env.NODE_ENV = 'test';
    process.env.DISABLE_EMAIL = 'false';
  });

  it('sends a welcome email', async () => {
    const service = new EmailService();
    await service.sendWelcomeEmail('user@example.com', 'Jean');

    const nodemailer = (jest.requireMock('nodemailer') as { createTransport: jest.Mock }).createTransport;
    const transport = nodemailer.mock.results[0].value;
    expect(transport.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        subject: 'Welcome to KeyNection!'
      })
    );
  });

  it('sends a verification email with token', async () => {
    const service = new EmailService();
    await service.sendVerificationEmail('user@example.com', 'token-123');

    const nodemailer = (jest.requireMock('nodemailer') as { createTransport: jest.Mock }).createTransport;
    const transport = nodemailer.mock.results[0].value;
    expect(transport.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Verify your email address'
      })
    );
  });

  it('throws when sending fails', async () => {
    const nodemailer = (jest.requireMock('nodemailer') as { createTransport: jest.Mock }).createTransport;
    nodemailer.mockReturnValueOnce({
      sendMail: jest.fn().mockRejectedValue(new Error('SMTP down')),
      verify: jest.fn()
    });

    const service = new EmailService();

    await expect(
      service.sendPasswordResetEmail('user@example.com', 'token-123')
    ).rejects.toThrow('Failed to send email');
  });

  it('verifies transporter when enabled', async () => {
    process.env.NODE_ENV = 'production';
    process.env.DISABLE_EMAIL = 'false';

    const service = new EmailService();

    const nodemailer = (jest.requireMock('nodemailer') as { createTransport: jest.Mock }).createTransport;
    const transport = nodemailer.mock.results[0].value;

    expect(transport.verify).toHaveBeenCalled();
    await service.sendTestEmail('user@example.com');
  });

  it('uses fallback template when file is missing', async () => {
    const fs = await import('fs');
    (fs.existsSync as jest.Mock).mockReturnValueOnce(false);

    const service = new EmailService();
    await service.sendGeneralNotification('user@example.com', 'Hello', 'World', 'https://example.com');

    const nodemailer = (jest.requireMock('nodemailer') as { createTransport: jest.Mock }).createTransport;
    const transport = nodemailer.mock.results[0].value;
    const html = transport.sendMail.mock.calls[0][0].html as string;

    expect(html).toContain('Template introuvable');
  });

  it('sends other notification emails', async () => {
    const service = new EmailService();

    await service.sendApplicationNotification('user@example.com', 'Property 1', 'Alice');
    await service.sendContractNotification('user@example.com', 'MANAGEMENT', 'Property 2');
    await service.sendPaymentConfirmation('user@example.com', 1200, 'Rent', 'tx-1');
    await service.sendMaintenanceNotification('user@example.com', 'Property 3', 'Fix AC', 'HIGH');

    const nodemailer = (jest.requireMock('nodemailer') as { createTransport: jest.Mock }).createTransport;
    const transport = nodemailer.mock.results[0].value;
    expect(transport.sendMail).toHaveBeenCalled();
  });
});
