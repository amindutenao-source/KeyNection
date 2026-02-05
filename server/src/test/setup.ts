// Jest setup file for server tests.
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.DISABLE_EMAIL = process.env.DISABLE_EMAIL || 'true';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
