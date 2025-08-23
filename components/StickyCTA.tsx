'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/client/src/components/ui/button';
import { useIsMobile } from '@/client/src/hooks/use-mobile';
import type { Event } from '@/shared/schema';

interface StickyCTAProps {
  event: Event;
}

export function StickyCTA({ event }: StickyCTAProps) {
  const [isVisible, setIsVisible] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky CTA when user scrolls past hero section
      const heroHeight = window.innerHeight;
      const scrollPosition = window.scrollY;
      
      setIsVisible(scrollPosition > heroHeight * 0.5);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleRegister = () => {
    // Open checkout modal
    const modal = document.getElementById('checkoutModal');
    if (modal) {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  };

  const formatEventDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  // Only show on mobile
  if (!isMobile || !isVisible) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden animate-fade-in"
      data-testid="sticky-cta"
    >
      <div className="bg-white border-t border-gray-200 px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate" data-testid="text-sticky-event-title">
              {event.title}
            </div>
            <div className="text-xs text-gray-500" data-testid="text-sticky-event-date">
              Starts {formatEventDate(event.startDate)}
            </div>
          </div>
          <Button 
            onClick={handleRegister}
            className="bg-primary text-white px-6 py-3 font-semibold hover:bg-primary/90 transition-colors ml-4"
            data-testid="button-sticky-register"
          >
            Register Now
          </Button>
        </div>
      </div>
    </div>
  );
}
