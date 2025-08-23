# Event Landing Pages Platform

A production-ready multi-tenant event management platform with customizable landing pages for Webinars, Workshops, and Concerts. Built with Next.js, TypeScript, Drizzle ORM, and Neon PostgreSQL.

## Features

- **Multi-tenant Architecture**: Each organization gets their own branded event pages
- **Three Event Templates**: Webinar, Workshop, and Concert with specialized layouts
- **Payment Processing**: Stripe integration with dev fallbacks
- **QR Code Ticketing**: Automatic ticket generation with QR codes
- **Email Notifications**: SendGrid integration for confirmations and reminders
- **Admin Dashboard**: Complete event management interface
- **Check-in PWA**: Mobile app for event staff with offline capabilities
- **Custom Theming**: Per-tenant color schemes and branding
- **Responsive Design**: Mobile-first approach with accessibility features

## Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (we recommend [Neon](https://neon.tech))
- Stripe account (for payments)
- SendGrid account (for emails)
- Twilio account (for SMS, optional)

### Installation

1. **Clone and install dependencies**:
```bash
git clone <repository-url>
cd event-landing-platform
npm install
