import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

jest.mock('express-serve-static-core', () => ({}), { virtual: true });

const loadDatabaseUrlFromEnvFiles = () => {
  const serverEnv = path.resolve(__dirname, '..', '..', '.env');
  const repoEnv = path.resolve(__dirname, '..', '..', '..', '.env');
  const envFiles = [serverEnv, repoEnv];

  for (const envPath of envFiles) {
    if (!fs.existsSync(envPath)) {
      continue;
    }
    try {
      const parsed = dotenv.parse(fs.readFileSync(envPath));
      if (parsed.DATABASE_URL) {
        return parsed.DATABASE_URL;
      }
    } catch {
      // ignore parsing errors
    }
  }
  return null;
};

if (!process.env.E2E_DATABASE_URL) {
  const fileDatabaseUrl = loadDatabaseUrlFromEnvFiles();
  if (fileDatabaseUrl) {
    process.env.E2E_DATABASE_URL = fileDatabaseUrl;
  }
}
