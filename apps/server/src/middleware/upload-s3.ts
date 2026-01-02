import multer from "multer";
import { uploadToS3 } from "../utils/s3";

// Memory storage - we'll upload directly to S3 without saving to disk
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow only image files
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

/**
 * Middleware to upload file to S3 after multer processes it
 * This should be used after multer.single() middleware
 */
export async function uploadFileToS3(req: Express.Request): Promise<string | null> {
  if (!req.file) {
    return null;
  }

  try {
    const result = await uploadToS3(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );
    return result.url;
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw new Error("Failed to upload file to storage");
  }
}

