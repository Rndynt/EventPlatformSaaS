import { migrate } from 'drizzle-orm/neon-http/migrator';
import { db } from '../lib/drizzle.server';
import { config } from 'dotenv';

// Load environment variables
config();

async function runMigrations() {
  console.log('🔄 Running database migrations...');

  try {
    await migrate(db, { 
      migrationsFolder: './migrations',
      migrationsTable: 'migrations',
    });
    
    console.log('✅ Migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('✅ Migration process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration process failed:', error);
      process.exit(1);
    });
}

export { runMigrations };
