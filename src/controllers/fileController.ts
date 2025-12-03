import { Request, Response } from 'express';
import File from '../models/File';
import path from 'path';

export const uploadFile = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const file = await File.create({
      quoteId: req.body.quoteId,
      type: path.extname(req.file.originalname).replace('.', ''),
      name: req.file.originalname,
      size: req.file.size,
      s3Key: req.file.filename, // local filename for now
      extractedText: req.body.extractedText || '', // Extracted text from PDF,
      aiSummary: req.body.aiSummary || '', // AI summary of the file
    });

    res.status(201).json({ message: 'File uploaded', file });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const listFiles = async (req: Request, res: Response) => {
  try {
    const files = await File.find().sort({ createdAt: -1 });
    res.json(files);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getFile = async (req: Request, res: Response) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });
    res.json(file);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteFile = async (req: Request, res: Response) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });

    // Optional: delete from disk or S3
    // fs.unlinkSync(path.join(__dirname, "../../uploads", file.s3Key));

    await file.deleteOne();
    res.json({ message: 'File deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
