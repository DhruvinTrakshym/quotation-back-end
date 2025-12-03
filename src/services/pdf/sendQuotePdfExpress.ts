// src/pdf/sendQuotePdfExpress.ts
import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { buildQuotePdf } from './buildQuotePdf';
import Quote from '../../models/Quote';

export const sendQuotePdfExpress = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const quote = await Quote.findById(id);
    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    const qrDataUrl = await QRCode.toDataURL(process.env.QR_DATA_URL as string);
    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=Trakshym-${quote.publicId}.pdf`);

    doc.pipe(res);

    await buildQuotePdf(doc, quote, qrBuffer);

    doc.end();
  } catch (err) {
    console.error('PDF send error:', err);
    res.status(500).json({ message: 'Failed to generate PDF' });
  }
};
