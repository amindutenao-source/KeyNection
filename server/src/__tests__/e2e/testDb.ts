import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { Client } from 'pg';
import dotenv from 'dotenv';

const loadEnv = () => {
  const rootEnv = path.resolve(__dirname, '..', '..', '..', '.env');
  const serverEnv = path.resolve(__dirname, '..', '..', '..', 'server', '.env');

  if (fs.existsSync(rootEnv)) {
    dotenv.config({ path: rootEnv });
  }

  if (!process.env.DATABASE_URL && fs.existsSync(serverEnv)) {
    dotenv.config({ path: serverEnv });
  }
};

const getBaseDatabaseUrl = () => {
  if (!process.env.DATABASE_URL && !process.env.E2E_DATABASE_URL) {
    loadEnv();
  }

  const resolvedUrl = process.env.E2E_DATABASE_URL || process.env.DATABASE_URL;

  if (!resolvedUrl) {
    throw new Error('DATABASE_URL must be set for e2e tests');
  }

  return resolvedUrl;
};

export const buildSchemaName = (suffix: string) => {
  const worker = process.env.JEST_WORKER_ID || '1';
  return `prisma_test_${suffix}_${worker}`;
};

const withSchema = (url: string, schema: string) => {
  const parsed = new URL(url);
  parsed.searchParams.set('schema', schema);
  return parsed.toString();
};

const withoutSchema = (url: string) => {
  const parsed = new URL(url);
  parsed.searchParams.delete('schema');
  return parsed.toString();
};

export const createTestDatabaseUrl = (schema: string) => withSchema(getBaseDatabaseUrl(), schema);

export const ensureSchema = async (schema: string) => {
  const client = new Client({ connectionString: withoutSchema(getBaseDatabaseUrl()) });
  await client.connect();
  await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
  await client.end();
};

export const dropSchema = async (schema: string) => {
  if (schema === 'public') return;
  const client = new Client({ connectionString: withoutSchema(getBaseDatabaseUrl()) });
  await client.connect();
  await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await client.end();
};

export const pushSchema = (databaseUrl: string) => {
  execSync('npx prisma db push --schema prisma/schema.prisma --skip-generate', {
    cwd: path.resolve(__dirname, '..', '..', '..'),
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl
    },
    stdio: 'ignore'
  });
};
