const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { FILE_TYPES } = require('../utils/enums');

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), config.UPLOAD_PATH);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Configure storage for file uploads
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .substring(0, 50);
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  },
});

/**
 * File filter factory
 */
const createFileFilter = (allowedTypes) => {
  return (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
        ),
        false
      );
    }
  };
};

/**
 * Create multer upload instance
 */
const createUploader = (options = {}) => {
  const {
    allowedTypes = FILE_TYPES.ALL,
    maxFileSize = config.MAX_FILE_SIZE,
    maxFiles = 5,
  } = options;

  return multer({
    storage,
    fileFilter: createFileFilter(allowedTypes),
    limits: {
      fileSize: maxFileSize,
      files: maxFiles,
    },
  });
};

/**
 * Single file upload middleware
 */
const uploadSingle = (fieldName = 'file', options = {}) => {
  const uploader = createUploader(options);
  return uploader.single(fieldName);
};

/**
 * Multiple files upload middleware
 */
const uploadMultiple = (fieldName = 'files', maxCount = 5, options = {}) => {
  const uploader = createUploader({ ...options, maxFiles: maxCount });
  return uploader.array(fieldName, maxCount);
};

/**
 * Mixed fields upload middleware
 */
const uploadFields = (fields, options = {}) => {
  const uploader = createUploader(options);
  return uploader.fields(fields);
};

/**
 * Image upload middleware (images only)
 */
const uploadImage = (fieldName = 'image') => {
  return uploadSingle(fieldName, {
    allowedTypes: FILE_TYPES.IMAGE,
    maxFileSize: 2 * 1024 * 1024, // 2MB for images
  });
};

/**
 * Document upload middleware (documents only)
 */
const uploadDocument = (fieldName = 'document') => {
  return uploadSingle(fieldName, {
    allowedTypes: FILE_TYPES.DOCUMENT,
  });
};

/**
 * Avatar upload middleware
 */
const uploadAvatar = uploadSingle('avatar', {
  allowedTypes: FILE_TYPES.IMAGE,
  maxFileSize: 1 * 1024 * 1024, // 1MB for avatars
});

/**
 * Shipment attachments upload middleware
 */
const uploadShipmentAttachments = uploadMultiple('attachments', 5, {
  allowedTypes: FILE_TYPES.ALL,
  maxFileSize: 5 * 1024 * 1024, // 5MB per file
});

/**
 * Delete uploaded file
 */
const deleteFile = (filePath) => {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      return resolve(false);
    }

    fs.unlink(fullPath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
};

/**
 * Get file URL
 */
const getFileUrl = (filename) => {
  return `/uploads/${filename}`;
};

/**
 * Process uploaded file info
 */
const processFileInfo = (file) => {
  if (!file) return null;

  return {
    filename: file.filename,
    originalName: file.originalname,
    path: getFileUrl(file.filename),
    mimetype: file.mimetype,
    size: file.size,
    uploadedAt: new Date(),
  };
};

/**
 * Process multiple uploaded files
 */
const processFilesInfo = (files) => {
  if (!files || !Array.isArray(files)) return [];
  return files.map(processFileInfo);
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  uploadImage,
  uploadDocument,
  uploadAvatar,
  uploadShipmentAttachments,
  deleteFile,
  getFileUrl,
  processFileInfo,
  processFilesInfo,
};
