import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  await prisma.contract.deleteMany();
  await prisma.application.deleteMany();
  await prisma.property.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️  Cleared existing data');

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 12);

  const owner1 = await prisma.user.create({
    data: {
      email: 'owner1@example.com',
      password: hashedPassword,
      firstName: 'Jean',
      lastName: 'Dupont',
      phone: '0123456789',
      role: 'OWNER',
      status: 'ACTIVE',
      emailVerified: true,
      city: 'Paris',
      state: 'Ile-de-France',
      country: 'France',
      bio: 'Propriétaire de plusieurs biens immobiliers à Paris'
    }
  });

  const owner2 = await prisma.user.create({
    data: {
      email: 'owner2@example.com',
      password: hashedPassword,
      firstName: 'Marie',
      lastName: 'Martin',
      phone: '0987654321',
      role: 'OWNER',
      status: 'ACTIVE',
      emailVerified: true,
      city: 'Lyon',
      state: 'Auvergne-Rhone-Alpes',
      country: 'France',
      bio: 'Propriétaire de biens dans le centre de Lyon'
    }
  });

  const manager1 = await prisma.user.create({
    data: {
      email: 'manager1@example.com',
      password: hashedPassword,
      firstName: 'Pierre',
      lastName: 'Durand',
      phone: '0555666777',
      role: 'MANAGER',
      status: 'ACTIVE',
      emailVerified: true,
      city: 'Paris',
      state: 'Ile-de-France',
      country: 'France',
      bio: 'Gestionnaire immobilier expérimenté'
    }
  });

  const manager2 = await prisma.user.create({
    data: {
      email: 'manager2@example.com',
      password: hashedPassword,
      firstName: 'Sophie',
      lastName: 'Leroy',
      phone: '0444333222',
      role: 'MANAGER',
      status: 'ACTIVE',
      emailVerified: true,
      city: 'Lyon',
      state: 'Auvergne-Rhone-Alpes',
      country: 'France',
      bio: 'Spécialiste de la gestion locative'
    }
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@keynection.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'KeyNection',
      phone: '0111111111',
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      city: 'Paris',
      state: 'Ile-de-France',
      country: 'France',
      bio: 'Administrateur de la plateforme'
    }
  });

  console.log('👥 Created users');

  // Create properties
  const property1 = await prisma.property.create({
    data: {
      title: 'Appartement moderne au cœur de Paris',
      description:
        "Magnifique appartement de 3 pièces entièrement rénové, situé dans le 8ème arrondissement. Proche des Champs-Élysées et des transports en commun. Idéal pour un investissement locatif.",
      type: 'APARTMENT',
      status: 'AVAILABLE',
      address: '15 Avenue des Champs-Élysées',
      city: 'Paris',
      state: 'Ile-de-France',
      zipCode: '75008',
      country: 'France',
      latitude: 48.8698,
      longitude: 2.3077,
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 85,
      monthlyRent: 2500,
      features: ['Rénové', 'Proche transports', 'Lumineux'],
      amenities: ['Ascenseur', 'Balcon', 'Cave', 'Parking', 'Sécurité'],
      images: [
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
        'https://images.unsplash.com/photo-1560448075-bb485b067938?w=800'
      ],
      listedAt: new Date(),
      ownerId: owner1.id
    }
  });

  const property2 = await prisma.property.create({
    data: {
      title: 'Maison de ville à Lyon',
      description:
        'Belle maison de ville de 4 pièces avec jardin, située dans le quartier historique de Lyon. Proche du Vieux Lyon et des commerces. Parfait pour une famille.',
      type: 'HOUSE',
      status: 'AVAILABLE',
      address: '25 Rue de la République',
      city: 'Lyon',
      state: 'Auvergne-Rhone-Alpes',
      zipCode: '69002',
      country: 'France',
      latitude: 45.764,
      longitude: 4.8357,
      bedrooms: 4,
      bathrooms: 2,
      squareFeet: 120,
      monthlyRent: 1800,
      features: ['Maison de ville', 'Quartier historique', 'Jardin'],
      amenities: ['Jardin', 'Terrasse', 'Cave', 'Garage', 'Climatisation'],
      images: [
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800'
      ],
      listedAt: new Date(),
      ownerId: owner2.id
    }
  });

  const property3 = await prisma.property.create({
    data: {
      title: 'Studio moderne à Paris',
      description:
        'Studio entièrement meublé et équipé, idéal pour un étudiant ou un jeune professionnel. Proche de la Sorbonne et du Quartier Latin.',
      type: 'APARTMENT',
      status: 'AVAILABLE',
      address: '8 Rue Saint-Jacques',
      city: 'Paris',
      state: 'Ile-de-France',
      zipCode: '75005',
      country: 'France',
      latitude: 48.8462,
      longitude: 2.3439,
      bedrooms: 1,
      bathrooms: 1,
      squareFeet: 25,
      monthlyRent: 1200,
      features: ['Meublé', 'Proche universités', 'Compact'],
      amenities: ['Internet', 'Machine à laver', 'Ascenseur'],
      images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'],
      listedAt: new Date(),
      ownerId: owner1.id
    }
  });

  console.log('🏠 Created properties');

  // Create applications
  const application1 = await prisma.application.create({
    data: {
      propertyId: property1.id,
      applicantId: manager1.id,
      status: 'PENDING',
      additionalInfo:
        "Bonjour, je suis très intéressé par la gestion de votre appartement. J'ai 5 ans d'expérience dans la gestion locative à Paris et je peux vous garantir un service de qualité.",
      monthlyIncome: 5000,
      personalReferences: ['Claire Martin'],
      personalReferencePhones: ['0600000001'],
      documents: []
    }
  });

  const application2 = await prisma.application.create({
    data: {
      propertyId: property1.id,
      applicantId: manager2.id,
      status: 'PENDING',
      additionalInfo:
        "Je souhaite postuler pour la gestion de votre bien. J'ai une agence immobilière à Lyon mais je développe mes activités à Paris. Je propose un tarif compétitif.",
      monthlyIncome: 4800,
      personalReferences: ['Luc Bernard'],
      personalReferencePhones: ['0600000002'],
      documents: []
    }
  });

  const application3 = await prisma.application.create({
    data: {
      propertyId: property2.id,
      applicantId: manager2.id,
      status: 'APPROVED',
      additionalInfo:
        "Parfait pour ma zone d'activité ! J'ai déjà plusieurs biens gérés dans ce quartier de Lyon. Je peux commencer immédiatement.",
      monthlyIncome: 5200,
      personalReferences: ['Emma Petit'],
      personalReferencePhones: ['0600000003'],
      documents: []
    }
  });

  console.log('📝 Created applications');

  // Create contracts
  const contract1 = await prisma.contract.create({
    data: {
      propertyId: property2.id,
      ownerId: owner2.id,
      managerId: manager2.id,
      applicationId: application3.id,
      status: 'ACTIVE',
      contractType: 'MANAGEMENT',
      terms:
        'Contrat de gestion locative entre Marie Martin (propriétaire) et Sophie Leroy (gestionnaire) pour la maison située 25 Rue de la République, Lyon.',
      monthlyRent: 1750,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      ownerSignedAt: new Date('2023-12-15'),
      managerSignedAt: new Date('2023-12-15')
    }
  });

  console.log('📄 Created contracts');

  // Create notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: owner1.id,
        title: 'Nouvelle candidature reçue',
        message:
          'Pierre Durand a postulé pour la gestion de votre appartement au 15 Avenue des Champs-Élysées.',
        type: 'APPLICATION_RECEIVED',
        propertyId: property1.id,
        applicationId: application1.id
      },
      {
        userId: owner1.id,
        title: 'Nouvelle candidature reçue',
        message:
          'Sophie Leroy a postulé pour la gestion de votre appartement au 15 Avenue des Champs-Élysées.',
        type: 'APPLICATION_RECEIVED',
        propertyId: property1.id,
        applicationId: application2.id
      },
      {
        userId: manager2.id,
        title: 'Candidature approuvée',
        message: 'Votre candidature pour la maison à Lyon a été approuvée par Marie Martin.',
        type: 'APPLICATION_APPROVED',
        propertyId: property2.id,
        applicationId: application3.id
      },
      {
        userId: manager2.id,
        title: 'Nouveau contrat envoyé',
        message: 'Un nouveau contrat a été envoyé pour la gestion de la maison à Lyon.',
        type: 'CONTRACT_SENT',
        propertyId: property2.id,
        contractId: contract1.id
      }
    ]
  });

  console.log('🔔 Created notifications');

  console.log('✅ Database seeding completed!');
  console.log('\n📋 Test accounts:');
  console.log('Owner 1: owner1@example.com / password123');
  console.log('Owner 2: owner2@example.com / password123');
  console.log('Manager 1: manager1@example.com / password123');
  console.log('Manager 2: manager2@example.com / password123');
  console.log('Admin: admin@keynection.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
