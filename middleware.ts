import { NextRequest } from 'next/server';
import { createAuthMiddleware } from '@/lib/middleware/auth';

export function middleware(request: NextRequest) {
  return createAuthMiddleware()(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};