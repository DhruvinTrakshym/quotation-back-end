// src/controllers/quoteController.ts
import { Request, Response } from 'express';
import Quote from '../models/Quote';
import { estimateQuote } from '../services/estimationEngine';
import PDFDocument from 'pdfkit';
import { sendError, sendSuccess } from '../utils/apiResponse';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import File, { FileDoc, IFile } from '../models/File';
import mongoose from 'mongoose';
import transporter from '../services/emailService';
import type { Attachment } from 'nodemailer/lib/mailer';
import { buildQuotePdf } from '../services/pdf/buildQuotePdf';
import { capitalizeFirstWord } from '../utils/capitalizeFirstWord';
import { getS3Stream, uploadPdfToS3 } from '../utils/s3Upload';
import { deleteS3File } from '../utils/s3Delete';

// Create Draft Quote
export const createQuote = async (req: Request, res: Response) => {
  try {
    const { client, engagementModel, userProfile, inputs } = req.body;

    // Basic validation (will later be replaced by Zod middleware)
    if (!client?.email || !client?.name || !client?.phone) {
      return sendError(res, 'VALIDATION_ERROR', 'Client email, name, and phone are required');
    }

    if (!engagementModel) {
      return sendError(res, 'VALIDATION_ERROR', 'Engagement model is required');
    }

    if (!userProfile) {
      return sendError(res, 'VALIDATION_ERROR', 'User profile is required');
    }

    const quote = await Quote.create({
      client,
      engagementModel,
      userProfile,
      inputs,
    });

    if (!quote) {
      return sendError(res, 'DB_ERROR', 'Failed to create quote', undefined, 500);
    }

    // const { computed, options } = await estimateQuote(quote);
    // quote.computed = computed;
    // quote.options = options;
    // await quote.save();

    return sendSuccess(res, 'Quote created successfully', { quote }, 201);
  } catch (error: any) {
    return sendError(
      res,
      'SERVER_ERROR',
      error.message || 'Failed to create quote',
      undefined,
      500
    );
  }
};

// Update Inputs
export const updateQuote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body; // same payload as createQuote

    const quote = await Quote.findById(id);
    if (!quote) {
      return sendError(res, 'NOT_FOUND', 'Quote not found', undefined, 404);
    }

    // ---- Update top-level fields if provided ----
    if (updates.client) {
      quote.client = { ...quote.client, ...updates.client };
    }

    if (updates.engagementModel !== undefined) {
      quote.engagementModel = updates.engagementModel;
    }

    if (updates.userProfile !== undefined) {
      quote.userProfile = updates.userProfile;
    }

    // ---- Deep merge inputs ----
    if (updates.inputs) {
      quote.inputs = {
        ...quote.inputs,
        ...updates.inputs,
      };
    }

    await quote.save();

    return sendSuccess(res, 'Quote updated successfully', { quote });
  } catch (error: any) {
    return sendError(res, 'SERVER_ERROR', error.message, undefined, 500);
  }
};

// Compute Estimate
// export const computeQuote = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const quote = await Quote.findById(id).populate('files');
//     if (!quote) return sendError(res, 'NOT_FOUND', 'Quote not found', undefined, 404);

//     const { computed, options } = await estimateQuote(quote);
//     quote.computed = computed;
//     quote.options = options;
//     // await quote.save();

//     // 2. Generate PDF file and save it
//     const pdfKey = `${quote.publicId}.pdf`;
//     const pdfDir = path.join(__dirname, '../../uploads/pdfs');

//     if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
//     const pdfPath = path.join(pdfDir, pdfKey);

//     // Generate QR
//     const qrDataUrl = await QRCode.toDataURL(process.env.QR_DATA_URL as string);
//     const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

//     // Create PDF
//     const doc = new PDFDocument({ size: 'A4', margin: 50 });
//     const stream = fs.createWriteStream(pdfPath);

//     doc.pipe(stream);
//     await buildQuotePdf(doc, quote, qrBuffer);
//     doc.end();

//     // Wait until file is fully saved
//     await new Promise<void>((resolve) => stream.on('finish', () => resolve()));

//     // 3. Save PDF key in DB
//     quote.pdfKey = pdfKey;
//     await quote.save();

//     return sendSuccess(res, 'Quote computed successfully', { quote });
//   } catch (error: any) {
//     return sendError(res, 'SERVER_ERROR', error.message, undefined, 500);
//   }
// };

