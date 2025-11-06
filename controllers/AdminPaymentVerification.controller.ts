// controllers/AdminPaymentVerification.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import HttpError from '../utils/httpError';
import {
    verifyPayment,
    getPendingPayments,
    getPaymentDetails,
    getAllPayments
} from '../services/AdminPaymentVerification.service';

/**
 * @route GET /api/admin/payments/pending
 * @desc Get all pending payments for admin verification
 * @access Private (Admin Only)
 */
export const getPendingPaymentsController = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (req.user?.role !== 'admin') {
            throw new HttpError('Forbidden: Admin access required.', 403);
        }

        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        const result = await getPendingPayments(limit, offset);

        res.status(200).json({
            success: true,
            message: 'Pending payments fetched successfully.',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route GET /api/admin/payments/all
 * @desc Get all payments with optional status filter
 * @access Private (Admin Only)
 */
export const getAllPaymentsController = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (req.user?.role !== 'admin') {
            throw new HttpError('Forbidden: Admin access required.', 403);
        }

        const status = req.query.status as string | undefined;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        const result = await getAllPayments(status, limit, offset);

        res.status(200).json({
            success: true,
            message: 'Payments fetched successfully.',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route GET /api/admin/payments/:paymentId
 * @desc Get payment details by ID
 * @access Private (Admin Only)
 */
export const getPaymentDetailsController = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (req.user?.role !== 'admin') {
            throw new HttpError('Forbidden: Admin access required.', 403);
        }

        const { paymentId } = req.params;

        const payment = await getPaymentDetails(paymentId);

        res.status(200).json({
            success: true,
            message: 'Payment details fetched successfully.',
            data: payment
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route POST /api/admin/payments/verify
 * @desc Verify and approve/reject a payment
 * @access Private (Admin Only)
 */
export const verifyPaymentController = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (req.user?.role !== 'admin') {
            throw new HttpError('Forbidden: Admin access required.', 403);
        }

        if (!req.user?.id) {
            throw new HttpError('Admin ID not found in request.', 401);
        }

        const { paymentId, status, adminNotes, gatewayTransactionId } = req.body;

        // Validation
        if (!paymentId || !status) {
            throw new HttpError('Missing required fields: paymentId, status.', 400);
        }

        if (!['successful', 'failed'].includes(status)) {
            throw new HttpError('Invalid status. Must be "successful" or "failed".', 400);
        }

        const result = await verifyPayment({
            paymentId,
            adminId: req.user.id,
            status,
            adminNotes,
            gatewayTransactionId
        });

        res.status(200).json({
            success: true,
            message: result.message,
            data: {
                paymentId: result.paymentId,
                status: result.status
            }
        });
    } catch (error) {
        next(error);
    }
};