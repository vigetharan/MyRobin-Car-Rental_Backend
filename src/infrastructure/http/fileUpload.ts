import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadsDir = 'uploads/';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
      cb(null, `car-${Date.now()}${path.extname(file.originalname)}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.match(/image\/(jpeg|jpg|png|gif)/)) {
      return cb(new Error('Only images are allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});
