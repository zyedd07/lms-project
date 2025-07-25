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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePaymentWebhook = exports.enrollUserInWebinar = exports.enrollUserInTestSeries = exports.enrollUserInQbank = exports.enrollUserInCourse = void 0;
// services/PaymentWebhook.service.ts
const httpError_1 = __importDefault(require("../utils/httpError"));
const Order_model_1 = __importDefault(require("../models/Order.model")); // Import the Order model
const PaymentGateway_service_1 = require("./PaymentGateway.service"); // To get full gateway details including secrets
const crypto_1 = __importDefault(require("crypto")); // For SHA256 hashing
const buffer_1 = require("buffer"); // Node.js Buffer for base64 encoding/decoding
// Import specific enrollment models
const UserCourse_model_1 = __importDefault(require("../models/UserCourse.model")); // Assuming you have this model
const UserQbank_model_1 = __importDefault(require("../models/UserQbank.model")); // Assuming you have this model
const UserTestSeries_model_1 = __importDefault(require("../models/UserTestSeries.model")); // Assuming you have this model
const UserWebinar_model_1 = __importDefault(require("../models/UserWebinar.model")); // Import the UserWebinar model
/**
 * Enrolls a user in a course.
 * @param {EnrollInCourseServiceParams} params - userId and courseId.
 * @returns {Promise<any>} The new enrollment record.
 */
const enrollUserInCourse = (_a) => __awaiter(void 0, [_a], void 0, function* ({ userId, courseId }) {
    // Check if the enrollment already exists
    const existingEnrollment = yield UserCourse_model_1.default.findOne({
        where: { userId, courseId }
    });
    if (existingEnrollment) {
        throw new httpError_1.default("User is already enrolled in this course.", 409); // 409 Conflict
    }
    // The status will default to 'active' based on the model definition.
    const newEnrollment = yield UserCourse_model_1.default.create({ userId, courseId });
    return newEnrollment;
});
exports.enrollUserInCourse = enrollUserInCourse;
/**
 * Enrolls a user in a Q-Bank.
 * @param {EnrollInQbankServiceParams} params - userId and qbankId.
 * @returns {Promise<any>} The new enrollment record.
 */
const enrollUserInQbank = (_a) => __awaiter(void 0, [_a], void 0, function* ({ userId, qbankId }) {
    const existingEnrollment = yield UserQbank_model_1.default.findOne({
        where: { userId, qbankId }
    });
    if (existingEnrollment) {
        throw new httpError_1.default("User is already enrolled in this Q-Bank.", 409);
    }
    const newEnrollment = yield UserQbank_model_1.default.create({ userId, qbankId });
    return newEnrollment;
});
exports.enrollUserInQbank = enrollUserInQbank;
/**
 * Enrolls a user in a Test Series.
 * @param {object} params - userId and testSeriesId.
 * @returns {Promise<any>} The new enrollment record.
 */
const enrollUserInTestSeries = (_a) => __awaiter(void 0, [_a], void 0, function* ({ userId, testSeriesId }) {
    const existingEnrollment = yield UserTestSeries_model_1.default.findOne({
        where: { userId, testSeriesId }
    });
    if (existingEnrollment) {
        throw new httpError_1.default("User is already enrolled in this test series.", 409);
    }
    const newEnrollment = yield UserTestSeries_model_1.default.create({ userId, testSeriesId });
    return newEnrollment;
});
exports.enrollUserInTestSeries = enrollUserInTestSeries;
/**
 * Enrolls a user in a Webinar.
 * @param {EnrollInWebinarServiceParams} params - userId and webinarId.
 * @returns {Promise<any>} The new enrollment record.
 */
const enrollUserInWebinar = (_a) => __awaiter(void 0, [_a], void 0, function* ({ userId, webinarId }) {
    // Check if the enrollment already exists
    const existingEnrollment = yield UserWebinar_model_1.default.findOne({
        where: { userId, webinarId }
    });
    if (existingEnrollment) {
        throw new httpError_1.default("User is already enrolled in this webinar.", 409); // 409 Conflict
    }
    // The status will default to 'active' or similar based on the UserWebinar model definition.
    const newEnrollment = yield UserWebinar_model_1.default.create({ userId, webinarId });
    return newEnrollment;
});
exports.enrollUserInWebinar = enrollUserInWebinar;
/**
 * Handles incoming payment gateway webhooks.
 * Verifies the signature, parses the payload, updates order status, and enrolls user in product.
 * @param gatewayName - The name of the payment gateway (e.g., 'phonepe')
 * @param rawBody - The raw request body (needed for signature verification)
 * @param headers - The request headers (where signature is usually found)
 */
