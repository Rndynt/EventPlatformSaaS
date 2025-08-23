import { notFound } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant';
import { TenantSettings } from '@/components/TenantSettings';

interface Props {
  params: {
    tenant: string;
  };
}

export default async function SettingsPage({ params }: Props) {
  const tenant = await resolveTenant(params.tenant);
  
  if (!tenant) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage settings for {tenant.name}
          </p>
        </div>
        
        <TenantSettings tenant={tenant} />
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: Props) {
  const tenant = await resolveTenant(params.tenant);
  
  return {
    title: tenant ? `Settings - ${tenant.name}` : 'Settings',
    description: 'Tenant settings and configuration',
  };
}
