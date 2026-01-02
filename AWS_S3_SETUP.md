# AWS S3 Setup Guide

This guide will help you set up AWS S3 for permanent file storage in your Family Finance application.

## Why AWS S3?

- **Permanent Storage**: Files are stored reliably and won't be lost on deployments
- **Audit-Ready**: Industry standard for compliance and audit purposes
- **Free Tier**: 5GB storage, 20,000 GET requests/month (more than enough for a family app)
- **Cost**: After free tier, only $0.023/GB/month (~$0.12/month for 5GB)
- **Durability**: 99.999999999% (11 nines) - files almost never lost

## Step 1: Create AWS Account

1. Go to https://aws.amazon.com/
2. Click "Create an AWS Account"
3. Follow the signup process (requires credit card, but free tier won't charge you)

## Step 2: Create S3 Bucket

1. Log in to AWS Console: https://console.aws.amazon.com/
2. Navigate to **S3** service
3. Click **"Create bucket"**
4. Configure bucket:
   - **Bucket name**: `family-finance-expenses-[your-unique-id]` (must be globally unique)
   - **AWS Region**: Choose closest to your Railway deployment (e.g., `us-east-1`)
   - **Object Ownership**: ACLs enabled (or "Bucket owner preferred" if you want)
   - **Block Public Access**: **UNCHECK** "Block all public access" (we need public read for images)
   - **Bucket Versioning**: Enable (recommended for audit purposes - tracks file changes)
   - **Default encryption**: Enable (recommended)
   - Click **"Create bucket"**

## Step 3: Configure Bucket Permissions

1. Click on your bucket name
2. Go to **"Permissions"** tab
3. Under **"Bucket policy"**, click **"Edit"**
4. Add this policy (replace `YOUR_BUCKET_NAME` with your actual bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
    }
  ]
}
```

5. Click **"Save changes"**

## Step 4: Create IAM User for Application Access

1. Navigate to **IAM** service in AWS Console
2. Click **"Users"** in the left sidebar
3. Click **"Create user"**
4. **User name**: `family-finance-app`
5. Click **"Next"**
6. Under **"Set permissions"**, select **"Attach policies directly"**
7. Click **"Create policy"** (opens in new tab)
   - Click **"JSON"** tab
   - Paste this policy (replace `YOUR_BUCKET_NAME`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
    },
    {
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME"
    }
  ]
}
```

8. Click **"Next"**, name it `family-finance-s3-policy`, click **"Create policy"**
9. Go back to user creation tab, refresh policies, search for `family-finance-s3-policy`
10. Select the policy, click **"Next"**, then **"Create user"**

## Step 5: Create Access Keys

1. Click on the user you just created (`family-finance-app`)
2. Go to **"Security credentials"** tab
3. Scroll to **"Access keys"** section
4. Click **"Create access key"**
5. Select **"Application running outside AWS"**
6. Click **"Next"**, then **"Create access key"**
7. **IMPORTANT**: Copy both:
   - **Access key ID**
   - **Secret access key** (only shown once - save it securely!)

## Step 6: Add Environment Variables to Railway

1. Go to your Railway project
2. Select your **server** service
3. Go to **"Variables"** tab
4. Add these environment variables:

```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id-here
AWS_SECRET_ACCESS_KEY=your-secret-access-key-here
AWS_S3_BUCKET_NAME=family-finance-expenses-your-unique-id
```

5. Click **"Deploy"** or Railway will auto-deploy

## Step 7: Install Dependencies & Deploy

The code changes have already been made. You just need to:

1. Install the AWS SDK dependency (if deploying manually):
   ```bash
   cd apps/server
   npm install @aws-sdk/client-s3
   ```

2. Railway should automatically install dependencies on deploy

## Step 8: Test the Upload

1. Deploy your application
2. Try uploading an expense image
3. Check your S3 bucket - you should see files in the `expenses/` folder
4. The image should be accessible via the URL stored in your database

## Migration of Existing Files (Optional)

If you have existing files in your database with `/uploads/` paths, you have two options:

1. **Leave them as-is**: The code handles both relative URLs (old) and absolute URLs (new)
2. **Migrate them**: Write a migration script to upload existing files to S3 and update URLs

For now, new uploads will go to S3, and old files will still work if they're on the server.

## Security Notes

- **Public Access**: Images are publicly accessible (good for audit - anyone with URL can view)
- **If you need private files**: Remove `ACL: "public-read"` from `s3.ts` and use signed URLs instead
- **Access Keys**: Store securely, rotate periodically
- **Bucket Policy**: The policy only allows reading, not writing (good!)

## Cost Monitoring

- AWS Free Tier: 5GB storage, 20,000 GET requests/month
- Monitor usage in AWS Console → Billing Dashboard
- Set up billing alerts if desired (free tier should cover you)

## Troubleshooting

**Error: "AWS_S3_BUCKET_NAME environment variable is not set"**
- Make sure you added the environment variable in Railway

**Error: "Access Denied"**
- Check that IAM user has correct permissions
- Verify bucket policy allows public reads
- Check bucket name is correct

**Images not displaying**
- Check CORS configuration if accessing from different domain
- Verify bucket has public read access
- Check that file URLs in database are correct

## Need Help?

- AWS S3 Documentation: https://docs.aws.amazon.com/s3/
- Railway Environment Variables: https://docs.railway.app/develop/variables

