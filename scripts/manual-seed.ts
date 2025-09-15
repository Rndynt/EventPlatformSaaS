#!/usr/bin/env tsx
import { db } from '../lib/drizzle.server';
import { tenants, events, ticketTypes, adminUsers } from '../shared/schema';
import { hashPassword } from '../lib/auth';

async function manualSeed() {
  console.log('🌱 Starting manual database seed...');

  try {
    // Create demo tenants
    const demoTenants = await db.insert(tenants).values([
      {
        slug: 'demo',
        name: 'TechCorp',
        email: 'admin@techcorp.com',
        domains: ['demo.localhost'],
        theme: {
          primaryColor: '#6366F1',
          secondaryColor: '#EC4899',
          accentColor: '#10B981',
          fontFamily: 'Inter',
          hidePlatformBranding: false
        }
      },
      {
        slug: 'startup',
        name: 'StartupEvents',
        email: 'admin@startupevents.com',
        domains: ['startup.localhost'],
        theme: {
          primaryColor: '#F59E0B',
          secondaryColor: '#8B5CF6',
          accentColor: '#EF4444',
          fontFamily: 'Inter',
          hidePlatformBranding: false
        }
      },
      {
        slug: 'musicfest',
        name: 'Music Festival Co',
        email: 'admin@musicfest.com',
        domains: ['musicfest.localhost'],
        theme: {
          primaryColor: '#8B5CF6',
          secondaryColor: '#F59E0B',
          accentColor: '#10B981',
          fontFamily: 'Inter',
          hidePlatformBranding: true
        }
      }
    ]).returning();

    console.log('✅ Created tenants:', demoTenants.map(t => t.name));

    // Create demo admin users
    const hashedPassword = await hashPassword('admin123');
    
    await db.insert(adminUsers).values([
      {
        tenantId: demoTenants[0].id,
        email: 'admin@techcorp.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'admin'
      },
      {
        tenantId: demoTenants[1].id,
        email: 'admin@startupevents.com',
        password: hashedPassword,
        name: 'Startup Admin',
        role: 'admin'
      },
      {
        tenantId: demoTenants[2].id,
        email: 'admin@musicfest.com',
        password: hashedPassword,
        name: 'Music Admin',
        role: 'admin'
      }
    ]);

    console.log('✅ Created admin users');
    console.log('🎉 Database seeded successfully!');
    
    console.log('\n📋 Access Information:');
    console.log('Dashboard URLs:');
    console.log('- TechCorp: http://localhost:5000/admin/demo');
    console.log('- StartupEvents: http://localhost:5000/admin/startup');
    console.log('- Music Festival: http://localhost:5000/admin/musicfest');
    console.log('\nLogin Credentials:');
    console.log('- Email: admin@techcorp.com (or respective tenant emails)');
    console.log('- Password: admin123');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

manualSeed();