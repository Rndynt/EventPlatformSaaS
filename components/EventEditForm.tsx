'use client';

import React, { useState, useEffect } from 'react';
import { EventCreateForm } from './EventCreateForm';
import type { Event, Tenant, TicketType } from '@/shared/schema';

interface EventEditFormProps {
  tenant: Tenant;
  event: Event;
  ticketTypes: TicketType[];
}

export function EventEditForm({ tenant, event, ticketTypes }: EventEditFormProps) {
  // For now, we'll reuse the EventCreateForm component
  // In a real implementation, this would be pre-populated with existing data
  
  return (
    <div>
      <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800">
          <strong>Note:</strong> You are editing "{event.title}". Changes will be saved automatically.
        </p>
      </div>
      
      <EventCreateForm tenant={tenant} />
    </div>
  );
}
