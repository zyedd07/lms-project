// services/PaymentWebhook.service.ts
import HttpError from '../utils/httpError';
import Order from '../models/Order.model'; // Import the Order model
import { getPaymentGatewaySettingByIdForBackend } from './PaymentGateway.service'; // To get full gateway details including secrets
import crypto from 'crypto'; // For SHA256 hashing
import { Buffer } from 'buffer'; // Node.js Buffer for base64 encoding/decoding

// Import specific enrollment models
import UserCourse from '../models/UserCourse.model'; // Assuming you have this model
import UserQbank from '../models/UserQbank.model'; // Assuming you have this model
import UserTestSeries from '../models/UserTestSeries.model'; // Assuming you have this model
import UserWebinar from '../models/UserWebinar.model'; // Import the UserWebinar model

// Import enrollment types from utils/types
import { EnrollInCourseServiceParams, EnrollInQbankServiceParams, EnrollInWebinarServiceParams } from '../utils/types';


/**
 * Enrolls a user in a course.
 * @param {EnrollInCourseServiceParams} params - userId and courseId.
 * @returns {Promise<any>} The new enrollment record.
 */
export const enrollUserInCourse = async ({ userId, courseId }: EnrollInCourseServiceParams) => {
    // Check if the enrollment already exists
    const existingEnrollment = await UserCourse.findOne({
        where: { userId, courseId }
    });

    if (existingEnrollment) {
        throw new HttpError("User is already enrolled in this course.", 409); // 409 Conflict
    }

    // The status will default to 'active' based on the model definition.
    const newEnrollment = await UserCourse.create({ userId, courseId });
    return newEnrollment;
};

/**
 * Enrolls a user in a Q-Bank.
 * @param {EnrollInQbankServiceParams} params - userId and qbankId.
 * @returns {Promise<any>} The new enrollment record.
 */
export const enrollUserInQbank = async ({ userId, qbankId }: EnrollInQbankServiceParams) => {
    const existingEnrollment = await UserQbank.findOne({
        where: { userId, qbankId }
    });

    if (existingEnrollment) {
        throw new HttpError("User is already enrolled in this Q-Bank.", 409);
    }

    const newEnrollment = await UserQbank.create({ userId, qbankId });
    return newEnrollment;
};

/**
 * Enrolls a user in a Test Series.
 * @param {object} params - userId and testSeriesId.
 * @returns {Promise<any>} The new enrollment record.
 */
export const enrollUserInTestSeries = async ({ userId, testSeriesId }: { userId: string, testSeriesId: string }) => {
    const existingEnrollment = await UserTestSeries.findOne({
        where: { userId, testSeriesId }
    });

    if (existingEnrollment) {
        throw new HttpError("User is already enrolled in this test series.", 409);
    }

    const newEnrollment = await UserTestSeries.create({ userId, testSeriesId });
    return newEnrollment;
};

/**
 * Enrolls a user in a Webinar.
 * @param {EnrollInWebinarServiceParams} params - userId and webinarId.
 * @returns {Promise<any>} The new enrollment record.
 */
export const enrollUserInWebinar = async ({ userId, webinarId }: EnrollInWebinarServiceParams) => {
    // Check if the enrollment already exists
    const existingEnrollment = await UserWebinar.findOne({
        where: { userId, webinarId }
    });

    if (existingEnrollment) {
        throw new HttpError("User is already enrolled in this webinar.", 409); // 409 Conflict
    }

    // The status will default to 'active' or similar based on the UserWebinar model definition.
    const newEnrollment = await UserWebinar.create({ userId, webinarId });
    return newEnrollment;
};


/**
 * Handles incoming payment gateway webhooks.
 * Verifies the signature, parses the payload, updates order status, and enrolls user in product.
 * @param gatewayName - The name of the payment gateway (e.g., 'phonepe')
 * @param rawBody - The raw request body (needed for signature verification)
 * @param headers - The request headers (where signature is usually found)
 */
