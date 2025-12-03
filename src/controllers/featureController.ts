import { Request, Response } from 'express';
import { sendError, sendSuccess } from '../utils/apiResponse';
import FeatureLibrary from '../models/FeatureLibrary';

// Get Features
export const getFeatures = async (req: Request, res: Response) => {
  try {
    const features = await FeatureLibrary.find();
    console.log('features');

    if (!features) {
      return sendError(res, 'DB_ERROR', 'Failed to get features list', undefined, 500);
    }

    return sendSuccess(res, 'Features fetched successfully', { features }, 200);
  } catch (error: any) {
    return sendError(
      res,
      'SERVER_ERROR',
      error.message || 'Failed to get features list',
      undefined,
      500
    );
  }
};

// CREATE MULTIPLE FEATURES
export const createMultipleFeatures = async (req: Request, res: Response) => {
  try {
    const features = req.body.features;

    if (!Array.isArray(features) || features.length === 0) {
      return sendError(res, "VALIDATION_ERROR", "features must be a non-empty array");
    }

    // Check for duplicate keys within request body
    const requestKeys = features.map((f) => f.key);
    const duplicates = requestKeys.filter(
      (key, idx) => requestKeys.indexOf(key) !== idx
    );

    if (duplicates.length > 0) {
      return sendError(res, "DUPLICATE_KEYS_IN_REQUEST", "Duplicate keys in request", {
        duplicates: duplicates.join(", "),
      });
    }

    // Check existing keys in DB
    const existing = await FeatureLibrary.find({
      key: { $in: requestKeys },
    });

    if (existing.length > 0) {
      return sendError(
        res,
        "DUPLICATE_KEYS_IN_DB",
        "Some feature keys already exist",
        {
          existingKeys: existing.map((f) => f.key).join(", "),
        }
      );
    }

    const created = await FeatureLibrary.insertMany(features);

    return sendSuccess(res, "Features added successfully", { created }, 201);
  } catch (error: any) {
    return sendError(res, "SERVER_ERROR", error.message);
  }
};

// CREATE FEATURE
export const createFeature = async (req: Request, res: Response) => {
  try {
    const { key, name, description, basePoints, multipliers, category } = req.body;

    // Validation
    if (!key || !name || !description) {
      return sendError(res, "VALIDATION_ERROR", "Key, name, description are required");
    }

    // Check duplicate keys
    const exists = await FeatureLibrary.findOne({ key });
    if (exists) {
      return sendError(res, "DUPLICATE_KEY", "Feature with this key already exists");
    }

    const feature = await FeatureLibrary.create({
      key,
      name,
      description,
      basePoints,
      multipliers,
      category,
    });

    return sendSuccess(res, "Feature created successfully", { feature }, 201);
  } catch (error: any) {
    return sendError(res, "SERVER_ERROR", error.message);
  }
};

// GET SINGLE FEATURE
export const getFeatureById = async (req: Request, res: Response) => {
  try {
    const feature = await FeatureLibrary.findById(req.params.id);

    if (!feature) {
      return sendError(res, "NOT_FOUND", "Feature not found", undefined, 404);
    }

    return sendSuccess(res, "Feature fetched successfully", { feature });
  } catch (error: any) {
    return sendError(res, "SERVER_ERROR", error.message);
  }
};

// UPDATE FEATURE
export const updateFeature = async (req: Request, res: Response) => {
  try {
    const feature = await FeatureLibrary.findById(req.params.id);

    if (!feature) {
      return sendError(res, "NOT_FOUND", "Feature not found", undefined, 404);
    }

    // Update fields
    const updates = req.body;

    Object.assign(feature, updates);
    await feature.save();

    return sendSuccess(res, "Feature updated successfully", { feature });
  } catch (error: any) {
    return sendError(res, "SERVER_ERROR", error.message);
  }
};

// DELETE FEATURE
export const deleteFeature = async (req: Request, res: Response) => {
  try {
    const feature = await FeatureLibrary.findByIdAndDelete(req.params.id);

    if (!feature) {
      return sendError(res, "NOT_FOUND", "Feature not found", undefined, 404);
    }

    return sendSuccess(res, "Feature deleted successfully");
  } catch (error: any) {
    return sendError(res, "SERVER_ERROR", error.message);
  }
};
