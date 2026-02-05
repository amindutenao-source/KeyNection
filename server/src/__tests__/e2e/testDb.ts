import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { Client } from 'pg';
import dotenv from 'dotenv';

const loadEnv = () => {
  const repoEnv = path.resolve(__dirname, '..', '..', '..', '..', '.env');
  const serverEnv = path.resolve(__dirname, '..', '..', '..', '.env');

  if (fs.existsSync(repoEnv)) {
    dotenv.config({ path: repoEnv });
  }

  if (fs.existsSync(serverEnv)) {
    dotenv.config({ path: serverEnv, override: true });
  }
};

const getBaseDatabaseUrl = () => {
  if (!process.env.DATABASE_URL && !process.env.E2E_DATABASE_URL) {
    loadEnv();
  }

  if (!process.env.E2E_DATABASE_URL && process.env.DATABASE_URL) {
    process.env.E2E_DATABASE_URL = process.env.DATABASE_URL;
  }

  const resolvedUrl = process.env.E2E_DATABASE_URL || process.env.DATABASE_URL;

  if (!resolvedUrl) {
    throw new Error('DATABASE_URL must be set for e2e tests');
  }

  return resolvedUrl;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForDatabase = async () => {
  const attempts = Number(process.env.E2E_DB_ATTEMPTS || 30);
  const delayMs = Number(process.env.E2E_DB_DELAY_MS || 1000);
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const client = new Client({ connectionString: withoutSchema(getBaseDatabaseUrl()) });
    try {
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
      return;
    } catch (error) {
      lastError = error;
      try {
        await client.end();
      } catch {
        // ignore
      }
      if (attempt < attempts) {
        await sleep(delayMs);
      }
    }
  }
  throw lastError;
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
  await waitForDatabase();
  const client = new Client({ connectionString: withoutSchema(getBaseDatabaseUrl()) });
  await client.connect();
  await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
  await client.end();
};

export const dropSchema = async (schema: string) => {
  if (schema === 'public') return;
  await waitForDatabase();
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
