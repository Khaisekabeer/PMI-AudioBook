// services/storageService.js
// ─────────────────────────────────────────────────────────────────────────
//  Storage abstraction for user-uploaded media (audio chapters + covers).
//
//  • PRODUCTION (Vercel serverless): Cloudinary. Disk is ephemeral on Vercel,
//    so we stream the in-memory buffer to the cloud and persist a URL.
//  • LOCAL DEV: if Cloudinary creds are absent, fall back to writing to
//    disk under backend/uploads/<audio|covers>/ — keeping local dev simple.
//
//  Both implementations return the SAME shape:
//     { url, filename, resourceType, bytes, mimetype }
// ─────────────────────────────────────────────────────────────────────────
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function isCloudStorage() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

function initCloudinary() {
  if (isCloudStorage()) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    return true;
  }
  return false;
}

/**
 * Upload a single file buffer to Cloudinary under a folder (audio | covers).
 * Audio files use resource_type "video" (Cloudinary treats audio this way
 * for raw streaming); covers use "image".
 */
async function uploadToCloudinary(file, folder) {
  const resourceType = folder === "covers" ? "image" : "video";

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `pmi-audiobook/${folder}`,
        resource_type: resourceType,
        public_id: `${Date.now()}-${path
          .parse(file.originalname)
          .name.replace(/\s+/g, "-")
          .slice(0, 40)}`,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          filename: result.public_id,
          resourceType,
          bytes: result.bytes,
          mimetype: file.mimetype,
        });
      }
    );
    uploadStream.end(file.buffer);
  });
}

/**
 * Local disk fallback. Writes to backend/uploads/<folder>/<timestamp-name>.
 */
function uploadToDisk(file, folder) {
  const uploadDir = path.join(__dirname, "..", "uploads", folder);
  fs.mkdirSync(uploadDir, { recursive: true });

  const ext = path.extname(file.originalname) || "";
  const base = path
    .basename(file.originalname, ext)
    .replace(/\s+/g, "-")
    .slice(0, 40);
  const filename = `${Date.now()}-${base}${ext}`;
  const fullPath = path.join(uploadDir, filename);

  fs.writeFileSync(fullPath, file.buffer);

  return {
    url: `/uploads/${folder}/${filename}`,
    filename: `${folder}/${filename}`,
    resourceType: folder === "covers" ? "image" : "video",
    bytes: file.size,
    mimetype: file.mimetype,
  };
}

/**
 * Public API: store a file. `file` is a Multer file object (memoryStorage).
 * Returns { url, filename, resourceType, bytes, mimetype }.
 */
export async function storeFile(file, folder) {
  if (!file) throw new Error("No file provided to storeFile");
  if (!["audio", "covers"].includes(folder)) {
    throw new Error(`Invalid storage folder: ${folder}`);
  }

  if (isCloudStorage()) {
    initCloudinary();
    return uploadToCloudinary(file, folder);
  }

  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    throw new Error(
      "Cloud persistent storage is required on Vercel. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your Vercel project Environment Variables."
    );
  }

  return uploadToDisk(file, folder);
}
