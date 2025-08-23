'use client';

import React from 'react';
import Link from 'next/link';
import { Rocket, Twitter, Linkedin, Github, Youtube } from 'lucide-react';
import type { Tenant } from '@/shared/schema';

interface FooterProps {
  tenant: Tenant;
}

export function Footer({ tenant }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Tenant Brand */}
          <div>
            <div className="flex items-center space-x-3 mb-6">
              {tenant.theme?.logoUrl ? (
                <img 
                  src={tenant.theme.logoUrl} 
                  alt={`${tenant.name} logo`}
                  className="w-8 h-8 rounded-lg"
                />
              ) : (
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Rocket className="text-white" size={20} />
                </div>
              )}
              <span className="text-xl font-bold" data-testid="text-footer-tenant-name">
                {tenant.name}
              </span>
            </div>
            <p className="text-gray-400 leading-relaxed mb-6">
              Empowering developers with world-class training and resources to build better applications.
            </p>
            
            <div className="flex space-x-4">
              <a 
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Twitter"
                data-testid="link-footer-twitter"
              >
                <Twitter size={20} />
              </a>
              <a 
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="LinkedIn"
                data-testid="link-footer-linkedin"
              >
                <Linkedin size={20} />
              </a>
              <a 
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="GitHub"
                data-testid="link-footer-github"
              >
                <Github size={20} />
              </a>
              <a 
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="YouTube"
                data-testid="link-footer-youtube"
              >
                <Youtube size={20} />
              </a>
            </div>
          </div>
          
          {/* Events */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Events</h4>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  Upcoming Webinars
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  Workshops
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  Conferences
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  Past Events
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Support</h4>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  Technical Support
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  Community
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Company */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {currentYear} <span data-testid="text-footer-copyright">{tenant.name}</span>. All rights reserved.
            </p>
            
            {/* Platform branding - hide if tenant has disabled it */}
            {!tenant.theme?.hidePlatformBranding && (
              <p className="text-gray-500 text-xs mt-4 md:mt-0" data-testid="text-footer-platform">
                Powered by EventFlow Platform
              </p>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
