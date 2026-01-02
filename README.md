# Family Finance Platform

A full-stack web application to help families collaborate on shared finances. The project uses Next.js (React + TypeScript) with Tailwind CSS for the client, an Express + TypeScript API server, and PostgreSQL for persistence (with Prisma as the ORM).

## Project Structure

```
family-finance-platform/
├── apps/
│   ├── web/          # Next.js 13 app router frontend
│   └── server/       # Express API server with Prisma + PostgreSQL
├── package.json      # Workspace scripts
└── README.md
```

## Prerequisites

- Node.js 18+
- npm 9+ (or compatible pnpm/yarn)
- PostgreSQL 14+

## Environment Variables

Create the following files (values shown are examples):

### `apps/server/.env`

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/family_finance"
PORT=4000
JWT_SECRET="replace-with-secure-random-string"
CLIENT_APP_URL="http://localhost:3000"

# Email Configuration (for password reset) - SendGrid
SENDGRID_API_KEY="SG.your-sendgrid-api-key-here"
SENDGRID_FROM_EMAIL="noreply@yourdomain.com"

# File Storage Configuration - AWS S3 (for permanent file storage)
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-aws-access-key-id"
AWS_SECRET_ACCESS_KEY="your-aws-secret-access-key"
AWS_S3_BUCKET_NAME="your-bucket-name"
```

> **Note:** 
> - Create a free SendGrid account at https://sendgrid.com (100 emails/day free tier)
> - Generate an API key in SendGrid dashboard (Settings → API Keys)
> - Verify your sender email address in SendGrid (Settings → Sender Authentication)
> - If email is not configured, reset codes will be logged to the console for development
> - **File Storage**: See `AWS_S3_SETUP.md` for setting up permanent file storage with AWS S3 (recommended for production)

### `apps/web/.env.local`

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

> **Tip:** Generate a strong `JWT_SECRET` with `openssl rand -hex 32`.

## Installation

From the repository root:

```bash
npm install
npm run install:all
```

Run initial Prisma setup:

```bash
cd apps/server
npx prisma migrate dev
npx prisma db seed
cd ../../
```

## Development

Start both apps concurrently:

```bash
npm run dev
```

- Frontend: http://localhost:3000
- API Server: http://localhost:4000

### Individual Dev Servers

```bash
npm run dev:web     # Next.js only
npm run dev:server  # Express API only
```

## Database Models

Prisma models include:

- `User` (name, email, password hash, relationship, role)
- `Expense` (category, amount, due date, optional notes, createdBy)
- `Income` (source, amount, received date)
- `Notification` + `NotificationRecipient`

## API Overview

| Endpoint | Description |
| --- | --- |
| `POST /api/auth/register` | Create member (defaults to `MEMBER` role). |
| `POST /api/auth/login` | Issue HTTP-only JWT cookie. |
| `GET /api/auth/me` | Current user profile. |
| `POST /api/auth/logout` | Clear auth cookie. |
| `GET /api/dashboard` | Dashboard aggregate totals and upcoming bills. |
| `GET/POST/PUT/DELETE /api/expenses` | Manage shared expenses (role-aware). |
| `GET/POST /api/notifications` | View and send family notifications. |
| `GET /api/members` | List family members and roles. |
| `GET/POST/DELETE /api/incomes` | (Optional) Manage monthly income records. |

Response payloads mirror the TypeScript types in `apps/web/lib/types.ts`.

## Frontend Highlights

- Tailwind CSS custom theme (dark, finance-inspired UI).
- React Query for data fetching + caching.
- Auth context that consumes the Express auth cookie and handles redirects.
- Dashboard with monthly overview, spending by category, upcoming bills, and notifications.
- Dedicated pages for managing expenses, sending alerts, and viewing members.

## Seed Accounts

After seeding, you can sign in with:

| Email | Password | Role |
| --- | --- | --- |
| `alex@example.com` | `password123` | `ADMIN` |
| `jane@example.com` | `password123` | `MEMBER` |
| `michael@example.com` | `password123` | `VIEW_ONLY` |

## Testing Ideas & Next Steps

- Add automated tests (unit + integration) for API routes and components.
- Integrate SendGrid/Twilio for real email/SMS alerts.
- Extend role-based access (e.g., allow admins to promote/demote members).
- Add audit trails or activity feed.

## Running Lint & Build

```bash
npm run lint
npm run build --prefix apps/web
npm run build --prefix apps/server
```

## Deployment Notes

- Deploy the frontend (e.g., Vercel) and API (e.g., Render/Fly.io/Heroku) separately.
- Make sure `CLIENT_APP_URL` matches the deployed frontend for CORS.
- Run Prisma migrations on deploy (`npm run db:deploy --prefix apps/server`).

