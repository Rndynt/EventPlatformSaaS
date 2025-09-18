import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';

export interface AuthUser {
  userId: string;
  tenantId: string;
  role: string;
  email: string;
}

export function getAuthToken(request: NextRequest): string | null {
  // Try cookie first (more secure)
  const cookieToken = request.cookies.get('auth-token')?.value;
  if (cookieToken) {
    return cookieToken;
  }
  
  // Fall back to Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
}

export function verifyAuthToken(token: string): AuthUser | null {
  try {
    const payload = verifyJWT(token);
    if (!payload) {
      return null;
    }

    return {
      userId: payload.userId,
      tenantId: payload.tenantId,
      role: payload.role,
      email: payload.email,
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export function requireAuth(request: NextRequest): { user: AuthUser } | { error: NextResponse } {
  const token = getAuthToken(request);
  
  if (!token) {
    return { 
      error: NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      ) 
    };
  }

  const user = verifyAuthToken(token);
  if (!user) {
    return { 
      error: NextResponse.json(
        { error: 'Invalid or expired token' }, 
        { status: 401 }
      ) 
    };
  }

  return { user };
}

export function requireTenantAccess(user: AuthUser, tenantId: string): NextResponse | null {
  if (user.tenantId !== tenantId) {
    return NextResponse.json(
      { error: 'Access denied - insufficient permissions' },
      { status: 403 }
    );
  }
  return null;
}

export function createAuthMiddleware() {
  return (request: NextRequest) => {
    const { pathname } = request.nextUrl;
    
    // Skip auth for public routes
    if (
      pathname.startsWith('/api/health') ||
      pathname.startsWith('/login') ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api/v1/register') ||
      pathname.includes('.')
    ) {
      return NextResponse.next();
    }

    // Require auth for admin routes
    if (pathname.startsWith('/admin')) {
      const authResult = requireAuth(request);
      
      if ('error' in authResult) {
        // Redirect to login page instead of returning JSON
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
      }
      
      // Extract tenant from URL
      const pathParts = pathname.split('/');
      const tenantSlug = pathParts[2]; // /admin/[tenant]
      
      if (tenantSlug) {
        // We would need to verify tenant access here
        // For now, we'll allow access if authenticated
      }
    }

    return NextResponse.next();
  };
}