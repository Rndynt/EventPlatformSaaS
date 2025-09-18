'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, Rocket } from 'lucide-react';
import { Button } from '@/lib/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/lib/components/ui/sheet';
import type { Tenant } from '@/shared/schema';

interface HeaderProps {
  tenant: Tenant;
}

export function Header({ tenant }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {tenant.theme?.logoUrl ? (
                <img 
                  src={tenant.theme.logoUrl} 
                  alt={`${tenant.name} logo`}
                  className="w-10 h-10 rounded-lg"
                />
              ) : (
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Rocket className="text-white text-lg" size={20} />
                </div>
              )}
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900">{tenant.name}</span>
              <span className="text-sm text-gray-500 ml-2">Events</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link href="#events" className="text-gray-600 hover:text-primary transition-colors">
              Events
            </Link>
            <Link href="#about" className="text-gray-600 hover:text-primary transition-colors">
              About
            </Link>
            <Link href="#contact" className="text-gray-600 hover:text-primary transition-colors">
              Contact
            </Link>
            <Button 
              className="bg-primary text-white hover:bg-primary/90"
              data-testid="button-host-event"
            >
              Host Event
            </Button>
          </div>
          
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col space-y-4 mt-8">
                  <Link href="#events" className="text-gray-600 hover:text-primary transition-colors">
                    Events
                  </Link>
                  <Link href="#about" className="text-gray-600 hover:text-primary transition-colors">
                    About
                  </Link>
                  <Link href="#contact" className="text-gray-600 hover:text-primary transition-colors">
                    Contact
                  </Link>
                  <Button className="bg-primary text-white hover:bg-primary/90 w-full">
                    Host Event
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
}
