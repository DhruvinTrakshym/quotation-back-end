import express from 'express';
import {
  getFeatures,
  createFeature,
  getFeatureById,
  updateFeature,
  deleteFeature,
  createMultipleFeatures,
} from '../controllers/featureController';

const router = express.Router();

router.get('/get-features', getFeatures);
router.post('/create-feature', createFeature);
router.post('/create-multiple-features', createMultipleFeatures);
router.get('/feature/:id', getFeatureById);
router.put('/update-feature/:id', updateFeature);
router.delete('/delete-feature/:id', deleteFeature);

export default router;
