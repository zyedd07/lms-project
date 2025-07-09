// controllers/PaymentProcessing.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth'; // Assuming your auth middleware
import HttpError from '../utils/httpError';
import { createOrder, initiatePayment } from '../services/PaymentProcessing.service'; // Import the new service functions

/**
 * @route POST /api/payments/create-order
 * @desc Creates a new order record for a course enrollment.
 * @access Private (Authenticated User)
 */
export const createOrderController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.id) {
            throw new HttpError('Authentication required to create an order.', 401);
        }

        // Destructure price and other product IDs from the request body
        const { courseId, testSeriesId, qbankId, webinarId, price } = req.body;

        // Basic validation: ensure at least one product ID is provided and price is valid
        if (
            (!courseId && !testSeriesId && !qbankId && !webinarId) ||
            price === undefined || price === null || isNaN(parseFloat(price))
        ) {
            throw new HttpError('Missing required order details: product ID (courseId, testSeriesId, qbankId, or webinarId) and valid price.', 400);
        }

        // Call the service to create the order
        const result = await createOrder({
            userId: req.user.id, // Get userId from authenticated request
            courseId,
            testSeriesId,
            qbankId,
            webinarId,
            price: parseFloat(price), // Ensure price is a number
        });

        res.status(201).json({
            success: true,
            message: result.message,
            orderId: result.orderId,
            confirmedPrice: result.confirmedPrice,
        });

    } catch (error: any) {
        next(error); // Pass error to the error handling middleware
    }
};

/**
 * @route POST /api/payments/process-transaction
 * @desc Initiates a payment transaction with the selected payment gateway for an existing order.
 * @access Private (Authenticated User)
 */
export const processPaymentController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.id) {
            throw new HttpError('Authentication required to process payment.', 401);
        }

        const { orderId, gatewayName } = req.body;

        // Basic validation
        if (!orderId || !gatewayName) {
            throw new HttpError('Missing required payment processing details: orderId, gatewayName.', 400);
        }

        // Call the service to initiate the payment
        const result = await initiatePayment({
            orderId,
            gatewayName,
        });

        res.status(200).json({
            success: true,
            message: result.message,
            transactionId: result.transactionId,
            orderId: result.orderId,
            // No redirectUrl is returned for in-app direct processing in this flow
        });

    } catch (error: any) {
        next(error); // Pass error to the error handling middleware
    }
};
