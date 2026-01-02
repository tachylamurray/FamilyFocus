import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export interface UploadResult {
  url: string;
  publicId: string;
}

/**
 * Upload a file buffer to Cloudinary
 * @param fileBuffer - File buffer
 * @param folder - Optional folder name (default: "expenses")
 * @returns Upload result with URL and public ID
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folder: string = "expenses"
): Promise<UploadResult> {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error(
      "CLOUDINARY_CLOUD_NAME environment variable is not set. " +
      "Please configure Cloudinary for permanent file storage."
    );
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        // Optional: Add transformations or other settings
        // format: "auto",
        // quality: "auto"
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result) {
          reject(new Error("Upload failed: No result returned"));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
}

/**
 * Delete a file from Cloudinary
 * @param publicId - Cloudinary public ID (or full URL, will extract public ID)
 */
export async function deleteFromCloudinary(publicIdOrUrl: string): Promise<void> {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error("CLOUDINARY_CLOUD_NAME environment variable is not set");
  }

  // Extract public ID from URL if full URL is provided
  let publicId = publicIdOrUrl;
  if (publicIdOrUrl.includes("cloudinary.com")) {
    // Extract public ID from URL like: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
    const parts = publicIdOrUrl.split("/");
    const uploadIndex = parts.findIndex(part => part === "upload");
    if (uploadIndex !== -1 && uploadIndex < parts.length - 1) {
      // Get everything after "upload/" but before the file extension
      const afterUpload = parts.slice(uploadIndex + 1).join("/");
      publicId = afterUpload.split(".")[0]; // Remove file extension
    }
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, { resource_type: "image" }, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

