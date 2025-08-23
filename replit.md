# Overview

This is a production-ready multi-tenant event management platform that enables organizations to create customizable landing pages for three types of events: Webinars, Workshops, and Concerts. The platform supports white-label branding, payment processing through Stripe, QR code ticketing, email notifications, and includes a comprehensive admin dashboard for event management. Built with modern web technologies, it provides a scalable solution for event organizers who need branded, professional event pages with full registration and check-in capabilities.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The platform uses Next.js 13+ with the App Router pattern, providing server-side rendering and optimal performance. The UI is built with React components using TypeScript for type safety and Tailwind CSS for styling. The component library is based on Radix UI primitives with shadcn/ui components for consistency. The frontend follows a multi-tenant routing structure where each tenant gets their own subdirectory (e.g., `/[tenant]/webinar/[eventSlug]`), enabling custom domains and branded experiences.

## Backend Architecture  
The backend leverages Next.js API routes as serverless functions, providing REST endpoints for registration, payments, webhooks, and analytics. Authentication is handled through JWT tokens with bcrypt for password hashing. The server-side code uses a shared schema approach where database models and types are centralized in the `/shared` directory, ensuring consistency between frontend and backend.

## Database Design
The platform uses Drizzle ORM with PostgreSQL (specifically Neon serverless) for data persistence. The schema supports multi-tenancy through a tenant-based data model where each organization (tenant) can have multiple events, with separate tables for events, ticket types, attendees, tickets, and transactions. The database includes relationships for proper data integrity and supports JSONB fields for flexible configuration like tenant themes and event metadata.

## Multi-Tenant Strategy
Tenants are resolved through URL slug matching (e.g., `/demo/webinar/event-name`) or custom domain mapping. Each tenant has customizable themes including colors, fonts, logos, and branding options. The platform supports white-label functionality where platform branding can be hidden for premium tenants.

## Payment Processing
Stripe integration handles all payment processing with fallback to development stubs when API keys are not configured. The system creates payment intents for paid tickets and processes webhooks for payment confirmations. Transactions are tracked separately from tickets to maintain audit trails.

## Email and SMS Systems
SendGrid integration provides email notifications for ticket confirmations, reminders, and event updates. Twilio handles SMS notifications with fallback to console logging in development. Both systems include template generation for consistent messaging across different event types.

## Ticketing and QR Codes
Each ticket generates a unique token and corresponding QR code for check-in purposes. The QR code system supports offline scanning through a Progressive Web App (PWA) for event staff, with sync capabilities when connectivity is restored.

# External Dependencies

## Database
- **Neon PostgreSQL**: Serverless PostgreSQL database for production deployment
- **Drizzle ORM**: Type-safe database ORM for schema management and queries  
- **Drizzle Kit**: Database migration tool for schema versioning

## Payment Processing
- **Stripe**: Primary payment processor for handling transactions
- **@stripe/stripe-js**: Client-side Stripe integration
- **@stripe/react-stripe-js**: React components for Stripe checkout flows

## Communication Services
- **SendGrid**: Email delivery service for transactional emails (@sendgrid/mail)
- **Twilio**: SMS service for text message notifications

## Authentication and Security
- **bcryptjs**: Password hashing for secure authentication
- **jsonwebtoken**: JWT token generation and verification for session management
- **js-cookie**: Client-side cookie management

## UI and Styling
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Radix UI**: Headless UI primitives for accessible components
- **Lucide React**: Icon library for consistent iconography
- **React Hook Form**: Form handling with validation
- **Zod**: Schema validation for type-safe data processing

## Development and Testing
- **Jest**: Testing framework for unit and integration tests
- **@testing-library/react**: React component testing utilities
- **TypeScript**: Static type checking for code reliability
- **ESLint**: Code linting for consistent code quality

## QR Code and Media
- **qrcode**: QR code generation for ticket validation
- **Next.js Image**: Optimized image handling and delivery

## State Management and Data Fetching
- **@tanstack/react-query**: Server state management and caching
- **Zustand**: Client-side state management (configured but not heavily used)

The platform is designed to be deployment-ready for Vercel, Netlify, or Cloudflare Pages while being developed in the Replit environment with hot reloading and development tooling.