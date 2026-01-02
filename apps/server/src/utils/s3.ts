import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: process.env.AWS_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      }
    : undefined,
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

export interface UploadResult {
  url: string;
  key: string;
}

/**
 * Upload a file to S3
 * @param fileBuffer - File buffer
 * @param mimetype - File MIME type
 * @param originalName - Original filename (for extension)
 * @returns Upload result with URL and key
 */
export async function uploadToS3(
  fileBuffer: Buffer,
  mimetype: string,
  originalName: string
): Promise<UploadResult> {
  if (!BUCKET_NAME) {
    throw new Error(
      "AWS_S3_BUCKET_NAME environment variable is not set. " +
      "Please configure AWS S3 for permanent file storage. See AWS_S3_SETUP.md for instructions."
    );
  }

  // Generate unique filename
  const ext = originalName.split(".").pop() || "";
  const key = `expenses/${randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: mimetype,
    // Make files publicly readable (for audit purposes, files should be accessible)
    // If you want private files, remove this and use signed URLs instead
    ACL: "public-read",
  });

  await s3Client.send(command);

  // Construct public URL
  const region = process.env.AWS_REGION || "us-east-1";
  const url = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;

  return { url, key };
}

/**
 * Delete a file from S3
 * @param key - S3 object key (or full URL, will extract key)
 */
export async function deleteFromS3(keyOrUrl: string): Promise<void> {
  if (!BUCKET_NAME) {
    throw new Error("AWS_S3_BUCKET_NAME environment variable is not set");
  }

  // Extract key from URL if full URL is provided
  let key = keyOrUrl;
  if (keyOrUrl.startsWith("http")) {
    const url = new URL(keyOrUrl);
    key = url.pathname.substring(1); // Remove leading /
  }

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Extract S3 key from URL
 */
export function extractKeyFromUrl(url: string): string | null {
  if (!url.startsWith("http")) {
    return null; // Not an S3 URL
  }
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.substring(1); // Remove leading /
  } catch {
    return null;
  }
}

