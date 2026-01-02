# Google Drive API Setup Guide (Alternative to AWS S3)

If you prefer Google Drive over AWS S3, this guide will help you set it up.

## Why Consider Google Drive?

- ✅ Large free tier (15GB shared across Google services)
- ✅ Easy manual access via Google Drive UI
- ✅ Organized folder structure
- ✅ Good for non-technical family members to access files

## Why AWS S3 is Still Recommended

- ⚠️ More complex API setup (OAuth 2.0, service account)
- ⚠️ Rate limits (1,000 requests/100 seconds/user)
- ⚠️ Slower upload/download compared to S3
- ⚠️ Less optimized for programmatic access
- ⚠️ Files stored in service account's "My Drive" (not user-friendly location)

**Recommendation**: Use AWS S3 for better reliability and audit purposes (see `AWS_S3_SETUP.md`)

## If You Still Want Google Drive

I can implement Google Drive API integration if you prefer. It would require:

1. Creating a Google Cloud Project
2. Enabling Google Drive API
3. Creating a Service Account
4. Sharing a Google Drive folder with the service account
5. Installing `googleapis` package
6. Updating the upload middleware to use Google Drive API

Would you like me to implement this? Or would you prefer to proceed with AWS S3 (which is already implemented and ready to use)?

