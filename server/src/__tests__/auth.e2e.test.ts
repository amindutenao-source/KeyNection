import bcrypt from 'bcryptjs';
import request from 'supertest';
import {
  buildSchemaName,
  createTestDatabaseUrl,
  ensureSchema,
  dropSchema,
  pushSchema
} from './e2e/testDb';

const TEST_SCHEMA = buildSchemaName('auth');
const TEST_DATABASE_URL = createTestDatabaseUrl(TEST_SCHEMA);

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const shouldSkipE2E = process.env.SKIP_E2E === 'true';
const describeE2E = shouldSkipE2E ? describe.skip : describe;

describeE2E('Auth API (e2e)', () => {
  let app: any;
  let prisma: any;

  beforeAll(async () => {
    await ensureSchema(TEST_SCHEMA);
    pushSchema(TEST_DATABASE_URL);

    const { default: importedApp } = await import('../index');
    app = importedApp;

    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
    await dropSchema(TEST_SCHEMA);
  });

  it('logs in and accesses a protected endpoint', async () => {
    const hashedPassword = await bcrypt.hash('Password123', 12);
    const owner = await prisma.user.create({
      data: {
        email: 'owner-login@example.com',
        password: hashedPassword,
        firstName: 'Owner',
        lastName: 'Login',
        role: 'OWNER',
        status: 'ACTIVE',
        emailVerified: true,
        phoneVerified: true
      }
    });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: owner.email, password: 'Password123' });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.token).toBeDefined();

    const token = loginResponse.body.token as string;

    const protectedResponse = await request(app)
      .get('/api/properties/owner/my-properties')
      .set('Authorization', `Bearer ${token}`);

    expect(protectedResponse.status).toBe(200);
    expect(Array.isArray(protectedResponse.body.data)).toBe(true);
  });
});