export const handlePaymentWebhook = async (gatewayName: string, rawBody: any, headers: any): Promise<void> => {
    console.log(`Processing webhook for ${gatewayName}`);

    try {
        // 1. Fetch Payment Gateway Settings for verification
        const gatewaySetting = await getPaymentGatewaySettingByIdForBackend(gatewayName);

        if (!gatewaySetting || !gatewaySetting.apiSecret) {
            throw new HttpError(`Payment gateway '${gatewayName}' not configured or missing API secret for webhook verification.`, 400);
        }

        const PHONEPE_SALT_KEY = gatewaySetting.apiSecret; // The salt key is stored as apiSecret
        const PHONEPE_SALT_INDEX = '1'; // Assuming a fixed salt index for PhonePe, or store in settings

        // 2. Verify Webhook Signature (PhonePe specific example)
        const xVerifyHeader = headers['x-verify']; // PhonePe sends signature in X-VERIFY header
        const base64EncodedBody = Buffer.from(JSON.stringify(rawBody)).toString('base64'); // PhonePe expects base64 of the JSON body

        // The string to hash for PhonePe webhook verification is typically:
        // Base64(JSON.stringify(response_body)) + endpoint_path + SALT_KEY
        // For webhooks, the endpoint_path might be different than the pay API.
        // PhonePe's documentation for webhook verification usually specifies the exact string.
        // For simplicity, assuming it's just the base64 body + salt key for now, or you might need a specific path.
        // Refer to PhonePe's official webhook verification docs for the exact string.
        const stringToHash = base64EncodedBody + '/pg/v1/status' + PHONEPE_SALT_KEY; // Example path, verify with PhonePe docs
        const expectedChecksum = crypto.createHash('sha256').update(stringToHash).digest('hex') + '###' + PHONEPE_SALT_INDEX;

        if (xVerifyHeader !== expectedChecksum) {
            console.warn(`Webhook signature mismatch for ${gatewayName}. Expected: ${expectedChecksum}, Received: ${xVerifyHeader}`);
            throw new HttpError('Webhook signature verification failed.', 403);
        }
        console.log('Webhook signature verified successfully.');

        // 3. Parse Webhook Payload (PhonePe specific)
        const phonePeWebhookData = rawBody.response; // PhonePe often sends the actual data in a 'response' field
        if (!phonePeWebhookData || typeof phonePeWebhookData !== 'string') {
            throw new HttpError('Invalid PhonePe webhook payload format.', 400);
        }

        const decodedPayload = JSON.parse(Buffer.from(phonePeWebhookData, 'base64').toString('utf8'));
        console.log('Decoded PhonePe Webhook Payload:', decodedPayload);

        const merchantTransactionId = decodedPayload.data.merchantTransactionId; // Your internal order ID
        const phonePeTransactionId = decodedPayload.data.transactionId; // PhonePe's transaction ID
        const paymentCode = decodedPayload.code; // e.g., 'PAYMENT_SUCCESS', 'PAYMENT_ERROR'
        const paymentState = decodedPayload.data.state; // e.g., 'COMPLETED', 'FAILED', 'PENDING'

        // 4. Find the Order in your database
        // We use merchantTransactionId because that's what we stored as 'transactionId' in our Order model
        const order: any = await Order.findOne({ where: { transactionId: merchantTransactionId, gatewayName: gatewayName } });

        if (!order) {
            console.warn(`Order not found for merchantTransactionId: ${merchantTransactionId} from ${gatewayName}.`);
            throw new HttpError('Order not found for webhook update.', 404);
        }

        // Prevent reprocessing already completed/failed orders
        if (order.status === 'completed' || order.status === 'failed') {
            console.log(`Order ${order.id} already in final status: ${order.status}. Skipping update.`);
            return; // Acknowledge webhook but do nothing
        }

        // 5. Update Order Status and Enroll User
        let newOrderStatus: 'completed' | 'failed' | 'pending';
        let message = '';

        if (paymentCode === 'PAYMENT_SUCCESS' && paymentState === 'COMPLETED') {
            newOrderStatus = 'completed';
            message = 'Payment successfully completed.';
            console.log(`Payment successful for Order ${order.id}. Enrolling user.`);

            // Enroll user in the respective product using the imported functions
            if (order.courseId) {
                await enrollUserInCourse({ userId: order.userId, courseId: order.courseId });
            } else if (order.testSeriesId) {
                await enrollUserInTestSeries({ userId: order.userId, testSeriesId: order.testSeriesId });
            } else if (order.qbankId) {
                await enrollUserInQbank({ userId: order.userId, qbankId: order.qbankId });
            } else if (order.webinarId) {
                // Use the newly defined enrollUserInWebinar function
                await enrollUserInWebinar({ userId: order.userId, webinarId: order.webinarId });
            }
            // You might also send a success notification to the user
        } else if (paymentCode === 'PAYMENT_ERROR' || paymentState === 'FAILED') {
            newOrderStatus = 'failed';
            message = `Payment failed: ${decodedPayload.message || 'Unknown reason'}`;
            console.log(`Payment failed for Order ${order.id}.`);
            // You might send a failure notification to the user
        } else {
            // Handle other states like PENDING, REFUND, etc. based on your needs
            newOrderStatus = 'pending'; // Or a more specific status like 'processing_webhook'
            message = `Payment status: ${paymentState}.`;
            console.log(`Payment for Order ${order.id} is ${paymentState}.`);
        }

        await order.update({
            status: newOrderStatus,
            // You might store PhonePe's transaction ID separately if needed
            // phonePeTransactionId: phonePeTransactionId,
            // You can also store the full webhook payload for debugging/auditing
            // webhookPayload: rawBody,
        });

        console.log(`Order ${order.id} status updated to ${newOrderStatus}. Message: ${message}`);

    } catch (error: any) {
        console.error('Error in handlePaymentWebhook:', error);
        // Re-throw HttpError or log for internal monitoring.
        // The controller will respond with 200 OK regardless, as per webhook best practices.
        if (error instanceof HttpError) {
            throw error;
        }
        throw new HttpError(error.message || 'Internal server error during webhook processing.', 500);
    }
};
