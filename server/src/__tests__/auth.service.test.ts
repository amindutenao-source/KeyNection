import { AuthenticationError, ConflictError, NotFoundError } from '../middleware/errorHandler';
import { UserRole, UserStatus } from '../types';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(async (value: string) => `hashed:${value}`),
  compare: jest.fn(async (_value: string, _hash: string) => true)
}));

jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => Buffer.from('a'.repeat(32)))
}));

jest.mock('jsonwebtoken', () => {
  class JsonWebTokenError extends Error {}
  class TokenExpiredError extends Error {}
  return {
    __esModule: true,
    default: {
      sign: jest.fn(() => 'signed-token'),
      verify: jest.fn(() => ({ userId: 'user-1', email: 'user@example.com', role: 'OWNER' })),
      JsonWebTokenError,
      TokenExpiredError
    },
    JsonWebTokenError,
    TokenExpiredError
  };
});

jest.mock('../lib/prisma', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    }
  };

  return {
    __esModule: true,
    default: mockPrisma
  };
});

jest.mock('../services/emailService', () => {
  const mockEmail = {
    sendEmail: jest.fn().mockResolvedValue(undefined)
  };

  return {
    EmailService: jest.fn(() => mockEmail),
    __mock: mockEmail
  };
});

const prismaMock = (jest.requireMock('../lib/prisma') as { default: any }).default;
const emailMock = (jest.requireMock('../services/emailService') as { __mock: any }).__mock;
const bcryptMock = jest.requireMock('bcryptjs') as { hash: jest.Mock; compare: jest.Mock };
const jwtMock = (jest.requireMock('jsonwebtoken') as { default: any }).default;

