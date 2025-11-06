// routes/PaymentProcessing.router.ts (Updated)
import express from 'express';
import {
    createOrderController,
    processPaymentController,
    updateCustomerDetailsController,
    getOrderDetailsController,
    getUserPaymentHistoryController,
    getCompletedPayments
} from '../controllers/PaymentProcessing.controller';
import isAuth from '../middleware/auth';
import { authorizeAdmin } from '../middleware/auth';

const router = express.Router();

/**
 * @route POST /api/payments/create-order
 * @desc Create a new order before payment
 * @access Private (Authenticated User)
 */
router.post('/create-order', isAuth, createOrderController);

/**
 * @route POST /api/payments/process-transaction
 * @desc Initiate payment for an existing order
 * @access Private (Authenticated User)
 */
router.post('/process-transaction', isAuth, processPaymentController);

/**
 * @route POST /api/payments/update-customer-details
 * @desc Update customer details for an order
 * @access Private (Authenticated User)
 */
router.post('/update-customer-details', isAuth, updateCustomerDetailsController);

/**
 * @route GET /api/payments/order/:orderId
 * @desc Get order details by ID
 * @access Private (Authenticated User)
 */
router.get('/order/:orderId', isAuth, getOrderDetailsController);

/**
 * @route GET /api/payments/user/history
 * @desc Get user's payment history
 * @access Private (Authenticated User)
 */
router.get('/user/history', isAuth, getUserPaymentHistoryController);

/**
 * @route GET /api/payments/completed
 * @desc Get all completed payments (Admin only)
 * @access Private (Admin Only)
 */
router.get('/completed', isAuth, authorizeAdmin, getCompletedPayments);

export default router;