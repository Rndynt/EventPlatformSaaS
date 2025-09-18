import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { tenants } from '@/shared/schema';
import { eq } from 'drizzle-orm';

export async function resolveTenantSlugToId(tenantSlug: string): Promise<string | null> {
  try {
    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);
    
    return tenant?.id || null;
  } catch (error) {
    console.error('Error resolving tenant slug:', error);
    return null;
  }
}

export function extractTenantSlugFromAdminPath(pathname: string): string | null {
  // Extract tenant slug from /admin/[tenant] format
  const pathParts = pathname.split('/');
  
  if (pathParts.length >= 3 && pathParts[1] === 'admin') {
    return pathParts[2] || null;
  }
  
  return null;
}