# Migration Complete: Railway → Vercel + Cloudinary

## Summary

Successfully migrated the Family Finance application from Railway to Vercel free tier with Cloudinary for image storage.

## What Was Changed

### 1. Backend Architecture
- ✅ Converted Express.js backend routes to Next.js API routes
- ✅ All routes moved from `apps/server/src/routes/` to `apps/web/app/api/`
- ✅ Updated middleware and utilities for Next.js serverless functions

### 2. Server-Side Utilities
- ✅ Created `apps/web/lib/server/` directory with:
  - `prisma.ts` - Prisma client (singleton pattern for serverless)
  - `jwt.ts` - JWT token signing/verification
  - `email.ts` - SendGrid email utility
  - `cloudinary.ts` - Cloudinary image upload/delete (replaces AWS S3)
  - `middleware/auth.ts` - Authentication middleware (converted from Express)

### 3. API Routes Created
- ✅ `/api/auth/*` - Authentication (login, register, logout, me, profile, password reset)
- ✅ `/api/expenses/*` - Expense management with Cloudinary image uploads
- ✅ `/api/dashboard` - Dashboard data
- ✅ `/api/members/*` - Member management
- ✅ `/api/incomes/*` - Income management
- ✅ `/api/notifications/*` - Notification system
- ✅ `/api/recurring-bills/*` - Recurring bills

### 4. Dependencies Updated
- ✅ Added to `apps/web/package.json`:
  - `@prisma/client` - Database ORM
  - `cloudinary` - Image storage (replaces AWS S3)
  - `bcryptjs` - Password hashing
  - `@sendgrid/mail` - Email sending
  - `jsonwebtoken` - JWT tokens
  - `prisma` (dev) - Prisma CLI
  - Type definitions for new packages

### 5. Configuration
- ✅ Updated API base URL to use relative paths (`/api`)
- ✅ Copied Prisma schema to `apps/web/prisma/schema.prisma`
- ✅ Created `vercel.json` for Vercel deployment configuration
- ✅ Updated frontend components to handle both absolute (Cloudinary) and relative URLs

### 6. Storage Solution
- ✅ Replaced AWS S3 with Cloudinary for image storage
- ✅ Images now stored permanently in Cloudinary (25GB free tier)
- ✅ Files are uploaded directly to Cloudinary from API routes

## Next Steps for Deployment

### 1. Set Up Supabase Database (FREE)
1. Go to https://supabase.com and create account
2. Create new project (free tier)
3. Get connection string from Settings → Database → Connection string (URI)
4. The connection string format: `postgresql://postgres:[password]@[host]:5432/postgres`

### 2. Set Up Cloudinary (FREE)
1. Go to https://cloudinary.com and create account
2. Get credentials from dashboard:
   - Cloud name
   - API Key
   - API Secret

### 3. Environment Variables for Vercel
Add these in Vercel Dashboard → Project Settings → Environment Variables:

```
DATABASE_URL=postgresql://... (from Supabase)
JWT_SECRET=your-secure-random-string (generate with: openssl rand -hex 32)
CLIENT_APP_URL=https://your-app.vercel.app
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
SENDGRID_API_KEY=your-sendgrid-key (if using email)
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### 4. Deploy to Vercel
1. Connect your GitHub repository to Vercel
2. Set root directory: `/` (or let Vercel auto-detect)
3. Set build command: `cd apps/web && npm install && npm run build`
4. Set output directory: `apps/web/.next`
5. Deploy!

### 5. Run Database Migrations
After deployment, run Prisma migrations to set up the database:

```bash
cd apps/web
npx prisma migrate deploy
```

Or connect to your Supabase project and run migrations through Supabase dashboard.

## Cost Comparison

| Service | Before (Railway) | After (Vercel + Supabase + Cloudinary) |
|---------|-----------------|----------------------------------------|
| Frontend | ~$0.50/month | **FREE** |
| Backend | ~$0.50/month | **FREE** (included in Vercel) |
| Database | ~$5-8/month | **FREE** (Supabase 500MB) |
| Storage | Ephemeral | **FREE** (Cloudinary 25GB) |
| **Total** | **$5-9/month** | **$0/month** |

## Files Modified

### New Files Created
- `apps/web/lib/server/*` - Server utilities
- `apps/web/app/api/**/*.ts` - API routes
- `apps/web/prisma/schema.prisma` - Prisma schema (copied)
- `vercel.json` - Vercel configuration

### Files Modified
- `apps/web/package.json` - Added dependencies
- `apps/web/lib/api.ts` - Updated API base URL
- `apps/web/components/ExpensesTable.tsx` - Updated image URL handling
- `apps/web/components/ExpenseForm.tsx` - Updated image URL handling

### Files to Keep (for reference)
- `apps/server/` - Original Express backend (can be removed after migration verified)

## Testing Checklist

Before deploying, test locally:
- [ ] Run `npm install` in `apps/web`
- [ ] Run `npx prisma generate` in `apps/web`
- [ ] Set up local `.env.local` with database URL
- [ ] Run `npm run dev` and test all endpoints
- [ ] Test image uploads with Cloudinary
- [ ] Verify authentication (login/logout)
- [ ] Test all CRUD operations

## Notes

- All existing data in Railway database needs to be exported and imported to Supabase
- Existing images in local storage will need to be migrated to Cloudinary (if any)
- Cookie handling uses NextResponse for proper serverless compatibility
- Prisma client uses singleton pattern to work correctly in serverless environment

## Support

If you encounter issues:
1. Check Vercel build logs
2. Verify all environment variables are set
3. Ensure Prisma migrations are run
4. Check Cloudinary configuration
5. Verify database connection string is correct

