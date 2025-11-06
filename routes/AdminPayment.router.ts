// routes/AdminPayment.router.ts
import express from 'express';
import {
    getPendingPaymentsController,
    getAllPaymentsController,
    getPaymentDetailsController,
    verifyPaymentController
} from '../controllers/AdminPaymentVerification.controller';
import isAuth from '../middleware/auth';
import { authorizeAdmin } from '../middleware/auth'; // Assuming you have this middleware

const router = express.Router();

/**
 * @route GET /api/admin/payments/pending
 * @desc Get all pending payments awaiting verification
 * @access Private (Admin Only)
 */
router.get('/pending', isAuth, authorizeAdmin, getPendingPaymentsController);

/**
 * @route GET /api/admin/payments/all
 * @desc Get all payments with optional status filter
 * @access Private (Admin Only)
 */
router.get('/all', isAuth, authorizeAdmin, getAllPaymentsController);

/**
 * @route GET /api/admin/payments/:paymentId
 * @desc Get specific payment details
 * @access Private (Admin Only)
 */
router.get('/:paymentId', isAuth, authorizeAdmin, getPaymentDetailsController);

/**
 * @route POST /api/admin/payments/verify
 * @desc Verify and approve/reject a payment
 * @access Private (Admin Only)
 */
router.post('/verify', isAuth, authorizeAdmin, verifyPaymentController);

export default router;