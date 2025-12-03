import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../config/s3";

export const deleteS3File = async (key: string) => {
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
      })
    );
    return true;
  } catch (err) {
    console.error("❌ S3 delete failed:", err);
    return false;
  }
};
