import request from 'supertest';
import bcrypt from 'bcryptjs';
import type { PrismaClient } from '@prisma/client';
import {
  buildSchemaName,
  createTestDatabaseUrl,
  ensureSchema,
  dropSchema,
  pushSchema
} from './testDb';

let app: any;
let prisma: PrismaClient;
let schemaName: string;

let adminToken: string;
let ownerToken: string;
let managerToken: string;

let ownerId: string;
let managerId: string;
let propertyId: string;
let contractId: string;
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

const password = 'Password123!';

const shouldSkipE2E = process.env.SKIP_E2E === 'true';
const describeE2E = shouldSkipE2E ? describe.skip : describe;

const createUser = async (role: 'OWNER' | 'MANAGER' | 'ADMIN') => {
  const hashedPassword = await bcrypt.hash(password, 12);
  return prisma.user.create({
    data: {
      email: `${role.toLowerCase()}_${Math.random().toString(36).slice(2)}@example.com`,
      password: hashedPassword,
      firstName: role,
      lastName: 'User',
      role,
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true
    }
  });
};

const login = async (email: string) => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  return response.body.data.token as string;
};

beforeAll(async () => {
  schemaName = buildSchemaName('e2e');
  let databaseUrl = '';

  try {
    await ensureSchema(schemaName);
    databaseUrl = createTestDatabaseUrl(schemaName);

    process.env.DATABASE_URL = databaseUrl;
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    process.env.DISABLE_EMAIL = 'true';

    pushSchema(databaseUrl);

    const mod = await import('../../index');
    app = mod.app;
    prisma = mod.prisma as PrismaClient;
  } catch (error) {
    dbReady = false;
    console.warn('E2E database setup failed:', error);
    return;
  }

  const [admin, owner, manager] = await Promise.all([
    createUser('ADMIN'),
    createUser('OWNER'),
    createUser('MANAGER')
  ]);

  ownerId = owner.id;
  managerId = manager.id;

  [adminToken, ownerToken, managerToken] = await Promise.all([
    login(admin.email),
    login(owner.email),
    login(manager.email)
  ]);

  const property = await prisma.property.create({
    data: {
      title: 'E2E Property',
      description: 'Property for e2e tests',
      type: 'APARTMENT',
      status: 'AVAILABLE',
      address: '123 Test St',
      city: 'Testville',
      state: 'TS',
      zipCode: '12345',
      country: 'USA',
      features: [],
      amenities: [],
      images: [],
      listedAt: new Date(),
      ownerId
    }
  });
  propertyId = property.id;

  const contract = await prisma.contract.create({
    data: {
      propertyId,
      ownerId,
      managerId,
      status: 'ACTIVE',
      contractType: 'MANAGEMENT',
      terms: 'Test contract terms'
    }
  });
  contractId = contract.id;
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

describeE2E('E2E API with real DB', () => {
  itIfDb('admin can access overview and users list', async () => {
    const overview = await request(app)
      .get('/api/admin/overview')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(overview.status).toBe(200);
    expect(overview.body.data.stats.users).toBeGreaterThan(0);

    const users = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(users.status).toBe(200);
    expect(users.body.data.length).toBeGreaterThan(0);
  });

  itIfDb('users can send and read messages', async () => {
    const sent = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        recipientId: managerId,
        subject: 'Hello',
        content: 'Test message'
      });

    expect(sent.status).toBe(201);

    const inbox = await request(app)
      .get('/api/messages')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(inbox.status).toBe(200);
    expect(inbox.body.data.length).toBeGreaterThan(0);

    const messageId = inbox.body.data[0].id;

    const marked = await request(app)
      .put(`/api/messages/${messageId}/read`)
      .set('Authorization', `Bearer ${managerToken}`);

    expect(marked.status).toBe(200);
    expect(marked.body.data.read).toBe(true);
  });

  itIfDb('owner can create maintenance request', async () => {
    const response = await request(app)
      .post('/api/maintenance')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        propertyId,
        title: 'Leaking faucet',
        description: 'Kitchen faucet is leaking',
        priority: 'HIGH'
      });

    expect(response.status).toBe(201);
    expect(response.body.data.propertyId).toBe(propertyId);
  });

  itIfDb('manager can create payment, review, and document', async () => {
    const payment = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        contractId,
        amount: 1200,
        method: 'BANK_TRANSFER',
        description: 'Test payment'
      });

    expect(payment.status).toBe(201);

    const review = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        propertyId,
        rating: 5,
        title: 'Great property',
        comment: 'Smooth experience'
      });

    expect(review.status).toBe(201);

    const document = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: 'Test Document',
        type: 'CONTRACT',
        url: 'https://example.com/test.pdf',
        size: 1024,
        mimeType: 'application/pdf'
      });

    expect(document.status).toBe(201);
  });
});
