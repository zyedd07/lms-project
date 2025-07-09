// controllers/PaymentWebhook.controller.ts
import { Request, Response, NextFunction } from 'express';
import HttpError from '../utils/httpError';
import { handlePaymentWebhook } from '../services/PaymentWebhook.Service'; // Import the webhook service

/**
 * @route POST /webhooks/payment-status/:gatewayName
 * @desc Generic webhook endpoint for payment gateway status updates.
 * Receives server-to-server notifications from payment gateways.
 * @access Public (but secured by signature verification)
 */
export const handlePaymentWebhookController = async (req: Request, res: Response, next: NextFunction) => {
    const { gatewayName } = req.params; // Identify gateway from path
    const rawBody = (req as any).rawBody; // Get the raw body from the express.json() middleware (if configured)
    const headers = req.headers; // Webhook signatures are usually in headers

    console.log(`Received webhook from gateway: ${gatewayName}`);
    console.log('Webhook Headers:', headers);
    // console.log('Webhook Body:', rawBody); // Log raw body for debugging, but be cautious with sensitive data

    try {
        // Call the service to handle the webhook processing
        await handlePaymentWebhook(gatewayName, rawBody, headers);

        // Always respond with a 200 OK to the webhook sender to acknowledge receipt,
        // even if processing fails internally (log the error).
        // This prevents the gateway from retrying unnecessarily.
        res.status(200).json({ success: true, message: 'Webhook received and processing initiated.' });

    } catch (error: any) {
        console.error(`Error processing webhook from ${gatewayName}:`, error);
        // Do NOT send an error status back to the webhook sender unless their documentation
        // explicitly states to do so for certain error types. A 200 OK is standard for receipt.
        // Log the error internally and handle it.
        res.status(200).json({ success: false, message: 'Webhook received but processing failed internally.' });
        // Optionally, pass to next middleware for logging/monitoring if not already handled
        // next(error);
    }
};
