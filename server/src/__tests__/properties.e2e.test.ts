import jwt from 'jsonwebtoken';
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

describeE2E('Properties API (e2e)', () => {
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
    schemaName = buildSchemaName('properties');
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

  itIfDb('allows an owner to create and list properties', async () => {
    const owner = await prisma.user.create({
      data: {
        email: 'owner-e2e@example.com',
        password: 'hashed-password',
        firstName: 'Owner',
        lastName: 'E2E',
        role: 'OWNER',
        status: 'ACTIVE',
        emailVerified: true,
        phoneVerified: true
      }
    });

    const token = jwt.sign(
      { userId: owner.id, email: owner.email, role: owner.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );

    const createResponse = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'E2E Property',
        description: 'A test property created in e2e',
        type: 'APARTMENT',
        address: '123 Test St',
        city: 'Paris',
        state: 'Ile-de-France',
        zipCode: '75001',
        country: 'France',
        features: ['Balcony'],
        amenities: ['Elevator']
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.success).toBe(true);

    const listResponse = await request(app)
      .get('/api/properties/owner/my-properties')
      .set('Authorization', `Bearer ${token}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0].title).toBe('E2E Property');

    const propertyId = listResponse.body.data[0].id;

    const deleteResponse = await request(app)
      .delete(`/api/properties/${propertyId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.success).toBe(true);

    const listAfterDelete = await request(app)
      .get('/api/properties/owner/my-properties')
      .set('Authorization', `Bearer ${token}`);

    expect(listAfterDelete.status).toBe(200);
    expect(listAfterDelete.body.data).toHaveLength(0);
  });
});
