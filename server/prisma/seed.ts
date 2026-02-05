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

  const manager3 = await prisma.user.create({
    data: {
      email: 'manager3@example.com',
      password: hashedPassword,
      firstName: 'Riley',
      lastName: 'Coordinator',
      phone: '5550000006',
      role: 'MANAGER',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
      city: 'Chicago',
      state: 'IL',
      country: 'USA',
      bio: 'Coordinates multi-property portfolios.'
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

  const property3 = await prisma.property.create({
    data: {
      title: 'Lakeview condo',
      description: 'Condo with lake views and updated kitchen.',
      type: 'CONDO',
      status: 'RENTED',
      address: '789 Lakeview Dr',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601',
      country: 'USA',
      latitude: 41.8837,
      longitude: -87.6233,
      bedrooms: 2,
      bathrooms: 2,
      squareFeet: 950,
      monthlyRent: 2600,
      features: ['Lake view', 'Gym access'],
      amenities: ['Gym', 'Concierge'],
      images: [
        'https://picsum.photos/seed/keynection-condo-1/800/600',
        'https://picsum.photos/seed/keynection-condo-2/800/600'
      ],
      listedAt: new Date(),
      ownerId: owner1.id,
      managerId: manager2.id
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

  const application3 = await prisma.application.create({
    data: {
      propertyId: property3.id,
      applicantId: manager3.id,
      status: 'APPROVED',
      monthlyIncome: 7100,
      personalReferences: ['Morgan Reference'],
      personalReferencePhones: ['5550100300'],
      documents: [],
      additionalInfo: 'Experienced with high-end condo rentals.'
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

  const contract2 = await prisma.contract.create({
    data: {
      propertyId: property3.id,
      ownerId: owner1.id,
      managerId: manager3.id,
      applicationId: application3.id,
      status: 'ACTIVE',
      contractType: 'MANAGEMENT',
      terms: 'Premium management contract with maintenance oversight.',
      monthlyRent: 2600,
      startDate: new Date('2026-01-15'),
      endDate: new Date('2027-01-14'),
      ownerSignedAt: new Date('2026-01-05'),
      managerSignedAt: new Date('2026-01-05')
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

  const payment2 = await prisma.payment.create({
    data: {
      contractId: contract2.id,
      userId: manager3.id,
      amount: 2600,
      currency: 'USD',
      status: 'PENDING',
      method: 'BANK_TRANSFER',
      description: 'February rent payment'
    }
  });

  const payment3 = await prisma.payment.create({
    data: {
      contractId: contract2.id,
      userId: manager3.id,
      amount: 2600,
      currency: 'USD',
      status: 'FAILED',
      method: 'CARD',
      description: 'March rent payment',
      failureReason: 'Card declined'
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

  const maintenance2 = await prisma.maintenanceRequest.create({
    data: {
      propertyId: property3.id,
      contractId: contract2.id,
      title: 'Plumbing inspection',
      description: 'Investigate water pressure issues.',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      category: 'PLUMBING',
      estimatedCost: 220,
      scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
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

  await prisma.document.create({
    data: {
      userId: manager3.id,
      propertyId: property3.id,
      name: 'Maintenance checklist',
      type: 'OTHER',
      url: 'https://example.com/docs/maintenance-checklist.pdf',
      size: 18432,
      mimeType: 'application/pdf'
    }
  });

  await prisma.document.create({
    data: {
      userId: owner1.id,
      propertyId: property3.id,
      name: 'Signed contract',
      type: 'CONTRACT',
      url: 'https://example.com/docs/contract-signed.pdf',
      size: 42111,
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

  await prisma.message.create({
    data: {
      senderId: manager2.id,
      recipientId: owner2.id,
      subject: 'Weekly update',
      content: 'Completed property walkthrough, no issues found.'
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

  await prisma.review.create({
    data: {
      propertyId: property1.id,
      userId: owner1.id,
      rating: 4,
      title: 'Good collaboration',
      comment: 'Responsive manager and smooth onboarding.'
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
      },
      {
        userId: owner1.id,
        title: 'Maintenance in progress',
        message: 'Plumbing inspection has started.',
        type: 'MAINTENANCE_REQUEST',
        propertyId: property3.id,
        contractId: contract2.id
      },
      {
        userId: manager3.id,
        title: 'Payment failed',
        message: 'March rent payment failed. Please retry.',
        type: 'PAYMENT_RECEIVED',
        propertyId: property3.id,
        paymentId: payment3.id
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

  await prisma.session.create({
    data: {
      userId: manager3.id,
      token: randomUUID(),
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    }
  });

  console.log('Seed completed successfully.');
  console.log('Test accounts:');
  console.log('owner1@example.com / password123');
  console.log('owner2@example.com / password123');
  console.log('manager1@example.com / password123');
  console.log('manager2@example.com / password123');
  console.log('manager3@example.com / password123');
  console.log('admin@keynection.com / password123');
  console.log(`Created payment: ${payment1.id}`);
  console.log(`Created maintenance request: ${maintenance1.id}`);
  console.log(`Created maintenance request: ${maintenance2.id}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
