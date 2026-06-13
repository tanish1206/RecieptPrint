import multer from 'multer';

// Use memory storage to process files directly in-memory
const storage = multer.memoryStorage();

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function fileFilter(req, file, cb) {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('INVALID_FILE_TYPE'), false);
  }
}

const uploadConfig = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter,
}).single('receipt'); // Expecting file field name to be 'receipt'

/**
 * Express middleware to handle file uploads and return standard 400 errors for validation failures.
 */
export function handleFileUpload(req, res, next) {
  uploadConfig(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds the 5MB limit.' });
      }
      if (err.message === 'INVALID_FILE_TYPE') {
        return res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, and PDF are accepted.' });
      }
      return res.status(400).json({ error: err.message || 'File upload failed.' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    next();
  });
}
