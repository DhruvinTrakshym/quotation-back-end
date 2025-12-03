// src/pdf/generateQuotePdfBuffer.ts
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { buildQuotePdf } from './buildQuotePdf';
import Quote from '../../models/Quote';

export const generateQuotePdfBuffer = async (id: string): Promise<Buffer | null> => {
  try {
    const quote = await Quote.findById(id);
    if (!quote) return null;

    const qrDataUrl = await QRCode.toDataURL(
      'https://calendar.google.com/calendar/appointments/…?gv=true'
    );
    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    // Build PDF
    await buildQuotePdf(doc, quote, qrBuffer);

    // Finish
    doc.end();

    return pdfPromise;
  } catch (err) {
    console.error('PDF buffer generation failed:', err);
    return null;
  }
};
