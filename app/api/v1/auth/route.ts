import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { adminUsers, tenants } from '@/shared/schema';
import { eq, and } from 'drizzle-orm';
import { hashPassword, verifyPassword, generateJWT, verifyJWT } from '@/lib/auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  tenantSlug: z.string().min(1, 'Tenant slug is required'),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  tenantSlug: z.string(),
  role: z.enum(['admin', 'manager', 'staff']).default('admin'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, tenantSlug } = loginSchema.parse(body);

    // Find admin user with proper Drizzle query structure
    const adminQuery = await db
      .select({
        adminUser: adminUsers,
        tenant: tenants,
      })
      .from(adminUsers)
      .innerJoin(tenants, eq(adminUsers.tenantId, tenants.id))
      .where(and(
        eq(adminUsers.email, email),
        eq(tenants.slug, tenantSlug),
        eq(adminUsers.isActive, true)
      ))
      .limit(1);

    const [adminData] = adminQuery;

    if (!adminData || !adminData.adminUser.isActive) {
      return NextResponse.json({ error: 'Invalid credentials or account inactive' }, { status: 401 });
    }

    // Verify password
    const isValid = await verifyPassword(password, adminData.adminUser.password);
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Update last login
    await db
      .update(adminUsers)
      .set({ lastLoginAt: new Date() })
      .where(eq(adminUsers.id, adminData.adminUser.id));

    // Generate JWT
    const token = await generateJWT({
      userId: adminData.adminUser.id,
      tenantId: adminData.adminUser.tenantId,
      role: adminData.adminUser.role as string,
      email: adminData.adminUser.email,
    });

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      user: {
        id: adminData.adminUser.id,
        email: adminData.adminUser.email,
        name: adminData.adminUser.name,
        role: adminData.adminUser.role,
        tenant: {
          id: adminData.tenant.id,
          slug: adminData.tenant.slug,
          name: adminData.tenant.name,
        },
      },
      token, // Include token for client-side storage
    });

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('auth-token')?.value;
    
    const token = cookieToken || (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null);
    
    if (!token) {
      return NextResponse.json({ error: 'No authentication token' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        userId: payload.userId,
        tenantId: payload.tenantId,
        role: payload.role,
        email: payload.email,
      },
    });
  } catch (error) {
    console.error('Auth verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
    
    // Clear the auth cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}