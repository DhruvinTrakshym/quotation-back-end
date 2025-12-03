import multer from "multer";
import multerS3 from "multer-s3";
import path from "path";
import { s3 } from "../config/s3";
import { Request } from "express";

const ALLOWED_FILE_TYPES = ["pdf", "docx", "png", "jpg", "jpeg", "webp"];

export const uploadToS3 = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(".", "");

    if (!ALLOWED_FILE_TYPES.includes(ext)) {
      return cb(new Error("INVALID_FILE_TYPE"));
    }

    cb(null, true);
  },
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET!,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: "private", // "public-read" for public or "private" if you want protected files
    key: (req:Request, file:Express.Multer.File, cb:Function) => {
      const ext = path.extname(file.originalname);
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, `quote-files/${unique}`);
    },
  }),
});
