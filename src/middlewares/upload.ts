import multer from 'multer';
import path from 'path';
import fs from 'fs';

const ALLOWED_FILE_TYPES = ['pdf', 'docx', 'png', 'jpg', 'jpeg', 'webp'];

const uploadDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');

    if (!ALLOWED_FILE_TYPES.includes(ext)) {
      const err: any = new Error('INVALID_FILE_TYPE');
      err.code = 'INVALID_FILE_TYPE';
      return cb(err);
    }

    cb(null, true);
  },
});
