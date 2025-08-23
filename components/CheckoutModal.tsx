'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, CreditCard, CheckCircle } from 'lucide-react';
import { Button } from '@/client/src/components/ui/button';
import { Input } from '@/client/src/components/ui/input';
import { Label } from '@/client/src/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/src/components/ui/card';
import { Badge } from '@/client/src/components/ui/badge';
import { useToast } from '@/client/src/hooks/use-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import type { Event, Tenant, TicketType } from '@/shared/schema';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY 
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY)
  : null;

const registrationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
});

type RegistrationForm = z.infer<typeof registrationSchema>;

interface CheckoutModalProps {
  event: Event;
  tenant: Tenant;
  ticketTypes: TicketType[];
}

interface CheckoutFormProps {
  event: Event;
  tenant: Tenant;
  ticketType: TicketType;
  formData: RegistrationForm;
  onSuccess: (ticketData: any) => void;
  onError: (error: string) => void;
}

function CheckoutForm({ event, tenant, ticketType, formData, onSuccess, onError }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        onError(error.message || 'Payment failed');
      } else {
        onSuccess({ success: true });
      }
    } catch (error) {
      onError('Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-primary/5 p-4 rounded-lg">
        <h3 className="font-semibold text-lg">{ticketType.name}</h3>
        <p className="text-2xl font-bold text-primary">
          ${ticketType.price} {ticketType.currency}
        </p>
      </div>

      <PaymentElement />

      <Button 
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-primary text-white hover:bg-primary/90 py-3 font-semibold"
        data-testid="button-confirm-payment"
      >
        {isProcessing ? 'Processing...' : `Pay $${ticketType.price}`}
      </Button>
    </form>
  );
}

