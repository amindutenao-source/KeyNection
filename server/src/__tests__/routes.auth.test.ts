import type { Request, Response, NextFunction } from 'express';

jest.mock('../middleware/auth', () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = { id: 'user-1', email: 'user@example.com' };
    next();
  },
  validatePasswordStrength: (_req: any, _res: any, next: any) => next()
}));

jest.mock('../middleware/validation', () => ({
  validateUser: {
    register: (_req: any, _res: any, next: any) => next(),
    login: (_req: any, _res: any, next: any) => next(),
    resetPassword: (_req: any, _res: any, next: any) => next(),
    changePassword: (_req: any, _res: any, next: any) => next(),
    update: (_req: any, _res: any, next: any) => next()
  },
  validateEmail: (_req: any, _res: any, next: any) => next()
}));

const authServiceMock = {
  register: jest.fn(),
  login: jest.fn(),
  refreshToken: jest.fn(),
  logout: jest.fn(),
  verifyEmail: jest.fn(),
  resendVerificationEmail: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  changePassword: jest.fn(),
  getProfile: jest.fn(),
  updateProfile: jest.fn()
};

jest.mock('../services/authService', () => ({
  authService: authServiceMock
}));

const getHandler = async (method: string, path: string) => {
  const { default: authRoutes } = await import('../routes/auth');
  const layer = authRoutes.stack.find(
    (item: any) => item.route?.path === path && item.route.methods[method]
  );
  if (!layer || !layer.route) {
    throw new Error(`Route ${method.toUpperCase()} ${path} not found`);
  }
  return layer.route.stack[layer.route.stack.length - 1].handle as (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<void> | void;
};

const createRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  } as unknown as Response;

  return res;
};

describe('auth routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a user', async () => {
    authServiceMock.register.mockResolvedValue({
      user: { id: 'user-1' },
      token: 'token',
      refreshToken: 'refresh'
    });

    const handler = await getHandler('post', '/register');
    const req = {
      body: {
        email: 'user@example.com',
        password: 'Password123',
        firstName: 'Test',
        lastName: 'User'
      }
    } as unknown as Request;
    const res = createRes();

    await handler(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
    expect(authServiceMock.register).toHaveBeenCalled();
  });

  it('logs in a user', async () => {
    authServiceMock.login.mockResolvedValue({
      user: { id: 'user-1' },
      token: 'token',
      refreshToken: 'refresh'
    });

    const handler = await getHandler('post', '/login');
    const req = {
      body: {
        email: 'user@example.com',
        password: 'Password123'
      }
    } as unknown as Request;
    const res = createRes();

    await handler(req, res, jest.fn());

    expect(res.json).toHaveBeenCalled();
    expect(authServiceMock.login).toHaveBeenCalled();
  });

  it('refreshes tokens', async () => {
    authServiceMock.refreshToken.mockResolvedValue({
      token: 'token',
      refreshToken: 'refresh'
    });

    const handler = await getHandler('post', '/refresh');
    const req = { body: { refreshToken: 'refresh' } } as unknown as Request;
    const res = createRes();

    await handler(req, res, jest.fn());

    expect(res.json).toHaveBeenCalled();
    expect(authServiceMock.refreshToken).toHaveBeenCalledWith('refresh');
  });

  it('logs out the user', async () => {
    authServiceMock.logout.mockResolvedValue(undefined);

    const handler = await getHandler('post', '/logout');
    const req = { body: { refreshToken: 'refresh' }, user: { id: 'user-1' } } as unknown as Request;
    const res = createRes();

    await handler(req, res, jest.fn());

    expect(res.json).toHaveBeenCalled();
    expect(authServiceMock.logout).toHaveBeenCalledWith('user-1', 'refresh');
  });

  it('verifies email', async () => {
    authServiceMock.verifyEmail.mockResolvedValue(undefined);

    const handler = await getHandler('post', '/verify-email');
    const req = { body: { token: 'token' } } as unknown as Request;
    const res = createRes();

    await handler(req, res, jest.fn());

    expect(res.json).toHaveBeenCalled();
    expect(authServiceMock.verifyEmail).toHaveBeenCalledWith('token');
  });

  it('resends verification email', async () => {
    authServiceMock.resendVerificationEmail.mockResolvedValue(undefined);

    const handler = await getHandler('post', '/resend-verification');
    const req = { body: { email: 'user@example.com' } } as unknown as Request;
    const res = createRes();

    await handler(req, res, jest.fn());

    expect(res.json).toHaveBeenCalled();
    expect(authServiceMock.resendVerificationEmail).toHaveBeenCalledWith('user@example.com');
  });

  it('handles forgot password', async () => {
    authServiceMock.forgotPassword.mockResolvedValue(undefined);

    const handler = await getHandler('post', '/forgot-password');
    const req = { body: { email: 'user@example.com' } } as unknown as Request;
    const res = createRes();

    await handler(req, res, jest.fn());

    expect(res.json).toHaveBeenCalled();
    expect(authServiceMock.forgotPassword).toHaveBeenCalledWith('user@example.com');
  });

  it('resets password', async () => {
    authServiceMock.resetPassword.mockResolvedValue(undefined);

    const handler = await getHandler('post', '/reset-password');
    const req = { body: { token: 'token', password: 'StrongPass1!' } } as unknown as Request;
    const res = createRes();

    await handler(req, res, jest.fn());

    expect(res.json).toHaveBeenCalled();
    expect(authServiceMock.resetPassword).toHaveBeenCalledWith('token', 'StrongPass1!');
  });

  it('changes password', async () => {
    authServiceMock.changePassword.mockResolvedValue(undefined);

    const handler = await getHandler('post', '/change-password');
    const req = {
      body: { currentPassword: 'OldPass1!', newPassword: 'NewPass1!' },
      user: { id: 'user-1' }
    } as unknown as Request;
    const res = createRes();

    await handler(req, res, jest.fn());

    expect(res.json).toHaveBeenCalled();
    expect(authServiceMock.changePassword).toHaveBeenCalledWith('user-1', 'OldPass1!', 'NewPass1!');
  });

  it('gets profile', async () => {
    authServiceMock.getProfile.mockResolvedValue({ id: 'user-1' });

    const handler = await getHandler('get', '/profile');
    const req = { user: { id: 'user-1' } } as unknown as Request;
    const res = createRes();

    await handler(req, res, jest.fn());

    expect(res.json).toHaveBeenCalled();
    expect(authServiceMock.getProfile).toHaveBeenCalledWith('user-1');
  });

  it('updates profile', async () => {
    authServiceMock.updateProfile.mockResolvedValue({ id: 'user-1', firstName: 'Updated' });

    const handler = await getHandler('put', '/profile');
    const req = {
      body: { firstName: 'Updated' },
      user: { id: 'user-1' }
    } as unknown as Request;
    const res = createRes();

    await handler(req, res, jest.fn());

    expect(res.json).toHaveBeenCalled();
    expect(authServiceMock.updateProfile).toHaveBeenCalledWith('user-1', { firstName: 'Updated' });
  });

  it('returns current user info', async () => {
    const handler = await getHandler('get', '/me');
    const req = { user: { id: 'user-1' } } as unknown as Request;
    const res = createRes();

    await handler(req, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { id: 'user-1' }
      })
    );
  });
});
