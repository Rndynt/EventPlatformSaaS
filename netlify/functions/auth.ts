import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  tenantSlug: z.string(),
});

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Enable CORS for all origins
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const validatedData = loginSchema.parse(body);

    // Import dependencies here to avoid cold start issues
    const { db } = await import('../../lib/drizzle.server');
    const { adminUsers, tenants } = await import('../../shared/schema');
    const { eq, and } = await import('drizzle-orm');
    const { verifyPassword, generateJWT } = await import('../../lib/auth');

    // Find the tenant
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, validatedData.tenantSlug))
      .limit(1);

    if (!tenant) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Tenant not found' }),
      };
    }

    // Find the admin user
    const [adminUser] = await db
      .select()
      .from(adminUsers)
      .where(
        and(
          eq(adminUsers.email, validatedData.email),
          eq(adminUsers.tenantId, tenant.id)
        )
      )
      .limit(1);

    if (!adminUser) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid credentials' }),
      };
    }

    // Verify password
    const isValidPassword = await verifyPassword(validatedData.password, adminUser.password);
    
    if (!isValidPassword) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid credentials' }),
      };
    }

    // Generate JWT token
    const token = await generateJWT({
      userId: adminUser.id,
      email: adminUser.email,
      tenantId: tenant.id,
      role: adminUser.role,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        token,
        user: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
        },
        tenant: {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
        },
      }),
    };
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid input data',
          details: error.errors,
        }),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};