type FixtureOverrides<T> = Partial<T>;

const uniqueSuffix = () => Math.random().toString(36).slice(2, 8);

export const fixtures = {
  property: (overrides: FixtureOverrides<Record<string, unknown>> = {}) => ({
    title: `Fixture Property ${uniqueSuffix()}`,
    description: 'Fixture property created for tests',
    type: 'APARTMENT',
    address: '100 Fixture Lane',
    city: 'Testville',
    state: 'TS',
    zipCode: '12345',
    country: 'USA',
    ...overrides
  }),
  maintenance: (
    propertyId: string,
    overrides: FixtureOverrides<Record<string, unknown>> = {}
  ) => ({
    propertyId,
    title: 'Fixture maintenance request',
    description: 'Fixture maintenance description',
    priority: 'MEDIUM',
    ...overrides
  }),
  payment: (
    contractId: string,
    overrides: FixtureOverrides<Record<string, unknown>> = {}
  ) => ({
    contractId,
    amount: 900,
    method: 'BANK_TRANSFER',
    description: 'Fixture payment',
    ...overrides
  }),
  document: (
    propertyId: string,
    overrides: FixtureOverrides<Record<string, unknown>> = {}
  ) => ({
    name: `Fixture document ${uniqueSuffix()}`,
    type: 'CONTRACT',
    url: 'https://example.com/fixture-doc.pdf',
    size: 2048,
    mimeType: 'application/pdf',
    propertyId,
    ...overrides
  }),
  message: (
    recipientId: string,
    overrides: FixtureOverrides<Record<string, unknown>> = {}
  ) => ({
    recipientId,
    subject: 'Fixture message',
    content: 'Fixture message content',
    ...overrides
  }),
  review: (
    propertyId: string,
    overrides: FixtureOverrides<Record<string, unknown>> = {}
  ) => ({
    propertyId,
    rating: 4,
    title: 'Fixture review',
    comment: 'Fixture review comment',
    ...overrides
  })
};
