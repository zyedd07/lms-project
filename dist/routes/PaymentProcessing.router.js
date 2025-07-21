"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/PaymentProcessing.router.ts
const express_1 = __importDefault(require("express"));
const PaymentProcessing_controller_1 = require("../controllers/PaymentProcessing.controller");
const auth_1 = __importDefault(require("../middleware/auth")); // Your authentication middleware
const router = express_1.default.Router();
/**
 * @route POST /api/payments/create-order
 * @desc Endpoint for the mobile app to create a new order before payment.
 * @access Private (Authenticated User)
 */
router.post('/create-order', auth_1.default, PaymentProcessing_controller_1.createOrderController);
/**
 * @route POST /api/payments/process-transaction
 * @desc Endpoint for the mobile app to initiate payment for an existing order.
 * @access Private (Authenticated User)
 */
router.post('/process-transaction', auth_1.default, PaymentProcessing_controller_1.processPaymentController);
router.get('/payments/completed', auth_1.default, PaymentProcessing_controller_1.getCompletedPayments);
exports.default = router;
