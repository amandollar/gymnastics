import { v2 as cloudinary } from "cloudinary";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function ensureCloudinaryConfig() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;

  if (!cloud_name || !api_key || !api_secret) {
    throw new Error(
      "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to .env.local"
    );
  }

  cloudinary.config({
    cloud_name,
    api_key,
    api_secret,
    secure: true,
  });
}

/**
 * Upload a student profile photo to Cloudinary.
 * Returns the HTTPS URL to store on Student.avatarUrl.
 */
export async function uploadStudentAvatarToCloudinary(
  studentId: string,
  file: File
): Promise<string> {
  if (!file.size) {
    throw new Error("Empty image file");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be smaller than 2 MB");
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Use JPEG, PNG, WebP, or GIF");
  }

  ensureCloudinaryConfig();

  const bytes = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type};base64,${bytes.toString("base64")}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: process.env.CLOUDINARY_FOLDER || "tag-crm/students",
    public_id: studentId,
    overwrite: true,
    resource_type: "image",
    transformation: [
      {
        width: 400,
        height: 400,
        crop: "fill",
        gravity: "auto",
      },
    ],
  });

  return result.secure_url;
}
