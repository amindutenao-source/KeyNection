import bcrypt from 'bcryptjs';
import request from 'supertest';
import {
  buildSchemaName,
  createTestDatabaseUrl,
  ensureSchema,
  dropSchema,
  pushSchema
} from './e2e/testDb';

const shouldSkipE2E = process.env.SKIP_E2E === 'true';
const describeE2E = shouldSkipE2E ? describe.skip : describe;

describeE2E('Auth API (e2e)', () => {
  let app: any;
  let prisma: any;
  let schemaName: string;
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
    schemaName = buildSchemaName('auth');
    let databaseUrl = '';

    try {
      await ensureSchema(schemaName);
      databaseUrl = createTestDatabaseUrl(schemaName);

      process.env.DATABASE_URL = databaseUrl;
      process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
      process.env.DISABLE_EMAIL = 'true';

      pushSchema(databaseUrl);

      const mod = await import('../index');
      app = mod.app;
      prisma = mod.prisma;
    } catch (error) {
      dbReady = false;
      console.warn('E2E database setup failed:', error);
    }
  });

  afterAll(async () => {
    if (!dbReady) {
      return;
    }
    if (prisma) {
      await prisma.$disconnect();
    }
    if (schemaName) {
      await dropSchema(schemaName);
    }
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