// Compute Estimate S3 bucket version
export const computeQuote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const quote = await Quote.findById(id).populate('files');
    if (!quote) return sendError(res, 'NOT_FOUND', 'Quote not found', undefined, 404);

    const { computed, options } = await estimateQuote(quote);
    quote.computed = computed;
    quote.options = options;

    const pdfKey = `quote-pdfs/${quote.publicId}.pdf`;

    // Generate QR
    const qrDataUrl = await QRCode.toDataURL(process.env.QR_DATA_URL!);
    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

    // Generate PDF in memory
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(buffers);

      await uploadPdfToS3(pdfBuffer, pdfKey);

      quote.pdfKey = pdfKey;
      await quote.save();

      return sendSuccess(res, 'Quote computed successfully', { quote });
    });

    await buildQuotePdf(doc, quote, qrBuffer);
    doc.end();
  } catch (error: any) {
    return sendError(res, 'SERVER_ERROR', error.message, undefined, 500);
  }
};

// Attach Files
export const attachFilesToQuote = async (req: Request, res: Response) => {
  try {
    const quoteId = req.params.id;

    // Validate quote
    const quote = await Quote.findById(quoteId).populate('files');
    if (!quote) {
      return sendError(res, 'NOT_FOUND', 'Quote not found', undefined, 404);
    }

    const files = quote.files as unknown as IFile[];

    const uploadedFiles = req.files as Express.MulterS3.File[];

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return sendError(res, 'NO_FILE', 'No file uploaded', undefined, 400);
    }

    // Controller-level validation (double safety)
    const allowed = ['pdf', 'docx', 'png', 'jpg', 'jpeg', 'webp'];

    for (const file of uploadedFiles) {
      const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
      if (!allowed.includes(ext)) {
        return sendError(
          res,
          'INVALID_FILE_TYPE',
          `File type .${ext} is not allowed. Allowed: PDF, DOCX, Images only.`,
          undefined,
          400
        );
      }
    }

    // DELETE OLD FILES (S3 + MongoDB)
    for (const oldFile of files) {
      if (oldFile.s3Key) {
        await deleteS3File(oldFile.s3Key);
      }
      await File.findByIdAndDelete(oldFile._id);
    }
    // Reset quote.files
    quote.files = [];

    // SAVE NEW FILES
    const savedFiles: mongoose.Types.ObjectId[] = [];
    for (const file of uploadedFiles) {
      const ext = path.extname(file.originalname).replace('.', '');

      // const newFile = await File.create({
      //   quoteId,
      //   type: ext,
      //   name: file.originalname,
      //   size: file.size,
      //   s3Key: file.filename, // local for now, S3 key later
      //   // s3Key: s3UploadResult.Key, // uncomment if using S3
      //   extractedText: null,
      //   aiSummary: null,
      // });

      const newFile = await File.create({
        quoteId,
        type: ext,
        name: file.originalname,
        size: file.size,
        s3Key: file.key, // S3 key
        url: file.location, // optional: public S3 link
        extractedText: null,
        aiSummary: null,
      });

      savedFiles.push(newFile._id as mongoose.Types.ObjectId);
    }

    // Push file references into Quote
    quote.files.push(...savedFiles);
    await quote.save();

    return sendSuccess(res, 'Files uploaded successfully', {
      quote,
      files: savedFiles,
    });
  } catch (error: any) {
    return sendError(res, 'SERVER_ERROR', error.message, undefined, 500);
  }
};

