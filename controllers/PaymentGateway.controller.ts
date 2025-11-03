// controllers/PaymentGateway.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth'; // Assuming your auth middleware
import HttpError from '../utils/httpError';
import { Role } from '../utils/constants'; // Assuming you have Role constants

import {
    createPaymentGatewaySetting,
    updatePaymentGatewaySetting,
    deletePaymentGatewaySetting,
    getAllPaymentGatewaySettings,
    getActivePaymentGatewaySetting,
} from '../services/PaymentGateway.service';

/**
 * Admin: Create a new payment gateway setting.
 * @route POST /api/admin/payment-gateways
 * @access Private (Admin)
 */
export const createPaymentGatewayController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (req.user?.role !== Role.ADMIN) {
            throw new HttpError('Unauthorized: Only Admin can create payment gateway settings.', 403);
        }
        const newSetting = await createPaymentGatewaySetting(req.body);
        res.status(201).json({ success: true, data: newSetting });
    } catch (error: any) {
        next(error);
    }
};

/**
 * Admin: Update an existing payment gateway setting.
 * @route PUT /api/admin/payment-gateways/:id
 * @desc Update an existing payment gateway setting.
 * @access Private (Admin)
 */
export const updatePaymentGatewayController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (req.user?.role !== Role.ADMIN) {
            throw new HttpError('Unauthorized: Only Admin can update payment gateway settings.', 403);
        }
        const { id } = req.params;
        const updatedSetting = await updatePaymentGatewaySetting(id, req.body);
        res.status(200).json({ success: true, data: updatedSetting });
    } catch (error: any) {
        next(error);
    }
};

/**
 * Admin: Delete a payment gateway setting.
 * @route DELETE /api/admin/payment-gateways/:id
 * @desc Delete a payment gateway setting.
 * @access Private (Admin)
 */
export const deletePaymentGatewayController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (req.user?.role !== Role.ADMIN) {
            throw new HttpError('Unauthorized: Only Admin can delete payment gateway settings.', 403);
        }
        const { id } = req.params;
        const result = await deletePaymentGatewaySetting(id);
        res.status(200).json({ success: true, message: result.message });
    } catch (error: any) {
        next(error);
    }
};

/**
 * Admin: Get all payment gateway settings.
 * @route GET /api/admin/payment-gateways
 * @desc Get all payment gateway settings (for Admin Panel).
 * @access Private (Admin)
 */
export const getAllPaymentGatewaysController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (req.user?.role !== Role.ADMIN) {
            throw new HttpError('Unauthorized: Only Admin can view all payment gateway settings.', 403);
        }
        const settings = await getAllPaymentGatewaySettings();
        res.status(200).json({ success: true, data: settings });
    } catch (error: any) {
        next(error);
    }
};

/**
 * Mobile App: Get the active/default payment gateway setting.
 * This endpoint can be public or authenticated based on your app's needs.
 * It will strip sensitive data (apiSecret).
 * @route GET /api/payment-gateways/active
 * @desc Get the active/default payment gateway setting (for Mobile App).
 * @access Public
 */
export const getActivePaymentGatewayController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const setting = await getActivePaymentGatewaySetting();
        res.status(200).json({ success: true, data: setting });
    } catch (error: any) {
        next(error);
    }
};
