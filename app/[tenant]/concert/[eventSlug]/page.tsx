import { notFound } from 'next/navigation';
import { db } from '@/lib/drizzle.server';
import { events, tenants, ticketTypes } from '@/shared/schema';
import { eq, and } from 'drizzle-orm';
import { resolveTenant, getTenantThemeVars } from '@/lib/tenant';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Speakers } from '@/components/Speakers';
import { Agenda } from '@/components/Agenda';
import { PricingTiers } from '@/components/PricingTiers';
import { FAQ } from '@/components/FAQ';
import { Footer } from '@/components/Footer';
import { StickyCTA } from '@/components/StickyCTA';
import { CheckoutModal } from '@/components/CheckoutModal';

interface Props {
  params: Promise<{
    tenant: string;
    eventSlug: string;
  }>;
}

export default async function ConcertPage({ params }: Props) {
  const resolvedParams = await params;
  const tenant = await resolveTenant(resolvedParams.tenant);
  
  if (!tenant) {
    notFound();
  }

  const [event] = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.tenantId, tenant.id),
        eq(events.slug, resolvedParams.eventSlug),
        eq(events.type, 'concert')
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

  const themeVars = getTenantThemeVars(tenant);

  return (
    <div 
      className="min-h-screen bg-background"
      data-tenant={tenant.slug}
      style={themeVars}
    >
      <Header tenant={tenant} />
      
      <Hero 
        event={event}
        tenant={tenant}
        type="concert"
      />
      
      <Speakers 
        speakers={event.speakers || []}
        type="concert"
      />
      
      <Agenda 
        agenda={event.agenda || []}
        type="concert"
      />
      
      <PricingTiers 
        ticketTypes={eventTicketTypes}
        event={event}
        tenant={tenant}
      />
      
      <FAQ type="concert" />
      
      <Footer tenant={tenant} />
      
      <StickyCTA event={event} />
      
      <CheckoutModal 
        event={event}
        tenant={tenant}
        ticketTypes={eventTicketTypes}
      />
    </div>
  );
}

export async function generateMetadata({ params }: Props) {
  const resolvedParams = await params;
  const tenant = await resolveTenant(resolvedParams.tenant);
  
  if (!tenant) {
    return {
      title: 'Event Not Found',
    };
  }

  const [event] = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.tenantId, tenant.id),
        eq(events.slug, resolvedParams.eventSlug),
        eq(events.type, 'concert')
      )
    )
    .limit(1);

  if (!event) {
    return {
      title: 'Event Not Found',
    };
  }

  return {
    title: `${event.title} - ${tenant.name}`,
    description: event.description,
    openGraph: {
      title: event.title,
      description: event.description,
      images: event.imageUrl ? [event.imageUrl] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description: event.description,
      images: event.imageUrl ? [event.imageUrl] : [],
    },
  };
}
