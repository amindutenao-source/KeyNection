import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing data (child -> parent)
  await prisma.message.deleteMany();
  await prisma.review.deleteMany();
  await prisma.maintenanceRequest.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.application.deleteMany();
  await prisma.document.deleteMany();
  await prisma.property.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 12);

  // Users
  const owner1 = await prisma.user.create({
    data: {
      email: 'owner1@example.com',
      password: hashedPassword,
      firstName: 'Alex',
      lastName: 'Owner',
      phone: '5550000001',
      role: 'OWNER',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
      city: 'New York',
      state: 'NY',
      country: 'USA',
      bio: 'Owner of several rental properties.'
    }
  });

  const owner2 = await prisma.user.create({
    data: {
      email: 'owner2@example.com',
      password: hashedPassword,
      firstName: 'Taylor',
      lastName: 'Landlord',
      phone: '5550000002',
      role: 'OWNER',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
      city: 'Boston',
      state: 'MA',
      country: 'USA',
      bio: 'Focus on long-term rentals.'
    }
  });

  const manager1 = await prisma.user.create({
    data: {
      email: 'manager1@example.com',
      password: hashedPassword,
      firstName: 'Jordan',
      lastName: 'Manager',
      phone: '5550000003',
      role: 'MANAGER',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
      city: 'New York',
      state: 'NY',
      country: 'USA',
      bio: 'Property manager with 6 years of experience.'
    }
  });

  const manager2 = await prisma.user.create({
    data: {
      email: 'manager2@example.com',
      password: hashedPassword,
      firstName: 'Casey',
      lastName: 'Agent',
      phone: '5550000004',
      role: 'MANAGER',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
      city: 'Boston',
      state: 'MA',
      country: 'USA',
      bio: 'Specialized in multi-unit rentals.'
    }
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@keynection.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '5550000005',
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
      city: 'New York',
      state: 'NY',
      country: 'USA',
      bio: 'Platform administrator.'
    }
  });

  // Properties
  const property1 = await prisma.property.create({
    data: {
      title: 'Modern apartment downtown',
      description: 'Two-bedroom apartment with great natural light and city views.',
      type: 'APARTMENT',
      status: 'AVAILABLE',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
      latitude: 40.7505,
      longitude: -73.9934,
      bedrooms: 2,
      bathrooms: 1,
      squareFeet: 850,
      monthlyRent: 2800,
      features: ['City view', 'Renovated', 'Bright'],
      amenities: ['Elevator', 'Doorman', 'Laundry'],
      images: [
        'https://picsum.photos/seed/keynection-apt-1/800/600',
        'https://picsum.photos/seed/keynection-apt-2/800/600'
      ],
      listedAt: new Date(),
      ownerId: owner1.id,
      managerId: manager1.id
    }
  });

  const property2 = await prisma.property.create({
    data: {
      title: 'Cozy townhouse',
      description: 'Three-bedroom townhouse with a private backyard.',
      type: 'TOWNHOUSE',
      status: 'AVAILABLE',
      address: '456 Pine Ave',
      city: 'Boston',
      state: 'MA',
      zipCode: '02108',
      country: 'USA',
      latitude: 42.3601,
      longitude: -71.0589,
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1200,
      monthlyRent: 3200,
      features: ['Backyard', 'Quiet street', 'Family-friendly'],
      amenities: ['Backyard', 'Storage', 'Washer/Dryer'],
      images: [
        'https://picsum.photos/seed/keynection-town-1/800/600',
        'https://picsum.photos/seed/keynection-town-2/800/600'
      ],
      listedAt: new Date(),
      ownerId: owner2.id
    }
  });

  // Applications
  const application1 = await prisma.application.create({
    data: {
      propertyId: property1.id,
      applicantId: manager2.id,
      status: 'PENDING',
      monthlyIncome: 5500,
      personalReferences: ['Sam Reference'],
      personalReferencePhones: ['5550100100'],
      documents: [],
      additionalInfo: 'Interested in managing this property with full-service offering.'
    }
  });

  const application2 = await prisma.application.create({
    data: {
      propertyId: property2.id,
      applicantId: manager1.id,
      status: 'APPROVED',
      monthlyIncome: 6200,
      personalReferences: ['Jamie Reference'],
      personalReferencePhones: ['5550100200'],
      documents: [],
      additionalInfo: 'Strong local network for tenant placement.'
    }
  });

  // Contract
  const contract1 = await prisma.contract.create({
    data: {
      propertyId: property2.id,
      ownerId: owner2.id,
      managerId: manager1.id,
      applicationId: application2.id,
      status: 'ACTIVE',
      contractType: 'MANAGEMENT',
      terms: 'Standard management contract for a 12-month term.',
      monthlyRent: 3200,
      startDate: new Date('2026-02-01'),
      endDate: new Date('2027-01-31'),
      ownerSignedAt: new Date('2026-01-20'),
      managerSignedAt: new Date('2026-01-20')
    }
  });

  // Payments
  const payment1 = await prisma.payment.create({
    data: {
      contractId: contract1.id,
      userId: manager1.id,
      amount: 3200,
      currency: 'USD',
      status: 'COMPLETED',
      method: 'BANK_TRANSFER',
      description: 'First month rent payment',
      processedAt: new Date()
    }
  });

  // Maintenance request
  const maintenance1 = await prisma.maintenanceRequest.create({
    data: {
      propertyId: property2.id,
      contractId: contract1.id,
      title: 'HVAC inspection',
      description: 'Routine inspection requested before summer season.',
      priority: 'MEDIUM',
      status: 'PENDING',
      category: 'HVAC',
      estimatedCost: 150,
      images: []
    }
  });

  // Documents
  await prisma.document.create({
    data: {
      userId: owner1.id,
      propertyId: property1.id,
      name: 'Lease template',
      type: 'CONTRACT',
      url: 'https://example.com/docs/lease-template.pdf',
      size: 24576,
      mimeType: 'application/pdf'
    }
  });

  // Messages
  await prisma.message.create({
    data: {
      senderId: owner1.id,
      recipientId: manager1.id,
      subject: 'Welcome aboard',
      content: 'Thanks for partnering with us. Let us know if you need anything.'
    }
  });

  // Reviews
  await prisma.review.create({
    data: {
      propertyId: property2.id,
      userId: manager1.id,
      rating: 5,
      title: 'Great property',
      comment: 'Well maintained and easy to manage.'
    }
  });

  // Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: owner1.id,
        title: 'New application received',
        message: 'A new manager has applied to your property.',
        type: 'APPLICATION_RECEIVED',
        propertyId: property1.id,
        applicationId: application1.id
      },
      {
        userId: manager1.id,
        title: 'Contract active',
        message: 'Your management contract is now active.',
        type: 'CONTRACT_SIGNED',
        propertyId: property2.id,
        contractId: contract1.id
      },
      {
        userId: owner2.id,
        title: 'Payment received',
        message: 'First month rent has been received.',
        type: 'PAYMENT_RECEIVED',
        propertyId: property2.id,
        paymentId: payment1.id
      }
    ]
  });

  // Sessions
  await prisma.session.create({
    data: {
      userId: admin.id,
      token: randomUUID(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  console.log('Seed completed successfully.');
  console.log('Test accounts:');
  console.log('owner1@example.com / password123');
  console.log('owner2@example.com / password123');
  console.log('manager1@example.com / password123');
  console.log('manager2@example.com / password123');
  console.log('admin@keynection.com / password123');
  console.log(`Created payment: ${payment1.id}`);
  console.log(`Created maintenance request: ${maintenance1.id}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
