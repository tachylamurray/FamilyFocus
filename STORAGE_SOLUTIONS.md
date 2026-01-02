# Permanent File Storage Solutions for Audit Purposes

## Current Issue
Files are stored in ephemeral filesystem storage (`/uploads`), which will be lost on container restarts/deployments. For audit purposes, you need permanent, reliable storage.

## Storage Options Comparison

### 🥇 **Option 1: AWS S3 (RECOMMENDED for Audit)**
**Cost**: FREE (5GB storage, 20,000 GET requests/month) or ~$0.023/GB/month after

**Pros:**
- ✅ Industry standard for audit/compliance use cases
- ✅ Versioning support (track file changes over time)
- ✅ 99.999999999% (11 9's) durability
- ✅ Excellent documentation and Node.js SDK
- ✅ Lifecycle policies for cost optimization
- ✅ Access logging for audit trails
- ✅ Free tier: 5GB storage, 20,000 GET requests/month
- ✅ Very reliable (AWS infrastructure)
- ✅ Easy programmatic access

**Cons:**
- ⚠️ Requires AWS account setup
- ⚠️ Need to configure CORS for direct browser access (or serve via your API)

**Best For**: Audit purposes, long-term storage, reliability

---

### 🥈 **Option 2: Google Drive API**
**Cost**: FREE (15GB shared across Google services)

**Pros:**
- ✅ Large free tier (15GB)
- ✅ You mentioned being open to this
- ✅ Easy manual access via Google Drive UI
- ✅ Organized folder structure
- ✅ Good for non-technical family members to access files

**Cons:**
- ⚠️ More complex API (OAuth 2.0, service account setup)
- ⚠️ Rate limits (1,000 requests/100 seconds/user)
- ⚠️ Less optimized for programmatic access
- ⚠️ Slower upload/download compared to S3
- ⚠️ Requires service account or OAuth setup
- ⚠️ Files stored in "My Drive" of service account (not user-friendly location)

**Best For**: If you want manual access via Google Drive UI, or if you already use Google Workspace

---

### 🥉 **Option 3: Cloudinary**
**Cost**: FREE (25GB storage, 25GB bandwidth/month)

**Pros:**
- ✅ Large free tier (25GB)
- ✅ Image optimization built-in
- ✅ Very easy to implement
- ✅ CDN included
- ✅ Automatic image transformations

**Cons:**
- ⚠️ Image-focused (works for your use case)
- ⚠️ Less enterprise-oriented than S3
- ⚠️ Vendor lock-in (files optimized for Cloudinary)

**Best For**: Image-heavy apps, if you want image optimization

---

## Recommendation for Audit Purposes

### **AWS S3 is the best choice because:**

1. **Audit Reliability**: Industry standard for compliance/audit use cases
2. **Versioning**: Can enable versioning to track file changes
3. **Durability**: 11 nines durability (files almost never lost)
4. **Cost**: Free tier covers your needs, then very cheap ($0.023/GB/month)
5. **Professional**: Used by enterprises for audit trails
6. **Easy Migration**: Well-documented, easy to migrate away from later if needed

### **If you prefer Google Drive:**
- It will work, but requires more setup complexity
- Better if family members need manual file access
- Less optimal for programmatic access/API integration

---

## Implementation Strategy

Both solutions will:
1. Replace multer disk storage with cloud storage
2. Upload files to cloud storage on receipt
3. Store public URLs in database instead of local paths
4. Update file serving (S3: direct URLs or API proxy, Google Drive: API proxy)

---

## Next Steps

I'll implement AWS S3 first (recommended), but can also implement Google Drive if you prefer. Which would you like me to implement?

