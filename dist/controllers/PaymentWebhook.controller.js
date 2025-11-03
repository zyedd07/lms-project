"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePaymentWebhookController = void 0;
const PaymentWebhook_Service_1 = require("../services/PaymentWebhook.Service"); // Import the webhook service
/**
 * @route POST /webhooks/payment-status/:gatewayName
 * @desc Generic webhook endpoint for payment gateway status updates.
 * Receives server-to-server notifications from payment gateways.
 * @access Public (but secured by signature verification)
 */
const handlePaymentWebhookController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { gatewayName } = req.params; // Identify gateway from path
    const rawBody = req.rawBody; // Get the raw body from the express.json() middleware (if configured)
    const headers = req.headers; // Webhook signatures are usually in headers
    console.log(`Received webhook from gateway: ${gatewayName}`);
    console.log('Webhook Headers:', headers);
    // console.log('Webhook Body:', rawBody); // Log raw body for debugging, but be cautious with sensitive data
    try {
        // Call the service to handle the webhook processing
        yield (0, PaymentWebhook_Service_1.handlePaymentWebhook)(gatewayName, rawBody, headers);
        // Always respond with a 200 OK to the webhook sender to acknowledge receipt,
        // even if processing fails internally (log the error).
        // This prevents the gateway from retrying unnecessarily.
        res.status(200).json({ success: true, message: 'Webhook received and processing initiated.' });
    }
    catch (error) {
        console.error(`Error processing webhook from ${gatewayName}:`, error);
        // Do NOT send an error status back to the webhook sender unless their documentation
        // explicitly states to do so for certain error types. A 200 OK is standard for receipt.
        // Log the error internally and handle it.
        res.status(200).json({ success: false, message: 'Webhook received but processing failed internally.' });
        // Optionally, pass to next middleware for logging/monitoring if not already handled
        // next(error);
    }
});
exports.handlePaymentWebhookController = handlePaymentWebhookController;