const baseUser = (overrides: Record<string, any> = {}) => ({
  id: 'user-1',
  email: 'user@example.com',
  password: 'hashed:Password123',
  firstName: 'Test',
  lastName: 'User',
  phone: '5550000000',
  avatar: null,
  role: UserRole.OWNER,
  status: UserStatus.ACTIVE,
  emailVerified: true,
  phoneVerified: true,
  bio: null,
  address: null,
  city: null,
  state: null,
  zipCode: null,
  country: null,
  dateOfBirth: null,
  identificationNumber: null,
  taxId: null,
  bankAccount: null,
  emergencyContact: null,
  emergencyPhone: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

const buildService = async () => {
  const { AuthService } = await import('../services/authService');
  return new AuthService();
};

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    process.env.SUPPORT_EMAIL = 'support@keynection.com';
    jwtMock.sign.mockImplementation(() => 'signed-token');
    jwtMock.verify.mockImplementation(() => ({
      userId: 'user-1',
      email: 'user@example.com',
      role: 'OWNER'
    }));
    bcryptMock.compare.mockResolvedValue(true);
    emailMock.sendEmail.mockResolvedValue(undefined);
  });

  it('throws when JWT_SECRET is missing', () => {
    delete process.env.JWT_SECRET;
    expect(() => {
      jest.isolateModules(() => {
        require('../services/authService');
      });
    }).toThrow('JWT_SECRET is not configured');
  });

  it('registers a new user and returns tokens', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue(baseUser({ status: UserStatus.PENDING, emailVerified: false }));

    const service = await buildService();

    const result = await service.register({
      email: 'User@Example.com',
      password: 'Password123',
      firstName: 'Test',
      lastName: 'User',
      phone: '5550000000',
      role: UserRole.OWNER
    });

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'user@example.com' }
    });
    expect(prismaMock.user.create).toHaveBeenCalled();
    expect(emailMock.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Verify your email address'
      })
    );
    expect(result.token).toBe('signed-token');
    expect(result.refreshToken).toBe('signed-token');
  });

  it('lowercases email on register', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue(baseUser({ status: UserStatus.PENDING, emailVerified: false }));

    const service = await buildService();

    await service.register({
      email: 'USER@EXAMPLE.COM',
      password: 'Password123',
      firstName: 'Test',
      lastName: 'User',
      phone: '5550000000'
    });

    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'user@example.com'
        })
      })
    );
  });

  it('register throws when user already exists', async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser());

    const service = await buildService();

    await expect(
      service.register({
        email: 'user@example.com',
        password: 'Password123',
        firstName: 'Test',
        lastName: 'User',
        phone: '5550000000',
        role: UserRole.OWNER
      })
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('register continues when verification email fails', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue(baseUser({ status: UserStatus.PENDING, emailVerified: false }));
    emailMock.sendEmail.mockRejectedValueOnce(new Error('Email down'));

    const service = await buildService();

    await expect(
      service.register({
        email: 'user@example.com',
        password: 'Password123',
        firstName: 'Test',
        lastName: 'User',
        phone: '5550000000',
        role: UserRole.OWNER
      })
    ).resolves.toBeDefined();
  });

  it('defaults role to OWNER when missing', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue(baseUser({ status: UserStatus.PENDING, emailVerified: false }));
    delete process.env.SUPPORT_EMAIL;

    const service = await buildService();
    await service.register({
      email: 'user@example.com',
      password: 'Password123',
      firstName: 'Test',
      lastName: 'User',
      phone: '5550000000'
    });

    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role: UserRole.OWNER
        })
      })
    );
  });

  it('login throws when user does not exist', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const service = await buildService();

    await expect(
      service.login({ email: 'missing@example.com', password: 'Password123' })
    ).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('login throws when account is inactive', async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser({ status: UserStatus.PENDING }));
    const service = await buildService();

    await expect(
      service.login({ email: 'user@example.com', password: 'Password123' })
    ).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('login throws when password is invalid', async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser());
    bcryptMock.compare.mockResolvedValueOnce(false);
    const service = await buildService();

    await expect(
      service.login({ email: 'user@example.com', password: 'Password123' })
    ).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('login returns tokens and updates last login', async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser());
    prismaMock.user.update.mockResolvedValue(baseUser());

    const service = await buildService();
    const result = await service.login({ email: 'user@example.com', password: 'Password123' });

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user-1' } })
    );
    expect('password' in result.user).toBe(false);
    expect(result.token).toBe('signed-token');
    expect(result.refreshToken).toBe('signed-token');
  });

  it('refreshToken throws for invalid token', async () => {
    jwtMock.verify.mockImplementationOnce(() => {
      throw new Error('bad token');
    });

    const service = await buildService();

    await expect(service.refreshToken('bad-token')).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('refreshToken throws when user is inactive', async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser({ status: UserStatus.INACTIVE }));

    const service = await buildService();

    await expect(service.refreshToken('refresh')).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('refreshToken returns new tokens', async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser());

    const service = await buildService();
    const result = await service.refreshToken('refresh');

    expect(result.token).toBe('signed-token');
    expect(result.refreshToken).toBe('signed-token');
  });

  it('verifyEmail throws for invalid token', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);
    const service = await buildService();

    await expect(service.verifyEmail('token')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('verifyEmail updates user', async () => {
    prismaMock.user.findFirst.mockResolvedValue(baseUser({ verificationToken: 'token' }));
    prismaMock.user.update.mockResolvedValue(baseUser({ emailVerified: true }));

    const service = await buildService();
    await service.verifyEmail('token');

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          emailVerified: true,
          status: UserStatus.ACTIVE,
          verificationToken: null
        })
      })
    );
  });

  it('resendVerificationEmail throws when user missing', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const service = await buildService();

    await expect(service.resendVerificationEmail('user@example.com')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('resendVerificationEmail throws when already verified', async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser({ emailVerified: true }));
    const service = await buildService();

    await expect(service.resendVerificationEmail('user@example.com')).rejects.toBeInstanceOf(ConflictError);
  });

  it('resendVerificationEmail updates token and sends email', async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser({ emailVerified: false }));
    prismaMock.user.update.mockResolvedValue(baseUser({ emailVerified: false }));

    const service = await buildService();
    await service.resendVerificationEmail('user@example.com');

    expect(prismaMock.user.update).toHaveBeenCalled();
    expect(emailMock.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Verify your email address' })
    );
  });

  it('forgotPassword returns silently when user missing', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const service = await buildService();

    await expect(service.forgotPassword('missing@example.com')).resolves.toBeUndefined();
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('forgotPassword sets reset token and emails user', async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser());
    prismaMock.user.update.mockResolvedValue(baseUser());
    delete process.env.SUPPORT_EMAIL;

    const service = await buildService();
    await service.forgotPassword('user@example.com');

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          resetPasswordToken: expect.any(String),
          resetPasswordExpires: expect.any(Date)
        })
      })
    );
    expect(emailMock.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Reset your password' })
    );
  });

  it('resetPassword throws for invalid token', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);
    const service = await buildService();

    await expect(service.resetPassword('token', 'NewPass123')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('resetPassword updates password and clears token', async () => {
    prismaMock.user.findFirst.mockResolvedValue(baseUser({ resetPasswordToken: 'token' }));
    prismaMock.user.update.mockResolvedValue(baseUser());

    const service = await buildService();
    await service.resetPassword('token', 'NewPass123');

    expect(bcryptMock.hash).toHaveBeenCalledWith('NewPass123', 12);
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          password: 'hashed:NewPass123',
          resetPasswordToken: null,
          resetPasswordExpires: null
        })
      })
    );
  });

  it('changePassword throws when user missing', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const service = await buildService();

    await expect(service.changePassword('user-1', 'OldPass', 'NewPass')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('changePassword throws when current password invalid', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ password: 'hashed:OldPass' });
    bcryptMock.compare.mockResolvedValueOnce(false);
    const service = await buildService();

    await expect(service.changePassword('user-1', 'OldPass', 'NewPass')).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('changePassword updates password', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ password: 'hashed:OldPass' });
    prismaMock.user.update.mockResolvedValue(baseUser());

    const service = await buildService();
    await service.changePassword('user-1', 'OldPass', 'NewPass');

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { password: 'hashed:NewPass' }
      })
    );
  });

  it('updateProfile returns updated user', async () => {
    prismaMock.user.update.mockResolvedValue(baseUser({ firstName: 'Updated' }));
    const service = await buildService();

    const result = await service.updateProfile('user-1', { firstName: 'Updated' });
    expect(result.firstName).toBe('Updated');
  });

  it('getProfile throws when user missing', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const service = await buildService();

    await expect(service.getProfile('user-1')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('getProfile returns user', async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser());
    const service = await buildService();

    const result = await service.getProfile('user-1');
    expect(result.email).toBe('user@example.com');
  });

  it('logout logs the event', async () => {
    const service = await buildService();
    await expect(service.logout('user-1', 'refresh')).resolves.toBeUndefined();
  });

  it('deactivateAccount updates status', async () => {
    prismaMock.user.update.mockResolvedValue(baseUser({ status: UserStatus.INACTIVE }));
    const service = await buildService();

    await service.deactivateAccount('user-1');
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: UserStatus.INACTIVE } })
    );
  });

  it('validateToken returns payload', async () => {
    const service = await buildService();
    const payload = service.validateToken('token');
    expect(payload.userId).toBe('user-1');
  });

  it('validateToken throws for invalid token', async () => {
    jwtMock.verify.mockImplementationOnce(() => {
      throw new Error('bad');
    });
    const service = await buildService();
    expect(() => service.validateToken('bad')).toThrow(AuthenticationError);
  });
});