export function CheckoutModal({ event, tenant, ticketTypes }: CheckoutModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTicketType, setSelectedTicketType] = useState<TicketType | null>(null);
  const [step, setStep] = useState<'select' | 'form' | 'payment' | 'success'>('select');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [ticketData, setTicketData] = useState<any>(null);
  const { toast } = useToast();

  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
    },
  });

  useEffect(() => {
    const modal = document.getElementById('checkoutModal');
    if (modal) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            const isHidden = modal.classList.contains('hidden');
            setIsOpen(!isHidden);
            
            if (!isHidden) {
              // Get selected ticket type from modal data attributes
              const ticketTypeId = modal.getAttribute('data-selected-ticket-type');
              const selectedType = ticketTypes.find(t => t.id === ticketTypeId);
              if (selectedType) {
                setSelectedTicketType(selectedType);
                setStep(selectedType.isPaid ? 'form' : 'form');
              } else if (ticketTypes.length > 0) {
                setSelectedTicketType(ticketTypes[0]);
              }
            } else {
              // Reset when modal is closed
              setStep('select');
              setSelectedTicketType(null);
              setClientSecret(null);
              setTicketData(null);
              form.reset();
            }
          }
        });
      });

      observer.observe(modal, { attributes: true });

      return () => observer.disconnect();
    }
  }, [ticketTypes, form]);

  const closeModal = () => {
    const modal = document.getElementById('checkoutModal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  };

  const handleRegistration = async (formData: RegistrationForm) => {
    if (!selectedTicketType) return;

    try {
      const response = await fetch('/api/v1/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantSlug: tenant.slug,
          eventSlug: event.slug,
          ticketTypeId: selectedTicketType.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      if (selectedTicketType.isPaid && data.clientSecret) {
        setClientSecret(data.clientSecret);
        setStep('payment');
      } else {
        setTicketData(data);
        setStep('success');
        toast({
          title: 'Registration Successful!',
          description: 'Check your email for your ticket confirmation.',
        });
      }
    } catch (error) {
      toast({
        title: 'Registration Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handlePaymentSuccess = (paymentData: any) => {
    setTicketData(paymentData);
    setStep('success');
    toast({
      title: 'Payment Successful!',
      description: 'Your ticket has been issued. Check your email for details.',
    });
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: 'Payment Failed',
      description: error,
      variant: 'destructive',
    });
  };

  const formatPrice = (price: string, currency: string) => {
    const numPrice = parseFloat(price);
    if (numPrice === 0) {
      return 'Free';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(numPrice);
  };

  if (!isOpen) return null;

  return (
    <div 
      id="checkoutModal" 
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeModal();
        }
      }}
    >
      <Card className="w-full max-w-md transform transition-all">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">
              {step === 'success' ? 'Registration Complete!' : 'Register for Event'}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeModal}
              data-testid="button-close-modal"
            >
              <X size={20} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Ticket Selection Step */}
          {step === 'select' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Select Ticket Type</h3>
              
              <div className="space-y-3">
                {ticketTypes.map((ticketType) => (
                  <div
                    key={ticketType.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedTicketType?.id === ticketType.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTicketType(ticketType)}
                    data-testid={`select-ticket-${ticketType.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{ticketType.name}</h4>
                        <p className="text-sm text-gray-600">{ticketType.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatPrice(ticketType.price, ticketType.currency)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => setStep('form')}
                disabled={!selectedTicketType}
                className="w-full"
                data-testid="button-continue-selection"
              >
                Continue
              </Button>
            </div>
          )}

          {/* Registration Form Step */}
          {step === 'form' && selectedTicketType && (
            <form onSubmit={form.handleSubmit(handleRegistration)} className="space-y-4">
              <div className="bg-primary/5 p-4 rounded-lg mb-4">
                <h3 className="font-semibold">{selectedTicketType.name}</h3>
                <div className="text-2xl font-bold text-primary">
                  {formatPrice(selectedTicketType.price, selectedTicketType.currency)}
                </div>
              </div>

              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  className="mt-1"
                  data-testid="input-name"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register('email')}
                  className="mt-1"
                  data-testid="input-email"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...form.register('phone')}
                  className="mt-1"
                  data-testid="input-phone"
                />
              </div>

              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  {...form.register('company')}
                  className="mt-1"
                  data-testid="input-company"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-white hover:bg-primary/90"
                data-testid="button-submit-registration"
              >
                {selectedTicketType.isPaid ? 'Continue to Payment' : 'Complete Registration'}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                By registering, you agree to our Terms of Service and Privacy Policy.
              </p>
            </form>
          )}

          {/* Payment Step */}
          {step === 'payment' && selectedTicketType && clientSecret && stripePromise && (
            <Elements 
              stripe={stripePromise} 
              options={{ 
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#6366F1',
                  }
                }
              }}
            >
              <CheckoutForm
                event={event}
                tenant={tenant}
                ticketType={selectedTicketType}
                formData={form.getValues()}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </Elements>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="text-green-600" size={32} />
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Registration Complete!
                </h3>
                <p className="text-gray-600">
                  Your ticket confirmation has been sent to your email address.
                </p>
              </div>

              {ticketData?.ticket?.qrCode && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <img
                    src={ticketData.ticket.qrCode}
                    alt="Ticket QR Code"
                    className="mx-auto border"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    Present this QR code for check-in
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Button
                  onClick={() => {
                    // Add to calendar functionality
                    const startDate = new Date(event.startDate);
                    const endDate = new Date(event.endDate);
                    
                    const calendarUrl = `data:text/calendar;charset=utf8,BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.location || 'Online'}
END:VEVENT
END:VCALENDAR`;

                    const link = document.createElement('a');
                    link.href = calendarUrl;
                    link.download = `${event.slug}.ics`;
                    link.click();
                  }}
                  variant="outline"
                  className="w-full"
                  data-testid="button-add-calendar"
                >
                  Add to Calendar
                </Button>
                
                <Button
                  onClick={closeModal}
                  className="w-full bg-primary text-white"
                  data-testid="button-close-success"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
