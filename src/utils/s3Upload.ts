// src/utils/s3Upload.ts
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "../config/s3";

// Upload any PDF buffer to S3
export const uploadPdfToS3 = async (
  buffer: Buffer,
  key: string,
  contentType = "application/pdf"
) => {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: "private",
  });

  await s3.send(command);

  return {
    key,
    url: null, // private bucket (no public URL)
  };
};

// Get file stream from S3 (used for email attachments)
export const getS3Stream = async (key: string) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
  });

  const response = await s3.send(command);

  return response; // response.Body is a stream
};

// Optional: Get a temporary download URL (24 hours)
export const getSignedS3Url = async (key: string, expiresIn = 86400) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
  });

  return getSignedUrl(s3, command, { expiresIn });
};
