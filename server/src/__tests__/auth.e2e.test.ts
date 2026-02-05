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
  let dbReady = true;

  const itIfDb = (title: string, fn: () => Promise<void>) => {
    return it(title, async () => {
      if (!dbReady) {
        console.warn('Skipping e2e test: database not reachable.');
        return;
      }
      await fn();
    });
  };

  beforeAll(async () => {
    try {
      await ensureSchema(TEST_SCHEMA);
      pushSchema(TEST_DATABASE_URL);
    } catch (error) {
      dbReady = false;
      console.warn('E2E database setup failed:', error);
      return;
    }

    const { default: importedApp } = await import('../index');
    app = importedApp;

    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    if (!dbReady) {
      return;
    }
    if (prisma) {
      await prisma.$disconnect();
    }
    await dropSchema(TEST_SCHEMA);
  });

  itIfDb('logs in and accesses a protected endpoint', async () => {
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
    expect(loginResponse.body.data.token).toBeDefined();

    const token = loginResponse.body.data.token as string;

    const protectedResponse = await request(app)
      .get('/api/properties/owner/my-properties')
      .set('Authorization', `Bearer ${token}`);

    expect(protectedResponse.status).toBe(200);
    expect(Array.isArray(protectedResponse.body.data)).toBe(true);
  });
});
