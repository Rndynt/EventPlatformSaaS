import { headers } from 'next/headers';
import { db } from './drizzle.server';
import { tenants, type Tenant } from '@/shared/schema';
import { eq } from 'drizzle-orm';

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  try {
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);
    
    return tenant || null;
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return null;
  }
}

export async function getTenantByDomain(domain: string): Promise<Tenant | null> {
  try {
    const allTenants = await db.select().from(tenants);
    
    const tenant = allTenants.find(t => 
      t.domains && Array.isArray(t.domains) && t.domains.includes(domain)
    );
    
    return tenant || null;
  } catch (error) {
    console.error('Error fetching tenant by domain:', error);
    return null;
  }
}

export async function resolveTenant(tenantSlug?: string): Promise<Tenant | null> {
  // First try to resolve by slug parameter
  if (tenantSlug) {
    return getTenantBySlug(tenantSlug);
  }
  
  // Then try to resolve by hostname
  try {
    const headersList = headers();
    const host = headersList.get('host');
    
    if (host) {
      // Remove port if present
      const domain = host.split(':')[0];
      return getTenantByDomain(domain);
    }
  } catch (error) {
    console.error('Error resolving tenant from headers:', error);
  }
  
  return null;
}

export function getTenantThemeVars(tenant: Tenant): Record<string, string> {
  const theme = tenant.theme || {};
  
  return {
    '--tenant-primary': theme.primaryColor || '#6366F1',
    '--tenant-secondary': theme.secondaryColor || '#EC4899',
    '--tenant-accent': theme.accentColor || '#10B981',
    '--font-family': theme.fontFamily || 'Inter',
  };
}
