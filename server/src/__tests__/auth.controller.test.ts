import type { AuthenticatedRequest } from '../types';
import type { Response } from 'express';
import { AuthController } from '../controllers/authController';

jest.mock('../services/authService', () => {
  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    refreshToken: jest.fn(),
    deactivateAccount: jest.fn(),
    verifyEmail: jest.fn()
  };

  return {
    __esModule: true,
    authService: mockAuthService
  };
});

jest.mock('../services/emailService', () => {
  const mockEmailService = {
    sendWelcomeEmail: jest.fn()
  };

  return {
    __esModule: true,
    emailService: mockEmailService
  };
});

const authServiceMock = (jest.requireMock('../services/authService') as { authService: any }).authService;
const emailServiceMock = (jest.requireMock('../services/emailService') as { emailService: any }).emailService;

const createRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  } as unknown as Response;

  return res;
};

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('AuthController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a user and responds with tokens even if welcome email fails', async () => {
    const req = {
      body: { email: 'user@example.com', password: 'Secret123!', firstName: 'Jean' }
    } as unknown as AuthenticatedRequest;

    authServiceMock.register.mockResolvedValue({
      user: { id: 'user-1', email: 'user@example.com', firstName: 'Jean' },
      token: 'token',
      refreshToken: 'refresh'
    });
    emailServiceMock.sendWelcomeEmail.mockRejectedValue(new Error('SMTP down'));

    const res = createRes();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    AuthController.register(req, res, jest.fn());
    await flushPromises();

    expect(authServiceMock.register).toHaveBeenCalledWith(req.body);
    expect(emailServiceMock.sendWelcomeEmail).toHaveBeenCalledWith('user@example.com', 'Jean');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));

    consoleSpy.mockRestore();
  });

  it('logs in a user', async () => {
    const req = {
      body: { email: 'user@example.com', password: 'Secret123!' }
    } as unknown as AuthenticatedRequest;

    authServiceMock.login.mockResolvedValue({
      user: { id: 'user-1', email: 'user@example.com' },
      token: 'token',
      refreshToken: 'refresh'
    });

    const res = createRes();

    AuthController.login(req, res, jest.fn());
    await flushPromises();

    expect(authServiceMock.login).toHaveBeenCalledWith(req.body);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('returns 404 when profile is missing', async () => {
    const req = {
      user: { id: 'user-1' }
    } as unknown as AuthenticatedRequest;

    authServiceMock.getProfile.mockResolvedValue(null);

    const res = createRes();

    AuthController.getMe(req, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('returns the current user profile', async () => {
    const req = {
      user: { id: 'user-1' }
    } as unknown as AuthenticatedRequest;

    authServiceMock.getProfile.mockResolvedValue({ id: 'user-1', email: 'user@example.com' });

    const res = createRes();

    AuthController.getMe(req, res, jest.fn());
    await flushPromises();

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('updates the profile', async () => {
    const req = {
      user: { id: 'user-1' },
      body: { firstName: 'Updated' }
    } as unknown as AuthenticatedRequest;

    authServiceMock.updateProfile.mockResolvedValue({ id: 'user-1', firstName: 'Updated' });

    const res = createRes();

    AuthController.updateProfile(req, res, jest.fn());
    await flushPromises();

    expect(authServiceMock.updateProfile).toHaveBeenCalledWith('user-1', req.body);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('changes the password', async () => {
    const req = {
      user: { id: 'user-1' },
      body: { currentPassword: 'old', newPassword: 'new' }
    } as unknown as AuthenticatedRequest;

    authServiceMock.changePassword.mockResolvedValue(undefined);

    const res = createRes();

    AuthController.changePassword(req, res, jest.fn());
    await flushPromises();

    expect(authServiceMock.changePassword).toHaveBeenCalledWith('user-1', 'old', 'new');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('requests a password reset', async () => {
    const req = {
      body: { email: 'user@example.com' }
    } as unknown as AuthenticatedRequest;

    authServiceMock.forgotPassword.mockResolvedValue(undefined);

    const res = createRes();

    AuthController.forgotPassword(req, res, jest.fn());
    await flushPromises();

    expect(authServiceMock.forgotPassword).toHaveBeenCalledWith('user@example.com');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('resets the password', async () => {
    const req = {
      body: { token: 'reset-token', newPassword: 'new' }
    } as unknown as AuthenticatedRequest;

    authServiceMock.resetPassword.mockResolvedValue(undefined);

    const res = createRes();

    AuthController.resetPassword(req, res, jest.fn());
    await flushPromises();

    expect(authServiceMock.resetPassword).toHaveBeenCalledWith('reset-token', 'new');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('refreshes tokens', async () => {
    const req = {
      body: { refreshToken: 'refresh-token' },
      user: { id: 'user-1' }
    } as unknown as AuthenticatedRequest;

    authServiceMock.refreshToken.mockResolvedValue({
      token: 'token',
      refreshToken: 'refresh'
    });

    const res = createRes();

    AuthController.refreshToken(req, res, jest.fn());
    await flushPromises();

    expect(authServiceMock.refreshToken).toHaveBeenCalledWith('refresh-token');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('logs out without server-side work', async () => {
    const req = {
      user: { id: 'user-1' }
    } as unknown as AuthenticatedRequest;

    const res = createRes();

    AuthController.logout(req, res, jest.fn());
    await flushPromises();

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('deactivates the account', async () => {
    const req = {
      user: { id: 'user-1' }
    } as unknown as AuthenticatedRequest;

    authServiceMock.deactivateAccount.mockResolvedValue(undefined);

    const res = createRes();

    AuthController.deactivateAccount(req, res, jest.fn());
    await flushPromises();

    expect(authServiceMock.deactivateAccount).toHaveBeenCalledWith('user-1');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('verifies email', async () => {
    const req = {
      user: { id: 'user-1' },
      body: { token: 'verify-token' }
    } as unknown as AuthenticatedRequest;

    authServiceMock.verifyEmail.mockResolvedValue(undefined);

    const res = createRes();

    AuthController.verifyEmail(req, res, jest.fn());
    await flushPromises();

    expect(authServiceMock.verifyEmail).toHaveBeenCalledWith('verify-token');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
