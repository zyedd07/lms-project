"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/PaymentWebhook.router.ts
const express_1 = __importDefault(require("express"));
const PaymentWebhook_controller_1 = require("../controllers/PaymentWebhook.controller");
const router = express_1.default.Router();
/**
 * @route POST /webhooks/payment-status/:gatewayName
 * @desc Endpoint for payment gateways to send status updates.
 * This endpoint should be public as it's called by the payment gateway.
 * Security is handled by signature verification within the controller/service.
 */
router.post('/payment-status/:gatewayName', PaymentWebhook_controller_1.handlePaymentWebhookController);
exports.default = router;
