import multer from "multer";
import path from 'path';


// Store files in memory for cloud uploads (ImageKit / AWS S3)
const storage = multer.memoryStorage();

// No file type restriction — accept all
export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
});