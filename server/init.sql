-- Init script for PostgreSQL container permissions.
-- This runs only on first container init (fresh volume).

-- Create a dedicated app user if it doesn't exist.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'keynection_user') THEN
    CREATE ROLE keynection_user WITH LOGIN PASSWORD 'keynection_password';
  END IF;
END$$;

-- Ensure ownership is correct on the target database.
ALTER DATABASE keynection OWNER TO postgres;
GRANT ALL PRIVILEGES ON DATABASE keynection TO postgres;
GRANT ALL PRIVILEGES ON DATABASE keynection TO keynection_user;

-- Switch to app database to manage schema permissions (safe even if already connected).
\connect keynection

-- Ensure public schema exists with correct ownership (non-destructive).
CREATE SCHEMA IF NOT EXISTS public AUTHORIZATION postgres;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO keynection_user;

-- Default privileges for objects created in public schema.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO keynection_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO keynection_user;

-- Permissions on existing objects (if any).
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO keynection_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO keynection_user;
