import express from 'express';
import * as drugCategoryController from '../controllers/DrugCategory.controller';
import isAuth, { authorizeAdmin } from '../middleware/auth'; // Assuming auth middleware exists

const router = express.Router();

// --- Public Route ---
/**
 * @route   GET /api/drug-categories
 * @desc    Get a list of all drug categories
 * @access  Public
 */
router.get('/', drugCategoryController.getAllDrugCategories);


// --- Admin-only Routes ---
/**
 * @route   POST /api/drug-categories/create
 * @desc    Create a new drug category
 * @access  Private (Admin)
 */
router.post(
    '/create',
    isAuth,
    authorizeAdmin,
    drugCategoryController.createDrugCategory
);

/**
 * @route   PUT /api/drug-categories/:categoryId
 * @desc    Update an existing drug category
 * @access  Private (Admin)
 */
router.put(
    '/:categoryId',
    isAuth,
    authorizeAdmin,
    drugCategoryController.updateDrugCategory
);

/**
 * @route   DELETE /api/drug-categories/:categoryId
 * @desc    Delete a drug category
 * @access  Private (Admin)
 */
router.delete(
    '/:categoryId',
    isAuth,
    authorizeAdmin,
    drugCategoryController.deleteDrugCategory
);

export default router;
