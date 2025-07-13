import multer, { memoryStorage } from 'multer';

const storage = memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
});

export const uploadFiles = upload.array('attachment');

export default upload;
