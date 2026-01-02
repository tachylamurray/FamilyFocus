# Setup Guide - Step by Step

Follow this guide to set up your deployment. Answer each question, and we'll proceed step by step.

## Step 1: Supabase Database Setup

### Question 1.1: Do you have a Supabase account?
- [ ] Yes, I already have one
- [ ] No, I need to create one

**If you need to create one:**
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email
4. Once logged in, continue below

### Question 1.2: Do you have a Supabase project created?
- [ ] Yes, I have a project
- [ ] No, I need to create one

**If you need to create a project:**
1. In Supabase dashboard, click "New Project"
2. Choose an organization (or create one)
3. Project name: `family-finance` (or your choice)
4. Database password: **Save this password!** You'll need it for the connection string
5. Region: Choose closest to you (or default)
6. Pricing plan: **Free** (select this)
7. Click "Create new project"
8. Wait 1-2 minutes for project to be ready

### Question 1.3: Get your database connection string
Once your project is ready:

1. In your Supabase project dashboard, go to **Settings** (gear icon in left sidebar)
2. Click **Database** in the settings menu
3. Scroll down to **Connection string**
4. Find **URI** tab (should be selected by default)
5. Copy the connection string - it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with the password you saved when creating the project

**Paste your connection string here (we'll use it for Vercel):**
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
```

---

## Step 2: Cloudinary Setup

### Question 2.1: Do you have a Cloudinary account?
- [ ] Yes, I already have one
- [ ] No, I need to create one

**If you need to create one:**
1. Go to https://cloudinary.com
2. Click "Sign Up For Free"
3. Sign up with email (or use Google/GitHub)
4. Verify your email if required
5. Once logged in, continue below

### Question 2.2: Get your Cloudinary credentials
Once logged into Cloudinary dashboard:

1. On the dashboard, you'll see your **Cloud name** (it's displayed at the top)
   - Example: `dxxxxx`
   - **Copy this value**

2. To get API credentials:
   - Click the gear icon (⚙️) in the top right
   - Or go to **Settings** → **Security** (left sidebar)
   - Scroll down to **API Keys** section
   - You'll see:
     - **API Key**: A long number (like `123456789012345`)
     - **API Secret**: Click "Reveal" to show it (starts with something like `abc123...`)

**Please provide these three values:**
1. Cloud Name: `_________________`
2. API Key: `_________________`
3. API Secret: `_________________`

---

## Step 3: Generate JWT Secret

### Question 3.1: Generate a secure JWT secret
We need a secure random string for JWT token signing.

**Run this command in your terminal:**
```bash
openssl rand -hex 32
```

**Copy the output** (it will be a long string like `a1b2c3d4e5f6...`)
- This will be your `JWT_SECRET`
- Save it somewhere safe (we'll add it to Vercel)

---

## Step 4: Vercel Deployment

### Question 4.1: Do you have a Vercel account?
- [ ] Yes, I already have one
- [ ] No, I need to create one

**If you need to create one:**
1. Go to https://vercel.com
2. Click "Sign Up"
3. Sign up with GitHub (recommended - easiest for deployment)
4. Authorize Vercel to access your GitHub repositories
5. Once logged in, continue below

### Question 4.2: Deploy your project
1. In Vercel dashboard, click **"Add New..."** → **Project**
2. Find your repository: `tachylamurray/FamilyFocus` (or your repo name)
3. Click **Import**
4. Configure project:
   - **Framework Preset**: Next.js (should auto-detect)
   - **Root Directory**: Leave as `/` (default)
   - **Build Command**: `cd apps/web && npm install && npm run build`
   - **Output Directory**: `apps/web/.next`
   - **Install Command**: `npm install`
5. **Don't click Deploy yet!** First, we need to add environment variables

### Question 4.3: Add Environment Variables
Before deploying, add these environment variables:

1. In the Vercel project setup page, find **Environment Variables** section
2. Add each variable below (click "Add" for each one):

**Required Variables:**

1. **DATABASE_URL**
   - Value: Your Supabase connection string from Step 1
   - Example: `postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres`

2. **JWT_SECRET**
   - Value: The random string you generated in Step 3
   - Example: `a1b2c3d4e5f6789...` (64 characters)

3. **CLOUDINARY_CLOUD_NAME**
   - Value: Your Cloudinary cloud name from Step 2
   - Example: `dxxxxx`

4. **CLOUDINARY_API_KEY**
   - Value: Your Cloudinary API key from Step 2
   - Example: `123456789012345`

5. **CLOUDINARY_API_SECRET**
   - Value: Your Cloudinary API secret from Step 2
   - Example: `abc123def456...`

6. **CLIENT_APP_URL** (optional - will be auto-set after first deploy)
   - You can skip this for now, or set it to: `https://your-app.vercel.app`
   - We'll update this after deployment with your actual Vercel URL

7. **SENDGRID_API_KEY** (optional - only if you want email)
   - If you're using SendGrid for password reset emails, add this
   - Otherwise, skip it (emails will log to console)

8. **SENDGRID_FROM_EMAIL** (optional - only if using SendGrid)
   - Your verified sender email from SendGrid
   - Example: `noreply@yourdomain.com`

3. After adding all variables, click **"Deploy"**
4. Wait for deployment to complete (2-5 minutes)

---

## Step 5: Run Database Migrations

### Question 5.1: After deployment completes
Once Vercel deployment is successful:

1. Copy your deployment URL (e.g., `https://family-finance.vercel.app`)
2. Update `CLIENT_APP_URL` in Vercel environment variables:
   - Go to your project in Vercel
   - Settings → Environment Variables
   - Edit `CLIENT_APP_URL` to: `https://your-actual-url.vercel.app`
   - Redeploy (or it will update on next deploy)

### Question 5.2: Run Prisma migrations
You need to run database migrations to create the tables.

**Option A: Using Supabase SQL Editor (Easiest)**
1. Go to your Supabase project dashboard
2. Click **SQL Editor** in left sidebar
3. Click **New query**
4. You'll need to run the migration SQL files from `apps/server/prisma/migrations/`
5. Or use Prisma CLI (Option B)

**Option B: Using Prisma CLI (Recommended)**
1. In your local project, run:
   ```bash
   cd apps/web
   npx prisma migrate deploy
   ```
2. This will run all migrations against your Supabase database

**Option C: Using Prisma Studio (For first-time setup)**
```bash
cd apps/web
npx prisma studio
```
- This opens a visual database browser
- You can also push the schema directly: `npx prisma db push`

---

## Step 6: Test Your Deployment

### Final Steps:
1. Visit your Vercel deployment URL
2. Try to register a new account (first user becomes admin)
3. Test uploading an expense with an image
4. Verify images are stored in Cloudinary
5. Check that everything works!

---

## Summary Checklist

- [ ] Supabase account created
- [ ] Supabase project created
- [ ] Database connection string copied
- [ ] Cloudinary account created
- [ ] Cloudinary credentials (cloud name, API key, API secret) copied
- [ ] JWT secret generated
- [ ] Vercel account created
- [ ] Project imported to Vercel
- [ ] All environment variables added to Vercel
- [ ] First deployment completed
- [ ] CLIENT_APP_URL updated in Vercel
- [ ] Database migrations run
- [ ] Application tested

---

## Need Help?

If you get stuck at any step, let me know which step and what issue you're encountering!

