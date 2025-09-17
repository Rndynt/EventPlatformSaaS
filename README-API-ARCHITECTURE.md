# API Architecture - Express Only

This project now uses **Express + Vite** for both API and frontend serving.

## Active API Endpoints (Express)
All API routes are served by Express at `server/routes.ts`:

- `POST /api/v1/auth` - Login
- `PUT /api/v1/auth` - Register admin (restricted)
- `GET /api/v1/auth` - Verify user
- `DELETE /api/v1/auth` - Logout
- `POST /api/v1/register` - Event registration
- `POST /api/v1/payment-intent` - Create payment
- `POST /api/v1/webhook` - Stripe webhook
- `GET /api/v1/ticket/:token` - Ticket validation
- `POST /api/v1/checkin` - QR check-in
- `POST /api/v1/analytics` - Analytics (requires auth)
- `POST /api/v1/send-reminder` - Send reminders (requires auth)

## Disabled Endpoints
- Next.js API routes (moved to `.unused-endpoints/nextjs-api/`)
- Netlify Functions (moved to `.unused-endpoints/netlify-functions/`)

## Development
Server runs on port 5000 serving both API and frontend via Vite.