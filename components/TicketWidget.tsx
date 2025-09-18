'use client';

import React, { useState } from 'react';
import { Button } from '@/lib/components/ui/button';
import { Badge } from '@/lib/components/ui/badge';
import { Card, CardContent } from '@/lib/components/ui/card';
import { Minus, Plus, Users, Clock } from 'lucide-react';
import type { TicketType } from '@/shared/schema';

interface TicketWidgetProps {
  ticketTypes: TicketType[];
  onRegister: (ticketTypeId: string, quantity: number) => void;
}

export function TicketWidget({ ticketTypes, onRegister }: TicketWidgetProps) {
  const [selectedTicketType, setSelectedTicketType] = useState<string>(ticketTypes[0]?.id || '');
  const [quantity, setQuantity] = useState(1);

  const selectedTicket = ticketTypes.find(t => t.id === selectedTicketType);

  if (!ticketTypes || ticketTypes.length === 0) {
    return null;
  }

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

  const getTotalPrice = () => {
    if (!selectedTicket) return 0;
    return parseFloat(selectedTicket.price) * quantity;
  };

  const getAvailability = (ticketType: TicketType) => {
    if (!ticketType.quantity) return null;
    const sold = ticketType.quantitySold || 0;
    const remaining = ticketType.quantity - sold;
    return { sold, remaining, total: ticketType.quantity };
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, Math.min(10, quantity + delta));
    setQuantity(newQuantity);
  };

  const handleRegister = () => {
    if (selectedTicket) {
      onRegister(selectedTicket.id, quantity);
    }
  };

  return (
    <Card className="sticky top-8">
      <CardContent className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4" data-testid="text-ticket-widget-title">
            Select Tickets
          </h3>
          
          <div className="space-y-3">
            {ticketTypes.map((ticketType) => {
              const availability = getAvailability(ticketType);
              const isSoldOut = availability && availability.remaining <= 0;
              const isSelected = selectedTicketType === ticketType.id;
              
              return (
                <div
                  key={ticketType.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : isSoldOut 
                      ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => !isSoldOut && setSelectedTicketType(ticketType.id)}
                  data-testid={`option-ticket-${ticketType.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">
                          {ticketType.name}
                        </h4>
                        {isSoldOut && (
                          <Badge variant="destructive" className="text-xs">
                            Sold Out
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {ticketType.description}
                      </p>
                      {availability && !isSoldOut && (
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <Users size={12} className="mr-1" />
                          {availability.remaining} remaining
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {formatPrice(ticketType.price, ticketType.currency)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selectedTicket && (
          <>
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mb-3 block">
                Quantity
              </label>
              <div className="flex items-center justify-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  data-testid="button-decrease-quantity"
                >
                  <Minus size={16} />
                </Button>
                <span className="text-xl font-semibold w-8 text-center" data-testid="text-quantity">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= 10}
                  data-testid="button-increase-quantity"
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>

            <div className="border-t pt-4 mb-6">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total:</span>
                <span data-testid="text-total-price">
                  {selectedTicket.isPaid 
                    ? formatPrice(getTotalPrice().toString(), selectedTicket.currency)
                    : 'Free'
                  }
                </span>
              </div>
            </div>

            <Button 
              onClick={handleRegister}
              className="w-full bg-primary text-white hover:bg-primary/90 py-3 font-semibold"
              data-testid="button-register-widget"
            >
              {selectedTicket.isPaid ? 'Register & Pay' : 'Register Now'}
            </Button>

            {selectedTicket.validUntil && (
              <div className="flex items-center justify-center text-xs text-gray-500 mt-3">
                <Clock size={12} className="mr-1" />
                Valid until {new Date(selectedTicket.validUntil).toLocaleDateString()}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
