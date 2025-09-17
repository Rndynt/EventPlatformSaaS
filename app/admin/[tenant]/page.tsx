import { notFound, redirect } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant';
import { AdminDashboard } from '@/components/AdminDashboard';

interface Props {
  params: Promise<{
    tenant: string;
  }>;
}

export default async function AdminTenantPage({ params }: Props) {
  const resolvedParams = await params;
  const tenant = await resolveTenant(resolvedParams.tenant);
  
  if (!tenant) {
    notFound();
  }

  return <AdminDashboard tenant={tenant} />;
}

export async function generateMetadata({ params }: Props) {
  const resolvedParams = await params;
  const tenant = await resolveTenant(resolvedParams.tenant);
  
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
