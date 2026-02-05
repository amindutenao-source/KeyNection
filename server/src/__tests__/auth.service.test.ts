jest.mock('../lib/prisma', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn()
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

let emailMock: any;
const prismaMock = (jest.requireMock('../lib/prisma') as { default: any }).default;

describe('AuthService.register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    emailMock = (jest.requireMock('../services/emailService') as { __mock: any }).__mock;
  });

  it('creates a user and returns tokens', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const createdUser = {
      id: 'user-1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      phone: '5550000000',
      avatar: null,
      role: 'OWNER',
      status: 'PENDING',
      emailVerified: false,
      phoneVerified: false,
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
      updatedAt: new Date()
    };

    prismaMock.user.create.mockResolvedValue(createdUser);

    const { AuthService } = await import('../services/authService');
    const service = new AuthService();

    const result = await service.register({
      email: 'Test@example.com',
      password: 'Password123',
      firstName: 'Test',
      lastName: 'User',
      phone: '5550000000',
      role: 'OWNER'
    });

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' }
    });
    expect(prismaMock.user.create).toHaveBeenCalled();
    expect(emailMock.sendEmail).toHaveBeenCalled();
    expect(result.user.email).toBe('test@example.com');
    expect(result.token).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
  });
});
