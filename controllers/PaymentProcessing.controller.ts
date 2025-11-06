// controllers/PaymentProcessing.controller.ts (Updated)
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import HttpError from '../utils/httpError';
import { 
    createOrder, 
    initiatePayment, 
    updateOrderCustomerDetails,
    getOrderDetails 
} from '../services/PaymentProcessing.service';
import Order from '../models/Order.model';
import Payment from '../models/Payment.model';
import User from '../models/User.model';
import Course from '../models/Course.model';
import Qbank from '../models/QuestionBank.model';
import TestSeries from '../models/TestSeries.model';
import Webinar from '../models/webinar.model';

/**
 * @route POST /api/payments/create-order
 * @desc Creates a new order record for a product enrollment.
 * @access Private (Authenticated User)
 */
export const createOrderController = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user?.id) {
            throw new HttpError('Authentication required to create an order.', 401);
        }

        const { courseId, testSeriesId, qbankId, webinarId, price } = req.body;

        // Validation
        if (
            (!courseId && !testSeriesId && !qbankId && !webinarId) ||
            price === undefined || price === null || isNaN(parseFloat(price))
        ) {
            throw new HttpError(
                'Missing required order details: product ID and valid price.',
                400
            );
        }

        const result = await createOrder({
            userId: req.user.id,
            courseId,
            testSeriesId,
            qbankId,
            webinarId,
            price: parseFloat(price),
        });

        res.status(201).json({
            success: true,
            message: result.message,
            orderId: result.orderId,
            confirmedPrice: result.confirmedPrice,
        });

    } catch (error: any) {
        next(error);
    }
};

/**
 * @route POST /api/payments/process-transaction
 * @desc Initiates a payment transaction for an existing order.
 * @access Private (Authenticated User)
 */
export const processPaymentController = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user?.id) {
            throw new HttpError('Authentication required to process payment.', 401);
        }

        const { orderId, gatewayName } = req.body;

        if (!orderId || !gatewayName) {
            throw new HttpError(
                'Missing required payment processing details: orderId, gatewayName.',
                400
            );
        }

        const result = await initiatePayment({
            orderId,
            gatewayName,
        });

        res.status(200).json({
            success: true,
            message: result.message,
            transactionId: result.transactionId,
            orderId: result.orderId,
            amount: result.amount,
            currency: result.currency,
        });

    } catch (error: any) {
        next(error);
    }
};

/**
 * @route POST /api/payments/update-customer-details
 * @desc Update customer details for an order
 * @access Private (Authenticated User)
 */
export const updateCustomerDetailsController = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user?.id) {
            throw new HttpError('Authentication required.', 401);
        }

        const { orderId, name, phone, email } = req.body;

        if (!orderId || !name || !phone || !email) {
            throw new HttpError(
                'Missing required fields: orderId, name, phone, email.',
                400
            );
        }

        // Verify order belongs to user
        const order = await Order.findOne({
            where: { id: orderId, userId: req.user.id }
        });

        if (!order) {
            throw new HttpError('Order not found or unauthorized.', 404);
        }

        const result = await updateOrderCustomerDetails(orderId, {
            name,
            phone,
            email
        });

        res.status(200).json(result);

    } catch (error: any) {
        next(error);
    }
};

/**
 * @route GET /api/payments/order/:orderId
 * @desc Get order details
 * @access Private (Authenticated User)
 */
export const getOrderDetailsController = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user?.id) {
            throw new HttpError('Authentication required.', 401);
        }

        const { orderId } = req.params;

        const order = await getOrderDetails(orderId);

        // Verify order belongs to user (unless admin)
        if (order.get('userId') !== req.user.id && req.user.role !== 'admin') {
            throw new HttpError('Unauthorized access to order.', 403);
        }

        res.status(200).json({
            success: true,
            data: order
        });

    } catch (error: any) {
        next(error);
    }
};

/**
 * @route GET /api/payments/user/history
 * @desc Get user's payment history
 * @access Private (Authenticated User)
 */
export const getUserPaymentHistoryController = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user?.id) {
            throw new HttpError('Authentication required.', 401);
        }

        const payments = await Payment.findAll({
            where: { userId: req.user.id },
            include: [
                {
                    model: Order,
                    as: 'order',
                    include: [
                        { model: Course, as: 'course', attributes: ['id', 'name'], required: false },
                        { model: Qbank, as: 'qbank', attributes: ['id', 'name'], required: false },
                        { model: TestSeries, as: 'testSeries', attributes: ['id', 'name'], required: false },
                        { model: Webinar, as: 'webinar', attributes: ['id', 'title'], required: false },
                    ]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            message: 'Payment history fetched successfully.',
            data: payments
        });

    } catch (error: any) {
        next(error);
    }
};

/**
 * @route GET /api/payments/completed
 * @desc Get all completed payments (Admin only)
 * @access Private (Admin Only)
 */
export const getCompletedPayments = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (req.user?.role !== 'admin') {
            throw new HttpError(
                'Forbidden: Only administrators can view completed payments.',
                403
            );
        }

        const completedPayments = await Order.findAll({
            where: { status: 'successful' },
            include: [
                { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
                { model: Course, as: 'course', attributes: ['id', 'name'], required: false },
                { model: Qbank, as: 'qbank', attributes: ['id', 'name'], required: false },
                { model: TestSeries, as: 'testSeries', attributes: ['id', 'name'], required: false },
                { model: Webinar, as: 'webinar', attributes: ['id', 'title'], required: false },
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            message: 'Successfully fetched completed payments.',
            data: completedPayments
        });

    } catch (error) {
        console.error('Error fetching completed payments:', error);
        next(error);
    }
};