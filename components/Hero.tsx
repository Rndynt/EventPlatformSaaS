'use client';

import React from 'react';
import Image from 'next/image';
import { Calendar, Clock, Users, Globe, Video } from 'lucide-react';
import { Button } from '@/lib/components/ui/button';
import { Badge } from '@/lib/components/ui/badge';
import { Countdown } from './Countdown';
import type { Event, Tenant } from '@/shared/schema';

interface HeroProps {
  event: Event;
  tenant: Tenant;
  type: 'webinar' | 'workshop' | 'concert';
}

const typeConfig = {
  webinar: {
    icon: Video,
    label: 'Live Webinar',
    bgGradient: 'from-primary/5 via-white to-secondary/5'
  },
  workshop: {
    icon: Clock,
    label: 'Hands-on Workshop', 
    bgGradient: 'from-orange-50 to-red-50'
  },
  concert: {
    icon: Users,
    label: 'Live Concert',
    bgGradient: 'from-purple-900 via-blue-900 to-indigo-900'
  }
};

export function Hero({ event, tenant, type }: HeroProps) {
  const config = typeConfig[type];
  const IconComponent = config.icon;
  
  const handleRegister = () => {
    // Dispatch custom event to open checkout modal
    const modal = document.getElementById('checkoutModal');
    if (modal) {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  };

  const formatEventDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(new Date(date));
  };

  const formatDuration = (start: Date, end: Date) => {
    const durationMs = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} minutes`;
  };

  return (
    <section className={`relative bg-gradient-to-br ${config.bgGradient} py-16 lg:py-24 ${type === 'concert' ? 'text-white' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <Badge 
              variant="secondary" 
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-6"
              data-testid="badge-event-type"
            >
              <IconComponent className="mr-2" size={16} />
              {config.label}
            </Badge>
            
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-6">
              <span data-testid="text-event-title">{event.title}</span>
              {event.subtitle && (
                <span className="block text-primary">{event.subtitle}</span>
              )}
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed" data-testid="text-event-description">
              {event.description}
            </p>
            
            <div className="grid sm:grid-cols-2 gap-6 mb-10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Calendar className="text-accent" size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Date & Time</p>
                  <p className="text-gray-600" data-testid="text-event-datetime">
                    {formatEventDate(event.startDate)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Clock className="text-secondary" size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Duration</p>
                  <p className="text-gray-600" data-testid="text-event-duration">
                    {formatDuration(event.startDate, event.endDate)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="text-primary" size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Capacity</p>
                  <p className="text-gray-600" data-testid="text-event-capacity">
                    {event.capacity ? `${event.capacity} seats` : 'Unlimited'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Globe className="text-accent" size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Format</p>
                  <p className="text-gray-600">
                    {event.location || 'Online Interactive'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={handleRegister}
                className="bg-primary text-white px-8 py-4 text-lg font-semibold hover:bg-primary/90 transform hover:scale-105 transition-all duration-200 shadow-lg"
                data-testid="button-register-now"
              >
                Register Now - Free
              </Button>
              <Button 
                variant="outline"
                className="border-2 border-gray-300 text-gray-700 px-8 py-4 font-semibold hover:border-primary hover:text-primary transition-colors"
                data-testid="button-share-event"
              >
                Share Event
              </Button>
            </div>
          </div>
          
          <div className="relative animate-fade-in">
            {event.imageUrl ? (
              <Image
                src={event.imageUrl}
                alt={`${event.title} preview`}
                width={800}
                height={600}
                className="rounded-2xl shadow-2xl w-full object-cover"
                priority
              />
            ) : (
              <div className="w-full h-96 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl shadow-2xl flex items-center justify-center">
                <IconComponent className="text-primary" size={64} />
              </div>
            )}
            
            <div className="absolute -bottom-6 left-6 right-6 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <Countdown targetDate={event.startDate} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
