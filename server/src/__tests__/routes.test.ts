describe('route modules', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  });

  it('loads all API routers', async () => {
    const modules = await Promise.all([
      import('../routes/admin'),
      import('../routes/applications'),
      import('../routes/auth'),
      import('../routes/contracts'),
      import('../routes/documents'),
      import('../routes/maintenance'),
      import('../routes/messages'),
      import('../routes/notifications'),
      import('../routes/payments'),
      import('../routes/properties'),
      import('../routes/reviews'),
      import('../routes/users')
    ]);

    modules.forEach((mod) => {
      const router = (mod as { default: any }).default;
      expect(router).toBeDefined();
      expect(router.stack?.length ?? 0).toBeGreaterThan(0);
    });
  });
});
