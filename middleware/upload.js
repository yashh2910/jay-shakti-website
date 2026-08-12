/**
 * upload.js — Multer middleware
 * ------------------------------
 * Uses memoryStorage so uploaded files are held in req.file.buffer (in RAM)
 * and forwarded to Backblaze B2 by the route handler.
 * No files are written to the local filesystem.
 */
const multer = require('multer');
const path   = require('path');

function fileFilter(req, file, cb) {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) return cb(null, true);
  cb(new Error('Only image files (jpg, jpeg, png, webp) are allowed'));
}

const upload = multer({
  storage: multer.memoryStorage(), // buffer in RAM; routes forward to B2
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

module.exports = upload;
