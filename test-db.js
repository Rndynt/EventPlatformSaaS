import { db } from './lib/drizzle.server.js';
import { adminUsers, tenants } from './shared/schema.js';

async function testDatabase() {
  console.log('Testing database connection...');
  try {
    const adminCount = await db.select().from(adminUsers);
    console.log('Admin users found:', adminCount.length);
    
    const tenantCount = await db.select().from(tenants);
    console.log('Tenants found:', tenantCount.length);
    
    if (tenantCount.length > 0) {
      console.log('First tenant:', tenantCount[0]);
    }
    
    if (adminCount.length > 0) {
      console.log('First admin:', { 
        id: adminCount[0].id,
        email: adminCount[0].email,
        name: adminCount[0].name,
        tenantId: adminCount[0].tenantId
      });
    }
    
    console.log('Database connection test completed successfully.');
  } catch (error) {
    console.error('Database error:', error);
  }
}

testDatabase();