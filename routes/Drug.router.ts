import express from 'express';
import * as drugController from '../controllers/Drug.controller';
import isAuth, { authorizeAdmin } from '../middleware/auth'; // Assuming auth middleware exists

const router = express.Router();

// --- Public Routes ---
/**
 * @route   GET /api/drugs
 * @desc    Get all drugs, grouped by the first letter of their name
 * @access  Public
 */
router.get('/', drugController.getAllDrugsGrouped);

/**
 * @route   GET /api/drugs/:drugId
 * @desc    Get a single drug by its ID
 * @access  Public
 */
router.get('/:drugId', drugController.getDrugById);


// --- Admin-only Routes ---
/**
 * @route   POST /api/drugs/create
 * @desc    Create a new drug
 * @access  Private (Admin)
 */
router.post(
    '/create',
    isAuth,
    authorizeAdmin,
    drugController.createDrug
);

/**
 * @route   PUT /api/drugs/:drugId
 * @desc    Update an existing drug
 * @access  Private (Admin)
 */
router.put(
    '/:drugId',
    isAuth,
    authorizeAdmin,
    drugController.updateDrug
);

/**
 * @route   DELETE /api/drugs/:drugId
 * @desc    Delete a drug
 * @access  Private (Admin)
 */
router.delete(
    '/:drugId',
    isAuth,
    authorizeAdmin,
    drugController.deleteDrug
);

export default router;
