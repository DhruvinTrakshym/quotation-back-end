import express from 'express';
import { upload } from '../middlewares/upload';
import { uploadFile, listFiles, getFile, deleteFile } from '../controllers/fileController';

const router = express.Router();

router.post('/upload', upload.single('file'), uploadFile);
router.get('/', listFiles);
router.get('/:id', getFile);
router.delete('/:id', deleteFile);

export default router;
