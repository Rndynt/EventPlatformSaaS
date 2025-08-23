'use client';

import React from 'react';
import Image from 'next/image';
import { Twitter, Linkedin, Github, Youtube } from 'lucide-react';
import type { Event } from '@/shared/schema';

interface SpeakersProps {
  speakers: Event['speakers'];
  type: 'webinar' | 'workshop' | 'concert';
}

const typeConfig = {
  webinar: {
    title: 'Meet Your Instructors',
    subtitle: 'Learn from industry experts with years of experience building scalable React applications',
  },
  workshop: {
    title: 'Your Workshop Leaders',
    subtitle: 'Experienced developers who will guide you through hands-on projects',
  },
  concert: {
    title: 'Featured Artists',
    subtitle: 'Incredible musicians and performers taking the stage',
  },
};

const getSocialIcon = (platform: string) => {
  switch (platform.toLowerCase()) {
    case 'twitter':
      return Twitter;
    case 'linkedin':
      return Linkedin;
    case 'github':
      return Github;
    case 'youtube':
      return Youtube;
    default:
      return null;
  }
};

export function Speakers({ speakers, type }: SpeakersProps) {
  const config = typeConfig[type];
  
  if (!speakers || speakers.length === 0) {
    return null;
  }

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4" data-testid="text-speakers-title">
            {config.title}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto" data-testid="text-speakers-subtitle">
            {config.subtitle}
          </p>
        </div>
        
        <div className={`grid gap-8 ${speakers.length === 1 ? 'max-w-md mx-auto' : speakers.length === 2 ? 'md:grid-cols-2 max-w-2xl mx-auto' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
          {speakers.map((speaker, index) => (
            <div 
              key={index}
              className="bg-gray-50 rounded-xl p-8 text-center group hover:bg-primary/5 transition-colors animate-fade-in"
              data-testid={`card-speaker-${index}`}
            >
              {speaker.imageUrl ? (
                <Image
                  src={speaker.imageUrl}
                  alt={`${speaker.name}, ${speaker.title}`}
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                  data-testid={`img-speaker-${index}`}
                />
              ) : (
                <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {speaker.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
              )}
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2" data-testid={`text-speaker-name-${index}`}>
                {speaker.name}
              </h3>
              
              <p className="text-primary font-medium mb-3" data-testid={`text-speaker-title-${index}`}>
                {speaker.title}
              </p>
              
              <p className="text-gray-600 text-sm leading-relaxed mb-4" data-testid={`text-speaker-bio-${index}`}>
                {speaker.bio}
              </p>
              
              {speaker.socialLinks && Object.keys(speaker.socialLinks).length > 0 && (
                <div className="flex justify-center space-x-3">
                  {Object.entries(speaker.socialLinks).map(([platform, url]) => {
                    const IconComponent = getSocialIcon(platform);
                    
                    if (!IconComponent) return null;
                    
                    return (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-primary transition-colors"
                        data-testid={`link-speaker-${index}-${platform}`}
                        aria-label={`${speaker.name} on ${platform}`}
                      >
                        <IconComponent size={20} />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
