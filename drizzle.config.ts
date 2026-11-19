import {loadEnvConfig} from '@next/env';
import { defineConfig } from 'drizzle-kit';

loadEnvConfig(process.cwd());

// Use DATABASE_URL_UNPOOLED to keep the migration connection separate from the regular application connection.
const databaseUrl = process.env.DATABASE_URL_UNPOOLED;

if (!databaseUrl) {
  throw new Error('DATABASE_URL_UNPOOLED is not set');
}

export default defineConfig({
  out: './drizzle',
  schema: './src/lib/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl!,
  },
});
