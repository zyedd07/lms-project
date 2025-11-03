// routes/PaymentProcessing.router.ts
import express from 'express';
import { createOrderController, processPaymentController,getCompletedPayments } from '../controllers/PaymentProcessing.controller';
import isAuth from '../middleware/auth'; // Your authentication middleware

const router = express.Router();

/**
 * @route POST /api/payments/create-order
 * @desc Endpoint for the mobile app to create a new order before payment.
 * @access Private (Authenticated User)
 */
router.post('/create-order',isAuth, createOrderController);

/**
 * @route POST /api/payments/process-transaction
 * @desc Endpoint for the mobile app to initiate payment for an existing order.
 * @access Private (Authenticated User)
 */
router.post('/process-transaction',isAuth, processPaymentController);

router.get('/payments/completed', isAuth, getCompletedPayments);


export default router;
