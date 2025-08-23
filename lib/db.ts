import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL environment variable is required. Please ensure the database is provisioned.'
  );
}

const client = neon(process.env.DATABASE_URL);
export const db = drizzle(client, { schema });

// Helper function to test database connection
export async function testConnection() {
  try {
    await db.execute(`SELECT 1`);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Helper function to get database info
export async function getDatabaseInfo() {
  try {
    const result = await db.execute(`SELECT version() as version`);
    return result.rows[0];
  } catch (error) {
    console.error('Failed to get database info:', error);
    return null;
  }
}
