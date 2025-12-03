// src/routes/quoteRoutes.ts
import express from 'express';
import {
  createQuote,
  computeQuote,
  attachFilesToQuote,
  generateQuotePDF,
  requestDetailedQuote,
  updateQuote,
  finalizeQuote,
  getQuote,
  listQuotes,
  viewPublicQuote,
} from '../controllers/quoteController';
import { validateRequest } from '../middlewares/validateRequest';
import {
  createQuoteSchema,
  // testCreateQuoteSchema
} from '../validators/quoteValidator';
import { upload } from '../middlewares/upload';
import { multerErrorHandler } from '../middlewares/multerErrorHandler';
import { uploadToS3 } from '../middlewares/uploadS3';

const router = express.Router();

router.post('/create', validateRequest(createQuoteSchema), createQuote);
router.put('/update/:id', validateRequest(createQuoteSchema), updateQuote);
router.get('/estimate/:id', computeQuote);

router.post('/files/:id', uploadToS3.array('files', 10), multerErrorHandler, attachFilesToQuote);
router.post('/request-detailed/:id', requestDetailedQuote);

router.get('/pdf/:id', generateQuotePDF);

// router.get('/finalize/:id', finalizeQuote);
// router.get('/', listQuotes);
// router.get('/:id', getQuote);
// router.get('/public/:publicId', viewPublicQuote);

export default router;
