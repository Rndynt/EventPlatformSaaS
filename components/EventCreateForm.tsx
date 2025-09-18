'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Plus, Trash2, Upload } from 'lucide-react';
import { Button } from '@/lib/components/ui/button';
import { Input } from '@/lib/components/ui/input';
import { Textarea } from '@/lib/components/ui/textarea';
import { Label } from '@/lib/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/lib/components/ui/select';
import { Switch } from '@/lib/components/ui/switch';
import { useToast } from '@/lib/hooks/use-toast';
import type { Tenant } from '@/shared/schema';

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['webinar', 'workshop', 'concert']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  timezone: z.string().default('UTC'),
  location: z.string().optional(),
  capacity: z.number().min(1).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

const ticketTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.string().regex(/^\d+(\.\d{2})?$/, 'Invalid price format'),
  quantity: z.number().min(1).optional(),
  isPaid: z.boolean(),
  perks: z.array(z.string()),
});

const speakerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  title: z.string().min(1, 'Title is required'),
  bio: z.string().min(1, 'Bio is required'),
  imageUrl: z.string().url().optional().or(z.literal('')),
  socialLinks: z.record(z.string().url()).optional(),
});

const agendaItemSchema = z.object({
  time: z.string().min(1, 'Time is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  duration: z.number().min(1, 'Duration is required'),
  speaker: z.string().optional(),
});

type EventForm = z.infer<typeof eventSchema>;
type TicketTypeForm = z.infer<typeof ticketTypeSchema>;
type SpeakerForm = z.infer<typeof speakerSchema>;
type AgendaItemForm = z.infer<typeof agendaItemSchema>;

interface EventCreateFormProps {
  tenant: Tenant;
}

export function EventCreateForm({ tenant }: EventCreateFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [ticketTypes, setTicketTypes] = useState<TicketTypeForm[]>([]);
  const [speakers, setSpeakers] = useState<SpeakerForm[]>([]);
  const [agenda, setAgenda] = useState<AgendaItemForm[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      type: 'webinar',
      timezone: 'UTC',
      capacity: undefined,
    },
  });

  const steps = [
    { id: 1, title: 'Basic Info', description: 'Event details and settings' },
    { id: 2, title: 'Tickets', description: 'Pricing and ticket types' },
    { id: 3, title: 'Speakers', description: 'Add speakers or performers' },
    { id: 4, title: 'Agenda', description: 'Schedule and timeline' },
    { id: 5, title: 'Review', description: 'Finalize and publish' },
  ];

  const handleAddTicketType = () => {
    setTicketTypes([...ticketTypes, {
      name: '',
      description: '',
      price: '0.00',
      quantity: undefined,
      isPaid: false,
      perks: [],
    }]);
  };

  const handleRemoveTicketType = (index: number) => {
    setTicketTypes(ticketTypes.filter((_, i) => i !== index));
  };

  const handleUpdateTicketType = (index: number, field: keyof TicketTypeForm, value: any) => {
    const updated = [...ticketTypes];
    updated[index] = { ...updated[index], [field]: value };
    setTicketTypes(updated);
  };

  const handleAddSpeaker = () => {
    setSpeakers([...speakers, {
      name: '',
      title: '',
      bio: '',
      imageUrl: '',
      socialLinks: {},
    }]);
  };

  const handleRemoveSpeaker = (index: number) => {
    setSpeakers(speakers.filter((_, i) => i !== index));
  };

  const handleUpdateSpeaker = (index: number, field: keyof SpeakerForm, value: any) => {
    const updated = [...speakers];
    updated[index] = { ...updated[index], [field]: value };
    setSpeakers(updated);
  };

  const handleAddAgendaItem = () => {
    setAgenda([...agenda, {
      time: '',
      title: '',
      description: '',
      duration: 30,
      speaker: '',
    }]);
  };

  const handleRemoveAgendaItem = (index: number) => {
    setAgenda(agenda.filter((_, i) => i !== index));
  };

  const handleUpdateAgendaItem = (index: number, field: keyof AgendaItemForm, value: any) => {
    const updated = [...agenda];
    updated[index] = { ...updated[index], [field]: value };
    setAgenda(updated);
  };

  const handleSubmit = async (data: EventForm) => {
    setIsSubmitting(true);
    
    try {
      // Generate slug from title
      const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      
      const eventData = {
        tenantId: tenant.id,
        slug,
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        speakers,
        agenda,
        status: 'published',
      };

      // Create event
      const eventResponse = await fetch('/api/v1/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      if (!eventResponse.ok) {
        throw new Error('Failed to create event');
      }

      const createdEvent = await eventResponse.json();

      // Create ticket types
      for (const ticketType of ticketTypes) {
        await fetch('/api/v1/ticket-types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: createdEvent.id,
            ...ticketType,
          }),
        });
      }

      toast({
        title: 'Event Created Successfully',
        description: `${data.title} has been created and published.`,
      });

      // Redirect to event page
      window.location.href = `/${tenant.slug}/${data.type}/${slug}`;
    } catch (error) {
      toast({
        title: 'Error Creating Event',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  {...form.register('title')}
                  className="mt-1"
                  placeholder="Advanced React Patterns"
                  data-testid="input-title"
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  {...form.register('subtitle')}
                  className="mt-1"
                  placeholder="Master Modern Development"
                  data-testid="input-subtitle"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                {...form.register('description')}
                className="mt-1"
                rows={4}
                placeholder="Detailed description of your event..."
                data-testid="textarea-description"
              />
              {form.formState.errors.description && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="type">Event Type *</Label>
                <Select
                  value={form.watch('type')}
                  onValueChange={(value) => form.setValue('type', value as any)}
                >
                  <SelectTrigger className="mt-1" data-testid="select-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="webinar">Webinar</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="concert">Concert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="startDate">Start Date & Time *</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  {...form.register('startDate')}
                  className="mt-1"
                  data-testid="input-start-date"
                />
                {form.formState.errors.startDate && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.startDate.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="endDate">End Date & Time *</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  {...form.register('endDate')}
                  className="mt-1"
                  data-testid="input-end-date"
                />
                {form.formState.errors.endDate && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.endDate.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  {...form.register('location')}
                  className="mt-1"
                  placeholder="Online or physical address"
                  data-testid="input-location"
                />
              </div>

              <div>
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  {...form.register('capacity', { valueAsNumber: true })}
                  className="mt-1"
                  placeholder="Maximum attendees"
                  data-testid="input-capacity"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="imageUrl">Event Image URL</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input
                  id="imageUrl"
                  type="url"
                  {...form.register('imageUrl')}
                  className="flex-1"
                  placeholder="https://example.com/image.jpg"
                  data-testid="input-image-url"
                />
                <Button type="button" variant="outline" size="sm">
                  <Upload size={16} />
                </Button>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Ticket Types</h3>
              <Button
                type="button"
                onClick={handleAddTicketType}
                data-testid="button-add-ticket-type"
              >
                <Plus className="mr-2" size={16} />
                Add Ticket Type
              </Button>
            </div>

            {ticketTypes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No ticket types added yet. Click "Add Ticket Type" to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {ticketTypes.map((ticket, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Ticket Type {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTicketType(index)}
                          data-testid={`button-remove-ticket-${index}`}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label>Name *</Label>
                          <Input
                            value={ticket.name}
                            onChange={(e) => handleUpdateTicketType(index, 'name', e.target.value)}
                            placeholder="Free Access"
                            data-testid={`input-ticket-name-${index}`}
                          />
                        </div>

                        <div>
                          <Label>Price *</Label>
                          <div className="flex items-center">
                            <span className="px-3 py-2 bg-gray-50 border border-r-0 rounded-l-md">$</span>
                            <Input
                              type="text"
                              value={ticket.price}
                              onChange={(e) => handleUpdateTicketType(index, 'price', e.target.value)}
                              placeholder="0.00"
                              className="rounded-l-none"
                              data-testid={`input-ticket-price-${index}`}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <Label>Description</Label>
                        <Textarea
                          value={ticket.description}
                          onChange={(e) => handleUpdateTicketType(index, 'description', e.target.value)}
                          placeholder="Description of what's included"
                          rows={2}
                          data-testid={`textarea-ticket-description-${index}`}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={ticket.isPaid}
                            onCheckedChange={(checked) => handleUpdateTicketType(index, 'isPaid', checked)}
                            data-testid={`switch-ticket-paid-${index}`}
                          />
                          <Label>Paid ticket</Label>
                        </div>

                        <div className="w-32">
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            value={ticket.quantity || ''}
                            onChange={(e) => handleUpdateTicketType(index, 'quantity', parseInt(e.target.value) || undefined)}
                            placeholder="Unlimited"
                            data-testid={`input-ticket-quantity-${index}`}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Review & Publish</h3>
            
            <Card>
              <CardHeader>
                <CardTitle>Event Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="font-medium">Title:</span> {form.watch('title')}
                </div>
                <div>
                  <span className="font-medium">Type:</span> {form.watch('type')}
                </div>
                <div>
                  <span className="font-medium">Date:</span> {form.watch('startDate')} - {form.watch('endDate')}
                </div>
                <div>
                  <span className="font-medium">Ticket Types:</span> {ticketTypes.length}
                </div>
                <div>
                  <span className="font-medium">Speakers:</span> {speakers.length}
                </div>
                <div>
                  <span className="font-medium">Agenda Items:</span> {agenda.length}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return <div>Step not implemented</div>;
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === step.id
                  ? 'bg-primary text-white'
                  : currentStep > step.id
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {currentStep > step.id ? '✓' : step.id}
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium">{step.title}</div>
              <div className="text-xs text-gray-500">{step.description}</div>
            </div>
            {index < steps.length - 1 && (
              <div className="hidden sm:block w-16 h-px bg-gray-300 mx-4" />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {renderStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
          data-testid="button-previous-step"
        >
          Previous
        </Button>

        <div className="flex space-x-4">
          {currentStep < steps.length ? (
            <Button
              type="button"
              onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
              data-testid="button-next-step"
            >
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-white"
              data-testid="button-create-event"
            >
              <Save className="mr-2" size={16} />
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
