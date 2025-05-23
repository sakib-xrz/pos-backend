import multer from 'multer';
import path from 'path';
import {
  v2 as cloudinary,
  UploadApiResponse,
  DeleteApiResponse,
} from 'cloudinary';
import { Request } from 'express';
import config from '../config/index';

// Cloudinary configuration
cloudinary.config({
  cloud_name: config.cloudinary.cloud_name,
  api_key: config.cloudinary.api_key,
  api_secret: config.cloudinary.api_secret,
});

// Allowed file types
const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;

// Multer memory storage (for serverless compatibility)
const storage = multer.memoryStorage();

// File filter for multer
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Only images (jpeg, jpg, png, gif), PDFs, and DOC/DOCX files are allowed',
      ),
    );
  }
};

// Multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30 MB limit
});

// Upload file to Cloudinary directly from memory
const uploadToCloudinary = async (
  file: Express.Multer.File,
  options: { folder?: string; public_id?: string } = {},
): Promise<UploadApiResponse | undefined> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: options.folder || 'uploads',
          public_id: options.public_id || Date.now().toString(),
          use_filename: true,
          overwrite: true,
          invalidate: true,
        },
        (error, result) => {
          if (error) {
            return reject(
              new Error(`Cloudinary upload failed: ${error.message}`),
            );
          }
          resolve(result);
        },
      )
      .end(file.buffer); // Send file buffer directly
  });
};

// Delete file from Cloudinary
const deleteFromCloudinary = async (
  publicIds: string[],
): Promise<DeleteApiResponse | undefined> => {
  return new Promise((resolve, reject) => {
    cloudinary.api.delete_resources(publicIds, (error, result) => {
      if (error) {
        return reject(
          new Error(`Failed to delete from Cloudinary: ${error.message}`),
        );
      }
      resolve(result);
    });
  });
};

const extractPublicIdFromUrl = (url: string): string | null => {
  try {
    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex((part) => part === 'upload');
    if (uploadIndex !== -1 && urlParts[uploadIndex + 2]) {
      const publicIdWithExtension = urlParts.slice(uploadIndex + 2).join('/');
      // Remove file extension
      const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, '');
      return publicId;
    }
    return null;
  } catch (error) {
    console.log('Error from cloudinary while extracting public id', error);
    return null;
  }
};

// Export functions
export {
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicIdFromUrl,
};
