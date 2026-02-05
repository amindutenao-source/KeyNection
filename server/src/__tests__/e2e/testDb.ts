import path from 'path';
import { execSync } from 'child_process';
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });

const BASE_DATABASE_URL = process.env.DATABASE_URL;

if (!BASE_DATABASE_URL) {
  throw new Error('DATABASE_URL must be set for e2e tests');
}

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

export const createTestDatabaseUrl = (schema: string) => withSchema(BASE_DATABASE_URL, schema);

export const ensureSchema = async (schema: string) => {
  const client = new Client({ connectionString: withoutSchema(BASE_DATABASE_URL) });
  await client.connect();
  await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
  await client.end();
};

export const dropSchema = async (schema: string) => {
  if (schema === 'public') return;
  const client = new Client({ connectionString: withoutSchema(BASE_DATABASE_URL) });
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
