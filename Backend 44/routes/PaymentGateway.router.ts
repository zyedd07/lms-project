// routes/PaymentGateway.router.ts
import express from 'express';
import * as PaymentGatewayController from '../controllers/PaymentGateway.controller';
import isAuth, { authorizeAdmin } from '../middleware/auth'; // Import authorizeAdmin

const router = express.Router();

// Admin routes (require authentication and ADMIN role)
router.post('/settings', isAuth,authorizeAdmin , PaymentGatewayController.createPaymentGatewayController);
router.put('/settings/:id', isAuth, authorizeAdmin, PaymentGatewayController.updatePaymentGatewayController);
router.delete('/settings/:id', isAuth, authorizeAdmin, PaymentGatewayController.deletePaymentGatewayController);
router.get('/settings', isAuth, PaymentGatewayController.getAllPaymentGatewaysController);

// Public/Mobile App route (might not require authentication if settings are generally public)
router.get('/settings/active',isAuth, PaymentGatewayController.getActivePaymentGatewayController);

export default router;
