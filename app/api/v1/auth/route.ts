import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/drizzle.server';
import { adminUsers, tenants } from '@/shared/schema';
import { eq, and } from 'drizzle-orm';
import { hashPassword, verifyPassword, generateJWT, verifyJWT, extractTokenFromRequest } from '@/lib/auth';
import { cookies } from 'next/headers';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  tenantSlug: z.string().optional(),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  tenantSlug: z.string(),
  role: z.enum(['admin', 'manager', 'staff']).default('admin'),
});

// POST - Login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, tenantSlug } = loginSchema.parse(body);

    // Find admin user
    let adminQuery = db
      .select()
      .from(adminUsers)
      .innerJoin(tenants, eq(adminUsers.tenantId, tenants.id))
      .where(eq(adminUsers.email, email));

    if (tenantSlug) {
      adminQuery = adminQuery.where(eq(tenants.slug, tenantSlug));
    }

    const [adminData] = await adminQuery.limit(1);

    if (!adminData || !adminData.admin_users.isActive) {
      return NextResponse.json(
        { error: 'Invalid credentials or account inactive' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, adminData.admin_users.password);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last login
    await db
      .update(adminUsers)
      .set({ lastLoginAt: new Date() })
      .where(eq(adminUsers.id, adminData.admin_users.id));

    // Generate JWT
    const token = generateJWT({
      userId: adminData.admin_users.id,
      tenantId: adminData.admin_users.tenantId,
      role: adminData.admin_users.role,
      email: adminData.admin_users.email,
    });

    // Set HTTP-only cookie
    const cookieStore = cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: adminData.admin_users.id,
        email: adminData.admin_users.email,
        name: adminData.admin_users.name,
        role: adminData.admin_users.role,
        tenant: {
          id: adminData.tenants.id,
          slug: adminData.tenants.slug,
          name: adminData.tenants.name,
        },
      },
      token, // Also return token for client-side storage if needed
    });
  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Register new admin user
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, tenantSlug, role } = registerSchema.parse(body);

    // Find tenant
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Check if admin user already exists
    const [existingAdmin] = await db
      .select()
      .from(adminUsers)
      .where(
        and(
          eq(adminUsers.email, email),
          eq(adminUsers.tenantId, tenant.id)
        )
      )
      .limit(1);

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin user already exists with this email' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create admin user
    const [newAdmin] = await db
      .insert(adminUsers)
      .values({
        email,
        password: hashedPassword,
        name,
        tenantId: tenant.id,
        role,
        isActive: true,
      })
      .returning();

    return NextResponse.json({
      success: true,
      user: {
        id: newAdmin.id,
        email: newAdmin.email,
        name: newAdmin.name,
        role: newAdmin.role,
        tenant: {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
        },
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Verify current user
export async function GET(request: NextRequest) {
  try {
    // Try to get token from cookie first
    const cookieStore = cookies();
    let token = cookieStore.get('auth-token')?.value;
    
    // If not in cookie, try Authorization header
    if (!token) {
      token = extractTokenFromRequest(request);
    }

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token' },
        { status: 401 }
      );
    }

    // Verify JWT
    const payload = verifyJWT(token);
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get current user data
    const [adminData] = await db
      .select()
      .from(adminUsers)
      .innerJoin(tenants, eq(adminUsers.tenantId, tenants.id))
      .where(
        and(
          eq(adminUsers.id, payload.userId),
          eq(adminUsers.isActive, true)
        )
      )
      .limit(1);

    if (!adminData) {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: adminData.admin_users.id,
        email: adminData.admin_users.email,
        name: adminData.admin_users.name,
        role: adminData.admin_users.role,
        tenant: {
          id: adminData.tenants.id,
          slug: adminData.tenants.slug,
          name: adminData.tenants.name,
        },
      },
    });
  } catch (error) {
    console.error('Auth verification error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}

// DELETE - Logout
export async function DELETE(request: NextRequest) {
  try {
    // Clear the HTTP-only cookie
    const cookieStore = cookies();
    cookieStore.delete('auth-token');

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
