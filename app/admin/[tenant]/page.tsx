import { notFound, redirect } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant';
import { AdminDashboard } from '@/components/AdminDashboard';

interface Props {
  params: {
    tenant: string;
  };
}

export default async function AdminTenantPage({ params }: Props) {
  const tenant = await resolveTenant(params.tenant);
  
  if (!tenant) {
    notFound();
  }

  return <AdminDashboard tenant={tenant} />;
}

export async function generateMetadata({ params }: Props) {
  const tenant = await resolveTenant(params.tenant);
  
  if (!tenant) {
    return {
      title: 'Tenant Not Found',
    };
  }

  return {
    title: `Admin Dashboard - ${tenant.name}`,
    description: `Admin dashboard for ${tenant.name} events`,
  };
}
