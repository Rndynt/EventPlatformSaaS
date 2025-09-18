'use client';

import React from 'react';
import { Clock, User } from 'lucide-react';
import { Badge } from '@/lib/components/ui/badge';
import type { Event } from '@/shared/schema';

interface AgendaProps {
  agenda: Event['agenda'];
  type: 'webinar' | 'workshop' | 'concert';
}

const typeConfig = {
  webinar: {
    title: 'What You\'ll Learn',
    subtitle: 'A comprehensive agenda covering the most important React patterns and techniques',
    timeLabel: 'Time',
  },
  workshop: {
    title: 'Workshop Schedule',
    subtitle: 'Hands-on sessions designed to build your skills progressively',
    timeLabel: 'Day',
  },
  concert: {
    title: 'Event Schedule',
    subtitle: 'Lineup and performance times for each day',
    timeLabel: 'Time',
  },
};

export function Agenda({ agenda, type }: AgendaProps) {
  const config = typeConfig[type];
  
  if (!agenda || agenda.length === 0) {
    return null;
  }

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours}h`;
      }
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes} mins`;
  };

  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4" data-testid="text-agenda-title">
            {config.title}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto" data-testid="text-agenda-subtitle">
            {config.subtitle}
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            {agenda.map((item, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                data-testid={`card-agenda-${index}`}
              >
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        index % 3 === 0 ? 'bg-primary/10' :
                        index % 3 === 1 ? 'bg-secondary/10' : 'bg-accent/10'
                      }`}>
                        <span className={`font-bold ${
                          index % 3 === 0 ? 'text-primary' :
                          index % 3 === 1 ? 'text-secondary' : 'text-accent'
                        }`}>
                          {type === 'webinar' ? String(index + 1).padStart(2, '0') : 
                           type === 'workshop' ? String(index + 1) :
                           <Clock size={20} />}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-semibold text-gray-900" data-testid={`text-agenda-title-${index}`}>
                          {item.title}
                        </h3>
                        <div className="flex items-center space-x-3 text-sm text-gray-500">
                          <span data-testid={`text-agenda-time-${index}`}>
                            {item.time}
                          </span>
                          <span data-testid={`text-agenda-duration-${index}`}>
                            {formatDuration(item.duration)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-4" data-testid={`text-agenda-description-${index}`}>
                        {item.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {/* Extract keywords from description for badges */}
                          {item.description.split(',').slice(0, 3).map((keyword, keywordIndex) => (
                            <Badge 
                              key={keywordIndex}
                              variant="secondary"
                              className={`${
                                keywordIndex % 3 === 0 ? 'bg-primary/10 text-primary' :
                                keywordIndex % 3 === 1 ? 'bg-secondary/10 text-secondary' : 'bg-accent/10 text-accent'
                              }`}
                            >
                              {keyword.trim()}
                            </Badge>
                          ))}
                        </div>
                        
                        {item.speaker && (
                          <div className="flex items-center text-sm text-gray-600">
                            <User size={16} className="mr-1" />
                            <span data-testid={`text-agenda-speaker-${index}`}>
                              {item.speaker}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
