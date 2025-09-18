import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// For development, disable SSL certificate verification to handle self-signed certs
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Configure neon client for Neon databases
const client = neon(process.env.DATABASE_URL, {
  fetchOptions: {
    cache: 'no-store',
  },
});
export const db = drizzle(client, { schema });