// Request Detailed Quote
export const requestDetailedQuote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const selectedOption = req.body.selectedOption as 'A' | 'B' | 'C';

    const quote = await Quote.findById(id).populate('files');
    if (!quote) return sendError(res, 'NOT_FOUND', 'Quote not found', undefined, 404);

    const option = quote?.options?.[selectedOption];
    if (!option) return sendError(res, 'INVALID_OPTION', 'Invalid option selected', undefined, 400);

    const files = quote.files as unknown as FileDoc[];

    // const pdfBuffer = await generateQuotePdfBuffer(quote._id as string);

    let attachments: Attachment[] = [];

    // attachments = quote.files
    //   .map((file: any) => {
    //     const fullPath = path.join(__dirname, '../../uploads', file.s3Key);

    //     if (!fs.existsSync(fullPath)) {
    //       console.warn(`[WARN] Missing attachment: ${fullPath}`);
    //       return null;
    //     }

    //     return {
    //       filename: file.name,
    //       path: file.s3Key,
    //     };
    //   })
    //   .filter((a): a is { filename: string; path: string } => a !== null);

    for (const f of files) {
      attachments.push({
        filename: f.name,
        content: (await getS3Stream(f.s3Key)).Body as any, // S3 stream
      });
    }

    if (quote.pdfKey) {
      // const pdfPath = path.join(__dirname, '../../uploads/pdfs', quote.pdfKey);
      // if (fs.existsSync(pdfPath)) {
      const filterFileName = quote.pdfKey.split('/').pop() || 'quote.pdf';
      attachments.push({
        filename: filterFileName,
        content: (await getS3Stream(quote.pdfKey)).Body as any, // S3 stream
      });
      // }
    }

    // Enhanced HTML email template
    const html = `
    <!DOCTYPE html>
      <html lang="en">

      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Detailed Quote Request</title>
      </head>

      <body
        style="margin: 0; padding: 0; background-color: #f4f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation"
                style="max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">

                <!-- Header -->
                <tr>
                  <td
                    style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                      📋 New Detailed Quote Request
                    </h1>
                    <p style="margin: 12px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                      Quote ID: <strong>${quote.publicId}</strong>
                    </p>
                  </td>
                </tr>

                <!-- Client Information -->
                <tr>
                  <td style="padding: 40px 40px 30px;">
                    <h2
                      style="margin: 0 0 20px; color: #1a202c; font-size: 20px; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px;">
                      👤 Client Information
                    </h2>
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 10px 0; color: #4a5568; font-size: 14px; font-weight: 600; width: 140px;">Name:
                        </td>
                        <td style="padding: 10px 0; color: #2d3748; font-size: 14px;">${quote.client.name}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; color: #4a5568; font-size: 14px; font-weight: 600;">Email:</td>
                        <td style="padding: 10px 0; color: #2d3748; font-size: 14px;">
                          <a href="mailto:${quote.client.email}"
                            style="color: #667eea; text-decoration: none;">${quote.client.email}</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; color: #4a5568; font-size: 14px; font-weight: 600;">Company:</td>
                        <td style="padding: 10px 0; color: #2d3748; font-size: 14px;">${quote.client.company || 'N/A'}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Selected Option -->
                <tr>
                  <td style="padding: 0 40px 30px;">
                    <h2
                      style="margin: 0 0 20px; color: #1a202c; font-size: 20px; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px;">
                      ✨ Selected Option: ${option.label}
                    </h2>
                    <table
                      style="width: 100%; border-collapse: collapse; background-color: #f7fafc; border-radius: 8px; overflow: hidden;">
                      <tr>
                        <td style="padding: 20px;">
                          <table style="width: 100%;">
                            <tr>
                              <td style="padding: 8px 0;">
                                <span
                                  style="color: #4a5568; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Timeline</span>
                                <div style="margin-top: 4px; color: #2d3748; font-size: 18px; font-weight: 700;">
                                  ${option.weeks} weeks</div>
                              </td>
                              <td style="padding: 8px 0; text-align: right;">
                                <span
                                  style="color: #4a5568; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Cost
                                  Range</span>
                                <div style="margin-top: 4px; color: #667eea; font-size: 18px; font-weight: 700;">
                                  ₹${option.costMin.toLocaleString()} – ₹${option.costMax.toLocaleString()}</div>
                              </td>
                            </tr>
                            <tr>
                              <td colspan="2" style="padding: 16px 0 8px;">
                                <span
                                  style="color: #4a5568; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Cloud
                                  Infrastructure</span>
                                <div style="margin-top: 4px; color: #2d3748; font-size: 16px; font-weight: 600;">
                                  ₹${option.cloudMonthly.toLocaleString()}/month</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Project Goals -->
                <tr>
                  <td style="padding: 0 40px 30px;">
                    <h2
                      style="margin: 0 0 16px; color: #1a202c; font-size: 20px; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px;">
                      🎯 Project Goals
                    </h2>
                    <p
                      style="margin: 0; color: #4a5568; font-size: 15px; line-height: 1.7; background-color: #f7fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #667eea;">
                      ${quote.inputs.goals}
                    </p>
                  </td>
                </tr>

                <!-- Selected Features -->
                <tr>
                  <td style="padding: 0 40px 30px;">
                    <h2
                      style="margin: 0 0 16px; color: #1a202c; font-size: 20px; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px;">
                      🔧 Selected Features
                    </h2>
                    <table style="width: 100%; border-collapse: collapse;">
                      ${quote.inputs.features
                        .map(
                          (f, idx) => `
                      <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f7fafc'};">
                        <td style="padding: 12px 16px; color: #2d3748; font-size: 14px; border-radius: 6px;">
                          <strong style="color: #1a202c;">${f.key}</strong>
                          <span
                            style="display: inline-block; margin-left: 8px; padding: 4px 10px; background-color: #e6fffa; color: #047857; font-size: 12px; font-weight: 600; border-radius: 12px;">
                            ${f.depth}
                          </span>
                        </td>
                      </tr>
                      `
                        )
                        .join('')}
                    </table>
                  </td>
                </tr>

                <!-- Client Notes -->
                <tr>
                  <td style="padding: 0 40px 30px;">
                    <h2
                      style="margin: 0 0 16px; color: #1a202c; font-size: 20px; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px;">
                      📝 Additional Details
                    </h2>
                    <table
                      style="width: 100%; border-collapse: collapse; background-color: #f7fafc; border-radius: 8px; padding: 20px;">
                      <tr>
                        <td style="padding: 10px 0;">
                          <span
                            style="color: #4a5568; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Build
                            Types</span>
                          <div style="margin-top: 6px;">
                            ${quote.inputs.buildTypes
                              .map(
                                (type) => `
                            <span
                              style="display: inline-block; margin: 4px 6px 4px 0; padding: 6px 14px; background-color: #edf2f7; color: #2d3748; font-size: 13px; font-weight: 500; border-radius: 16px;">
                              ${type}
                            </span>
                            `
                              )
                              .join('')}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 16px 0 10px;">
                          <span
                            style="color: #4a5568; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Integrations</span>
                          <div style="margin-top: 6px;">
                            ${quote.inputs.integrations
                              .map(
                                (integration) => `
                            <span
                              style="display: inline-block; margin: 4px 6px 4px 0; padding: 6px 14px; background-color: #e6fffa; color: #047857; font-size: 13px; font-weight: 500; border-radius: 16px;">
                              ${capitalizeFirstWord(integration)}
                            </span>
                            `
                              )
                              .join('')}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 16px 0 0;">
                          <span
                            style="color: #4a5568; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">AI
                            Integration</span>
                          <div style="margin-top: 6px; color: #2d3748; font-size: 14px;">
                            <strong>${quote.inputs.includesAI ? '✅ Yes' : '❌ No'}</strong>
                            ${
                              quote.inputs.includesAI
                                ? `<span style="color: #4a5568;"> – ${quote.inputs.aiNovelty}</span>`
                                : ''
                            }
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Attachments Notice -->
                ${
                  attachments.length > 0
                    ? `
                <tr>
                  <td style="padding: 0 40px 30px;">
                    <div
                      style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 8px;">
                      <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 600;">
                        📎 <strong>${attachments.length} attachment${attachments.length > 1 ? 's' : ''}</strong> included with
                        this quote request
                      </p>
                    </div>
                  </td>
                </tr>
                `
                    : ''
                }

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #f7fafc; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0; color: #718096; font-size: 13px; text-align: center; line-height: 1.6;">
                      This request was generated automatically by <strong style="color: #667eea;">Trakshym Estimator</strong>
                      <br>
                      <span style="color: #a0aec0;">Received on ${new Date().toLocaleString(
                        undefined,
                        {
                          dateStyle: 'long',
                          timeStyle: 'short',
                        }
                      )}</span>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>`;

    // Send email
    const start = Date.now();

    const info: any = await transporter.sendMail({
      from: `"Trakshym Estimator" <${process.env.MAIL_USER}>`,
      to: 'dhruvinsorathiya102.15@gmail.com',
      subject: `📩 Detailed Quote Request – ${quote.publicId}`,
      html,
      attachments,
    });

    const total = (Date.now() - start) / 1000;
    console.log(`📨 Email sent in ${total.toFixed(2)} seconds`);
    console.log('Envelope time:', info.envelopeTime);
    console.log('Message time:', info.messageTime);
    console.log('Total (ms):', info.envelopeTime + info.messageTime);

    // Update quote status
    quote.options[selectedOption].isSelected = true;
    await quote.save();

    return sendSuccess(res, 'Detailed quote request sent successfully');
  } catch (error: any) {
    console.log('🚀 ~ requestDetailedQuote ~ error:', error);
    return sendError(res, 'SERVER_ERROR', error.message, undefined, 500);
  }
};

