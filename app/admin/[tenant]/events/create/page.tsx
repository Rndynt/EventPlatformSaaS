import { notFound } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant';
import { EventCreateForm } from '@/components/EventCreateForm';

interface Props {
  params: Promise<{
    tenant: string;
  }>;
}

export default async function CreateEventPage({ params }: Props) {
  const resolvedParams = await params;
  const tenant = await resolveTenant(resolvedParams.tenant);
  
  if (!tenant) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
          <p className="text-gray-600 mt-2">
            Create a new event for {tenant.name}
          </p>
        </div>
        
        <EventCreateForm tenant={tenant} />
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: Props) {
  const resolvedParams = await params;
  const tenant = await resolveTenant(resolvedParams.tenant);
  
  return {
    title: tenant ? `Create Event - ${tenant.name}` : 'Create Event',
    description: 'Create a new event',
  };
}
