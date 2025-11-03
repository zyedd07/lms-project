// routes/PaymentWebhook.router.ts
import express from 'express';
import { handlePaymentWebhookController } from '../controllers/PaymentWebhook.controller';

const router = express.Router();

/**
 * @route POST /webhooks/payment-status/:gatewayName
 * @desc Endpoint for payment gateways to send status updates.
 * This endpoint should be public as it's called by the payment gateway.
 * Security is handled by signature verification within the controller/service.
 */
router.post('/payment-status/:gatewayName', handlePaymentWebhookController);

export default router;
