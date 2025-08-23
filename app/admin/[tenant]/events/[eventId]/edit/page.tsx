import { notFound } from 'next/navigation';
import { db } from '@/lib/drizzle.server';
import { events, ticketTypes } from '@/shared/schema';
import { eq, and } from 'drizzle-orm';
import { resolveTenant } from '@/lib/tenant';
import { EventEditForm } from '@/components/EventEditForm';

interface Props {
  params: {
    tenant: string;
    eventId: string;
  };
}

export default async function EditEventPage({ params }: Props) {
  const tenant = await resolveTenant(params.tenant);
  
  if (!tenant) {
    notFound();
  }

  const [event] = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.id, params.eventId),
        eq(events.tenantId, tenant.id)
      )
    )
    .limit(1);

  if (!event) {
    notFound();
  }

  const eventTicketTypes = await db
    .select()
    .from(ticketTypes)
    .where(eq(ticketTypes.eventId, event.id));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
          <p className="text-gray-600 mt-2">
            Edit {event.title}
          </p>
        </div>
        
        <EventEditForm 
          tenant={tenant} 
          event={event}
          ticketTypes={eventTicketTypes}
        />
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: Props) {
  const tenant = await resolveTenant(params.tenant);
  
  const [event] = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.id, params.eventId),
        eq(events.tenantId, tenant?.id || '')
      )
    )
    .limit(1);

  return {
    title: event ? `Edit ${event.title} - ${tenant?.name}` : 'Edit Event',
    description: 'Edit event details',
  };
}
