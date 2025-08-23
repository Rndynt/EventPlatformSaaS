import { db } from '../lib/drizzle.server';
import { tenants, events, ticketTypes, adminUsers } from '../shared/schema';
import { hashPassword } from '../lib/auth';

async function seed() {
  console.log('🌱 Seeding database...');

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

    // Create demo events
    const currentDate = new Date();
    const futureDate = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    const demoEvents = await db.insert(events).values([
      {
        tenantId: demoTenants[0].id,
        slug: 'advanced-react-patterns',
        type: 'webinar',
        title: 'Advanced React Patterns',
        subtitle: 'Master Modern Development',
        description: 'Join industry experts as we dive deep into advanced React patterns, performance optimization, and cutting-edge techniques that will elevate your development skills.',
        startDate: futureDate,
        endDate: new Date(futureDate.getTime() + 90 * 60 * 1000), // 90 minutes later
        capacity: 500,
        status: 'published',
        imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
        speakers: [
          {
            name: 'Sarah Chen',
            title: 'Senior React Developer at Meta',
            bio: 'Sarah has been building React applications for 6+ years and is a core contributor to several open-source projects.',
            imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200',
            socialLinks: { twitter: 'https://twitter.com', linkedin: 'https://linkedin.com' }
          },
          {
            name: 'David Rodriguez',
            title: 'Technical Architect at Stripe',
            bio: 'David leads frontend architecture at Stripe and has spoken at major conferences worldwide.',
            imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&h=200',
            socialLinks: { twitter: 'https://twitter.com', linkedin: 'https://linkedin.com' }
          }
        ],
        agenda: [
          {
            time: '14:00',
            title: 'Advanced Component Patterns',
            description: 'Explore compound components, render props, and HOCs',
            duration: 20,
            speaker: 'Sarah Chen'
          },
          {
            time: '14:20',
            title: 'State Management Deep Dive',
            description: 'Master Context API, useReducer, and state patterns',
            duration: 25,
            speaker: 'David Rodriguez'
          },
          {
            time: '14:45',
            title: 'Performance Optimization',
            description: 'React.memo, useMemo, useCallback, and code splitting',
            duration: 30,
            speaker: 'Sarah Chen'
          },
          {
            time: '15:15',
            title: 'Q&A Session',
            description: 'Interactive Q&A with the expert panel',
            duration: 15
          }
        ]
      },
      {
        tenantId: demoTenants[1].id,
        slug: 'fullstack-bootcamp',
        type: 'workshop',
        title: 'Full-Stack Development Bootcamp',
        subtitle: 'Build Real Applications',
        description: '3-day intensive workshop covering React, Node.js, and deployment. Build and deploy 3 real projects with expert guidance.',
        startDate: new Date(futureDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week later
        endDate: new Date(futureDate.getTime() + 10 * 24 * 60 * 60 * 1000), // 3 days duration
        capacity: 20,
        status: 'published',
        location: 'San Francisco, CA',
        imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&h=600',
        speakers: [
          {
            name: 'Alex Johnson',
            title: 'Full-Stack Engineer',
            bio: 'Alex has built and deployed dozens of production applications and loves teaching modern web development.',
            imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200',
            socialLinks: { github: 'https://github.com', linkedin: 'https://linkedin.com' }
          }
        ],
        agenda: [
          {
            time: 'Day 1',
            title: 'React Fundamentals & Project Setup',
            description: 'Build a task management app from scratch',
            duration: 480,
            speaker: 'Alex Johnson'
          },
          {
            time: 'Day 2',
            title: 'Backend API & Database Integration',
            description: 'Create REST API with authentication',
            duration: 480,
            speaker: 'Alex Johnson'
          },
          {
            time: 'Day 3',
            title: 'Deployment & Production Best Practices',
            description: 'Deploy to cloud and implement CI/CD',
            duration: 480,
            speaker: 'Alex Johnson'
          }
        ]
      },
      {
        tenantId: demoTenants[2].id,
        slug: 'summer-music-festival',
        type: 'concert',
        title: 'Summer Music Festival 2024',
        subtitle: 'Three Days of Incredible Music',
        description: 'Three days of incredible music featuring top artists, local bands, and emerging talent in a beautiful outdoor setting.',
        startDate: new Date(futureDate.getTime() + 60 * 24 * 60 * 60 * 1000), // 2 months later
        endDate: new Date(futureDate.getTime() + 63 * 24 * 60 * 60 * 1000), // 3 days
        capacity: 5000,
        status: 'published',
        location: 'Central Park, NYC',
        imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=800&h=600',
        speakers: [ // Artists for concert
          {
            name: 'The Electric Waves',
            title: 'Headliner Band',
            bio: 'Grammy-nominated indie rock band known for their electrifying live performances.',
            imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=200&h=200',
            socialLinks: { spotify: 'https://spotify.com', instagram: 'https://instagram.com' }
          },
          {
            name: 'Luna Martinez',
            title: 'Singer-Songwriter',
            bio: 'Rising star in the folk-pop scene with millions of streams worldwide.',
            imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=200&h=200',
            socialLinks: { spotify: 'https://spotify.com', instagram: 'https://instagram.com' }
          }
        ],
        agenda: [
          {
            time: 'Friday 7PM',
            title: 'Opening Night',
            description: 'Local bands and emerging artists',
            duration: 240
          },
          {
            time: 'Saturday 6PM',
            title: 'Main Stage',
            description: 'Featured artists and headliners',
            duration: 300
          },
          {
            time: 'Sunday 5PM',
            title: 'Festival Finale',
            description: 'Closing ceremony and final performances',
            duration: 300
          }
        ]
      }
    ]).returning();

    console.log('✅ Created events:', demoEvents.map(e => e.title));

    // Create ticket types for each event
    const ticketTypeData = [];

    // Webinar tickets (free and paid)
    ticketTypeData.push(
      {
        eventId: demoEvents[0].id,
        name: 'Free Access',
        description: 'Live webinar access and Q&A participation',
        price: '0.00',
        quantity: 300,
        isPaid: false,
        isVisible: true,
        perks: ['Live webinar access', 'Q&A participation', 'Basic resources download']
      },
      {
        eventId: demoEvents[0].id,
        name: 'Pro Access',
        description: 'Everything in Free plus recording and resources',
        price: '29.00',
        quantity: 150,
        isPaid: true,
        isVisible: true,
        perks: ['Everything in Free', '30-day recording access', 'Complete code examples', 'Resource templates', 'Private community access']
      },
      {
        eventId: demoEvents[0].id,
        name: 'Team Package',
        description: 'For teams of 5+ people',
        price: '99.00',
        quantity: 50,
        isPaid: true,
        isVisible: true,
        perks: ['Everything in Pro', 'Up to 10 team seats', 'Team dashboard', 'Custom onboarding', 'Priority support']
      }
    );

    // Workshop tickets
    ticketTypeData.push(
      {
        eventId: demoEvents[1].id,
        name: 'Early Bird',
        description: 'Limited time early bird pricing',
        price: '299.00',
        quantity: 10,
        isPaid: true,
        isVisible: true,
        perks: ['3-day workshop', 'All materials included', 'Lunch provided', 'Certificate of completion']
      },
      {
        eventId: demoEvents[1].id,
        name: 'Regular Ticket',
        description: 'Standard workshop admission',
        price: '399.00',
        quantity: 10,
        isPaid: true,
        isVisible: true,
        perks: ['3-day workshop', 'All materials included', 'Certificate of completion']
      }
    );

    // Concert tickets
    ticketTypeData.push(
      {
        eventId: demoEvents[2].id,
        name: 'General Admission',
        description: '3-day festival pass',
        price: '149.00',
        quantity: 3000,
        isPaid: true,
        isVisible: true,
        perks: ['3-day festival access', 'All stages', 'Food vendors', 'Merchandise booth access']
      },
      {
        eventId: demoEvents[2].id,
        name: 'VIP Pass',
        description: 'Premium festival experience',
        price: '399.00',
        quantity: 500,
        isPaid: true,
        isVisible: true,
        perks: ['Everything in GA', 'VIP viewing area', 'Complimentary drinks', 'Artist meet & greet', 'VIP lounge access', 'Express entry']
      },
      {
        eventId: demoEvents[2].id,
        name: 'Student Discount',
        description: 'Discounted rate for students',
        price: '99.00',
        quantity: 500,
        isPaid: true,
        isVisible: true,
        perks: ['3-day festival access', 'All stages', 'Student ID required']
      }
    );

    await db.insert(ticketTypes).values(ticketTypeData);

    console.log('✅ Created ticket types');
    console.log('🎉 Database seeded successfully!');
    console.log('\n📋 Demo credentials:');
    console.log('Email: admin@techcorp.com');
    console.log('Password: admin123');
    console.log('\n🌐 Demo URLs:');
    console.log('Webinar: http://localhost:3000/demo/webinar/advanced-react-patterns');
    console.log('Workshop: http://localhost:3000/startup/workshop/fullstack-bootcamp');
    console.log('Concert: http://localhost:3000/musicfest/concert/summer-music-festival');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

if (require.main === module) {
  seed()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export { seed };
