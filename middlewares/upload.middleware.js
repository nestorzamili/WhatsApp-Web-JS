import multer, { memoryStorage } from 'multer';
import { isWhatsAppSupported } from '../utils/mimeTypes.js';

const storage = memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    if (isWhatsAppSupported(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.originalname}`), false);
    }
  },
});

const uploadFiles = upload.array('files');

export const conditionalUpload = (req, res, next) => {
  const contentType = req.get('Content-Type');

  if (contentType?.startsWith('multipart/form-data')) {
    uploadFiles(req, res, next);
  } else {
    next();
  }
};
