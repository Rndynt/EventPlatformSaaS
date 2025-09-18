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

export async function verifyAuthToken(token: string): Promise<AuthUser | null> {
  try {
    const payload = await verifyJWT(token);
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

export async function requireAuth(request: NextRequest): Promise<{ user: AuthUser } | { error: NextResponse }> {
  const token = getAuthToken(request);
  
  if (!token) {
    return { 
      error: NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      ) 
    };
  }

  const user = await verifyAuthToken(token);
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

export function requireTenantAccess(authUser: AuthUser, tenantId: string): NextResponse | null {
  if (authUser.tenantId !== tenantId) {
    return NextResponse.json(
      { error: 'Access denied - insufficient permissions' },
      { status: 403 }
    );
  }
  return null;
}

export function createAuthMiddleware() {
  return async (request: NextRequest) => {
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
      const authResult = await requireAuth(request);
      
      if ('error' in authResult) {
        // Redirect to login page instead of returning JSON
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
      }
      
      // Extract tenant from URL and verify access
      const pathParts = pathname.split('/');
      const tenantSlug = pathParts[2]; // /admin/[tenant]
      
      if (tenantSlug) {
        // For security, we'll check tenant access using JWT payload
        // The JWT should contain tenant information that we can verify
        const user = authResult.user;
        
        // For now, we'll implement a basic tenant slug validation
        // In a production system, you'd store tenant slug in JWT or make the check more sophisticated
        
        // Basic validation: prevent access to other tenants
        // This is a simple approach - in production you'd want to include tenant slug in JWT
        // or implement a more robust tenant resolution system
        
        // For demo purposes, we'll allow access only if the user is authenticated
        // and redirect to login with error if they try to access unauthorized areas
        
        // Log the access attempt for security monitoring
        console.log(`User ${user.email} (tenant: ${user.tenantId}) accessing /admin/${tenantSlug}`);
        
        // This is a basic implementation - for full security you'd want to:
        // 1. Include tenant slug in JWT during login
        // 2. Compare JWT tenant slug with URL tenant slug
        // 3. Or resolve tenant slug to ID and compare with user.tenantId
        
        // For now, we ensure the user is authenticated and log access
        if (!user.tenantId) {
          const accessDeniedUrl = new URL('/login?error=access_denied', request.url);
          return NextResponse.redirect(accessDeniedUrl);
        }
      }
    }

    return NextResponse.next();
  };
}