// Finalize Quote
export const finalizeQuote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const quote = await Quote.findByIdAndUpdate(id, { $set: { status: 'final' } }, { new: true });

    if (!quote) return sendError(res, 'NOT_FOUND', 'Quote not found', undefined, 404);

    return sendSuccess(res, 'Quote finalized successfully', { quote });
  } catch (error: any) {
    return sendError(res, 'SERVER_ERROR', error.message, undefined, 500);
  }
};

// Get / List Quotes
export const getQuote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const quote = await Quote.findById(id).populate('files');

    if (!quote) return sendError(res, 'NOT_FOUND', 'Quote not found', undefined, 404);

    return sendSuccess(res, 'Quote retrieved successfully', { quote });
  } catch (error: any) {
    return sendError(res, 'SERVER_ERROR', error.message, undefined, 500);
  }
};

export const listQuotes = async (_req: Request, res: Response) => {
  try {
    const quotes = await Quote.find().sort({ createdAt: -1 });
    return sendSuccess(res, 'Quotes fetched successfully', { quotes });
  } catch (error: any) {
    return sendError(res, 'SERVER_ERROR', error.message, undefined, 500);
  }
};

// Generate Quote PDF
// export const generateQuotePDF = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;

//     const quote = await Quote.findById(id);
//     if (!quote) {
//       return sendError(res, 'NOT_FOUND', 'Quote not found', undefined, 404);
//     }

