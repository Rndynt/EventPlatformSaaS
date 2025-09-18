'use client';

import React from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/lib/components/ui/button';
import { Badge } from '@/lib/components/ui/badge';
import type { TicketType, Event, Tenant } from '@/shared/schema';

interface PricingTiersProps {
  ticketTypes: TicketType[];
  event: Event;
  tenant: Tenant;
}

export function PricingTiers({ ticketTypes, event, tenant }: PricingTiersProps) {
  if (!ticketTypes || ticketTypes.length === 0) {
    return null;
  }

  const handleRegister = (ticketTypeId: string, ticketTypeName: string) => {
    // Dispatch custom event to open checkout modal with selected ticket type
    const modal = document.getElementById('checkoutModal');
    if (modal) {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      
      // Store selected ticket type in a data attribute for the modal to read
      modal.setAttribute('data-selected-ticket-type', ticketTypeId);
      modal.setAttribute('data-selected-ticket-name', ticketTypeName);
    }
  };

  const formatPrice = (price: string, currency: string) => {
    const numPrice = parseFloat(price);
    if (numPrice === 0) {
      return '$0';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(numPrice);
  };

  const getAvailability = (ticketType: TicketType) => {
    if (!ticketType.quantity) return null;
    const sold = ticketType.quantitySold || 0;
    const remaining = ticketType.quantity - sold;
    return { sold, remaining, total: ticketType.quantity };
  };

  // Find the most popular tier (usually the middle-priced one or marked)
  const popularTierIndex = Math.floor(ticketTypes.length / 2);

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4" data-testid="text-pricing-title">
            Choose Your Access Level
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto" data-testid="text-pricing-subtitle">
            Select the option that best fits your learning goals
          </p>
        </div>
        
        <div className={`grid gap-8 max-w-6xl mx-auto ${
          ticketTypes.length === 1 ? 'max-w-md mx-auto' :
          ticketTypes.length === 2 ? 'md:grid-cols-2 max-w-2xl mx-auto' :
          'md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {ticketTypes.map((ticketType, index) => {
            const isPopular = index === popularTierIndex && ticketTypes.length > 2;
            const availability = getAvailability(ticketType);
            const isSoldOut = availability && availability.remaining <= 0;
            const isLowStock = availability && availability.remaining <= 10 && availability.remaining > 0;
            
            return (
              <div 
                key={ticketType.id}
                className={`rounded-2xl p-8 border-2 relative transition-all duration-200 ${
                  isPopular 
                    ? 'bg-primary text-white border-primary transform lg:scale-105' 
                    : isSoldOut
                    ? 'bg-gray-50 border-gray-200 opacity-60'
                    : 'bg-gray-50 border-transparent hover:border-gray-200'
                } ${!isSoldOut ? 'hover:shadow-lg' : ''}`}
                data-testid={`card-ticket-${index}`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-secondary text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className={`text-2xl font-bold mb-2 ${isPopular ? 'text-white' : 'text-gray-900'}`} data-testid={`text-ticket-name-${index}`}>
                    {ticketType.name}
                  </h3>
                  <div className={`text-4xl font-bold mb-2 ${isPopular ? 'text-white' : 'text-gray-900'}`}>
                    {formatPrice(ticketType.price, ticketType.currency)}
                  </div>
                  <p className={`${isPopular ? 'text-primary-100' : 'text-gray-600'}`} data-testid={`text-ticket-description-${index}`}>
                    {ticketType.description}
                  </p>
                </div>
                
                {/* Availability indicator */}
                {availability && (
                  <div className="mb-6">
                    {isSoldOut ? (
                      <Badge variant="destructive" className="w-full justify-center">
                        Sold Out
                      </Badge>
                    ) : isLowStock ? (
                      <Badge variant="secondary" className="w-full justify-center bg-orange-100 text-orange-800">
                        Only {availability.remaining} left
                      </Badge>
                    ) : (
                      <div className={`text-sm ${isPopular ? 'text-primary-100' : 'text-gray-600'} text-center`}>
                        {availability.remaining} of {availability.total} available
                      </div>
                    )}
                  </div>
                )}
                
                <ul className="space-y-4 mb-8">
                  {ticketType.perks && ticketType.perks.length > 0 ? (
                    ticketType.perks.map((perk, perkIndex) => (
                      <li key={perkIndex} className="flex items-center" data-testid={`text-ticket-perk-${index}-${perkIndex}`}>
                        <Check className={`mr-3 flex-shrink-0 ${isPopular ? 'text-accent' : 'text-accent'}`} size={16} />
                        <span className={isPopular ? 'text-white' : 'text-gray-700'}>
                          {perk}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="flex items-center">
                      <Check className={`mr-3 flex-shrink-0 ${isPopular ? 'text-accent' : 'text-accent'}`} size={16} />
                      <span className={isPopular ? 'text-white' : 'text-gray-700'}>
                        Event access included
                      </span>
                    </li>
                  )}
                </ul>
                
                <Button 
                  onClick={() => handleRegister(ticketType.id, ticketType.name)}
                  disabled={isSoldOut}
                  className={`w-full py-3 font-semibold transition-colors ${
                    isPopular 
                      ? 'bg-white text-primary hover:bg-gray-100' 
                      : isSoldOut
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary/90'
                  }`}
                  data-testid={`button-register-${index}`}
                >
                  {isSoldOut ? 'Sold Out' : 
                   ticketType.isPaid ? `Get ${ticketType.name}` : 'Register Free'}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
