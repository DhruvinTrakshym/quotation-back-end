import mongoose, { Schema, Document } from 'mongoose';

export type FileDoc = {
  _id: any;
  name: string;
  s3Key: string;
  size: number;
  type: string;
  url?: string;
};

export interface IFile extends Document {
  quoteId: mongoose.Types.ObjectId; // reference to a Quote
  type: string; // "pdf", "image", "docx"
  name: string; // Original filename
  size: number; // File size in bytes
  s3Key: string; // Key/path in S3 bucket
  url: string; // Public URL to access the file
  extractedText?: string; // Extracted text from PDF,
  aiSummary?: string; // AI summary of the file
}

const FileSchema = new Schema<IFile>(
  {
    quoteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote' },
    type: { type: String, required: true },
    name: { type: String, required: true },
    size: { type: Number, required: true },
    s3Key: { type: String, required: true },
    url: { type: String, required: true },
    extractedText: { type: String, required: false },
    aiSummary: { type: String, required: false },
  },
  { timestamps: true }
);

export default mongoose.model<IFile>('File', FileSchema);