const handlePaymentWebhook = (gatewayName, rawBody, headers) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Processing webhook for ${gatewayName}`);
    try {
        // 1. Fetch Payment Gateway Settings for verification
        const gatewaySetting = yield (0, PaymentGateway_service_1.getPaymentGatewaySettingByIdForBackend)(gatewayName);
        if (!gatewaySetting || !gatewaySetting.apiSecret) {
            throw new httpError_1.default(`Payment gateway '${gatewayName}' not configured or missing API secret for webhook verification.`, 400);
        }
        const PHONEPE_SALT_KEY = gatewaySetting.apiSecret; // The salt key is stored as apiSecret
        const PHONEPE_SALT_INDEX = '1'; // Assuming a fixed salt index for PhonePe, or store in settings
        // 2. Verify Webhook Signature (PhonePe specific example)
        const xVerifyHeader = headers['x-verify']; // PhonePe sends signature in X-VERIFY header
        const base64EncodedBody = buffer_1.Buffer.from(JSON.stringify(rawBody)).toString('base64'); // PhonePe expects base64 of the JSON body
        // The string to hash for PhonePe webhook verification is typically:
        // Base64(JSON.stringify(response_body)) + endpoint_path + SALT_KEY
        // For webhooks, the endpoint_path might be different than the pay API.
        // PhonePe's documentation for webhook verification usually specifies the exact string.
        // For simplicity, assuming it's just the base64 body + salt key for now, or you might need a specific path.
        // Refer to PhonePe's official webhook verification docs for the exact string.
        const stringToHash = base64EncodedBody + '/pg/v1/status' + PHONEPE_SALT_KEY; // Example path, verify with PhonePe docs
        const expectedChecksum = crypto_1.default.createHash('sha256').update(stringToHash).digest('hex') + '###' + PHONEPE_SALT_INDEX;
        if (xVerifyHeader !== expectedChecksum) {
            console.warn(`Webhook signature mismatch for ${gatewayName}. Expected: ${expectedChecksum}, Received: ${xVerifyHeader}`);
            throw new httpError_1.default('Webhook signature verification failed.', 403);
        }
        console.log('Webhook signature verified successfully.');
        // 3. Parse Webhook Payload (PhonePe specific)
        const phonePeWebhookData = rawBody.response; // PhonePe often sends the actual data in a 'response' field
        if (!phonePeWebhookData || typeof phonePeWebhookData !== 'string') {
            throw new httpError_1.default('Invalid PhonePe webhook payload format.', 400);
        }
        const decodedPayload = JSON.parse(buffer_1.Buffer.from(phonePeWebhookData, 'base64').toString('utf8'));
        console.log('Decoded PhonePe Webhook Payload:', decodedPayload);
        const merchantTransactionId = decodedPayload.data.merchantTransactionId; // Your internal order ID
        const phonePeTransactionId = decodedPayload.data.transactionId; // PhonePe's transaction ID
        const paymentCode = decodedPayload.code; // e.g., 'PAYMENT_SUCCESS', 'PAYMENT_ERROR'
        const paymentState = decodedPayload.data.state; // e.g., 'COMPLETED', 'FAILED', 'PENDING'
        // 4. Find the Order in your database
        // We use merchantTransactionId because that's what we stored as 'transactionId' in our Order model
        const order = yield Order_model_1.default.findOne({ where: { transactionId: merchantTransactionId, gatewayName: gatewayName } });
        if (!order) {
            console.warn(`Order not found for merchantTransactionId: ${merchantTransactionId} from ${gatewayName}.`);
            throw new httpError_1.default('Order not found for webhook update.', 404);
        }
        // Prevent reprocessing already completed/failed orders
        if (order.status === 'completed' || order.status === 'failed') {
            console.log(`Order ${order.id} already in final status: ${order.status}. Skipping update.`);
            return; // Acknowledge webhook but do nothing
        }
        // 5. Update Order Status and Enroll User
        let newOrderStatus;
        let message = '';
        if (paymentCode === 'PAYMENT_SUCCESS' && paymentState === 'COMPLETED') {
            newOrderStatus = 'completed';
            message = 'Payment successfully completed.';
            console.log(`Payment successful for Order ${order.id}. Enrolling user.`);
            // Enroll user in the respective product using the imported functions
            if (order.courseId) {
                yield (0, exports.enrollUserInCourse)({ userId: order.userId, courseId: order.courseId });
            }
            else if (order.testSeriesId) {
                yield (0, exports.enrollUserInTestSeries)({ userId: order.userId, testSeriesId: order.testSeriesId });
            }
            else if (order.qbankId) {
                yield (0, exports.enrollUserInQbank)({ userId: order.userId, qbankId: order.qbankId });
            }
            else if (order.webinarId) {
                // Use the newly defined enrollUserInWebinar function
                yield (0, exports.enrollUserInWebinar)({ userId: order.userId, webinarId: order.webinarId });
            }
            // You might also send a success notification to the user
        }
        else if (paymentCode === 'PAYMENT_ERROR' || paymentState === 'FAILED') {
            newOrderStatus = 'failed';
            message = `Payment failed: ${decodedPayload.message || 'Unknown reason'}`;
            console.log(`Payment failed for Order ${order.id}.`);
            // You might send a failure notification to the user
        }
        else {
            // Handle other states like PENDING, REFUND, etc. based on your needs
            newOrderStatus = 'pending'; // Or a more specific status like 'processing_webhook'
            message = `Payment status: ${paymentState}.`;
            console.log(`Payment for Order ${order.id} is ${paymentState}.`);
        }
        yield order.update({
            status: newOrderStatus,
            // You might store PhonePe's transaction ID separately if needed
            // phonePeTransactionId: phonePeTransactionId,
            // You can also store the full webhook payload for debugging/auditing
            // webhookPayload: rawBody,
        });
        console.log(`Order ${order.id} status updated to ${newOrderStatus}. Message: ${message}`);
    }
    catch (error) {
        console.error('Error in handlePaymentWebhook:', error);
        // Re-throw HttpError or log for internal monitoring.
        // The controller will respond with 200 OK regardless, as per webhook best practices.
        if (error instanceof httpError_1.default) {
            throw error;
        }
        throw new httpError_1.default(error.message || 'Internal server error during webhook processing.', 500);
    }
});
exports.handlePaymentWebhook = handlePaymentWebhook;