//     const qrDataUrl = await QRCode.toDataURL(process.env.QR_DATA_URL as string);
//     const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

//     // Save path for local PDF copy
//     const saveDir = path.join(__dirname, '../../uploads/pdfs');
//     if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir, { recursive: true });

//     const pdfFilename = `${quote.publicId}.pdf`;
//     const pdfPath = path.join(saveDir, pdfFilename);

//     // Create write stream for saving
//     const fileStream = createWriteStream(pdfPath);

//     const doc = new PDFDocument({
//       size: 'A4',
//       margin: 50,
//       info: {
//         Title: `Trakshym Quote ${quote.publicId}`,
//         Author: 'Trakshym Solutions',
//         Subject: 'Project Estimation Report',
//         Creator: 'Trakshym Estimator v1.0',
//       },
//     });

//     // Pipe output 1: save to disk
//     doc.pipe(fileStream);

//     // Pipe output 2: return inline PDF to browser
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `inline; filename=Trakshym-${quote.publicId}.pdf`);
//     doc.pipe(res);

//     // Build PDF content
//     await buildQuotePdf(doc, quote, qrBuffer);

//     doc.end();

//     // update DB AFTER file is saved
//     fileStream.on('finish', async () => {
//       quote.pdfKey = pdfFilename;
//       await quote.save();
//       console.log('PDF saved:', pdfFilename);
//     });
//   } catch (error: any) {
//     console.error('PDF generation error:', error);
//     return sendError(res, 'SERVER_ERROR', 'Error generating PDF', error.message, 500);
//   }
// };

export const generateQuotePDF = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const quote = await Quote.findById(id);

    if (!quote || !quote.pdfKey)
      return sendError(res, 'NOT_READY', 'PDF not generated yet. Please compute quote first.');

    // const pdfPath = path.join(__dirname, '../../uploads/pdfs', quote.pdfKey);

    // if (!fs.existsSync(pdfPath))
    //   return sendError(res, 'PDF_MISSING', 'Stored PDF not found. Please recompute quote.');

    // res.setHeader('Content-Type', 'application/pdf');
    // res.setHeader('Content-Disposition', `inline; filename=${quote.pdfKey}`);

    // fs.createReadStream(pdfPath).pipe(res);

    if (!quote?.pdfKey) return sendError(res, 'NOT_READY', 'PDF not generated yet');

    const obj = await getS3Stream(quote.pdfKey);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=${quote.publicId}.pdf`);
    return (obj.Body as any).pipe(res);
  } catch (error: any) {
    return sendError(res, 'SERVER_ERROR', error.message, undefined, 500);
  }
};

// STEP 8: View Public Quote
export const viewPublicQuote = async (req: Request, res: Response) => {
  try {
    const { publicId } = req.params;
    const quote = await Quote.findOne({ publicId, status: 'final' });

    if (!quote)
      return sendError(res, 'NOT_FOUND', 'Quote not found or not public yet', undefined, 404);

    return sendSuccess(res, 'Quote retrieved successfully', {
      publicId: quote.publicId,
      client: quote.client,
      options: quote.options,
      contactCTA: {
        message: 'Interested? Contact Trakshym for next steps!',
        link: 'mailto:sales@trakshym.com',
      },
    });
  } catch (error: any) {
    return sendError(res, 'SERVER_ERROR', error.message, undefined, 500);
  }
};
