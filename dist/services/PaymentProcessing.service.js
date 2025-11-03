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
exports.initiatePayment = exports.createOrder = void 0;
// services/PaymentProcessing.service.ts
const uuid_1 = require("uuid"); // For generating unique transaction IDs
const httpError_1 = __importDefault(require("../utils/httpError"));
const Order_model_1 = __importDefault(require("../models/Order.model")); // Import the Order model
const Course_model_1 = __importDefault(require("../models/Course.model")); // Assuming you have a Course model
const TestSeries_model_1 = __importDefault(require("../models/TestSeries.model")); // Assuming you have a TestSeries model
const QuestionBank_model_1 = __importDefault(require("../models/QuestionBank.model")); // Assuming you have a Qbank model
const webinar_model_1 = __importDefault(require("../models/webinar.model")); // Assuming you have a Webinar model
const User_model_1 = __importDefault(require("../models/User.model")); // Import the User model
const PaymentGateway_service_1 = require("./PaymentGateway.service"); // Import from your existing PaymentGateway service
const axios_1 = __importDefault(require("axios")); // Import axios for making HTTP requests to PhonePe
const crypto_1 = __importDefault(require("crypto")); // Import crypto for SHA256 hashing
/**
 * Creates a new order record in the database.
 * This is the first step when a user clicks "Enroll Now" for a paid course.
 */
const createOrder = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, courseId, testSeriesId, qbankId, webinarId, price } = params;
    let confirmedPrice; // Explicitly type as number
    let productType; // Explicitly type as string
    let product; // Keep as any, as specific model types are not provided
    if (courseId) {
        product = yield Course_model_1.default.findByPk(courseId);
        productType = 'course';
    }
    else if (testSeriesId) {
        product = yield TestSeries_model_1.default.findByPk(testSeriesId);
        productType = 'test series';
    }
    else if (qbankId) {
        product = yield QuestionBank_model_1.default.findByPk(qbankId);
        productType = 'QBank';
    }
    else if (webinarId) {
        product = yield webinar_model_1.default.findByPk(webinarId);
        productType = 'webinar';
    }
    else {
        throw new httpError_1.default('No product ID provided for order creation.', 400);
    }
    if (!product) {
        throw new httpError_1.default(`${productType.charAt(0).toUpperCase() + productType.slice(1)} not found.`, 404);
    }
    // --- FIX: Convert product.price to number BEFORE validation ---
    const rawProductPrice = product.price; // Get the raw value from Sequelize
    const productPriceAsNumber = parseFloat(rawProductPrice); // Convert it to a number
    // Now, validate the converted number
    if (typeof productPriceAsNumber !== 'number' || isNaN(productPriceAsNumber)) {
        // Log the problematic value for debugging
        console.error(`DEBUG: Problematic product.price: Value=${rawProductPrice}, Type=${typeof rawProductPrice}`);
        throw new httpError_1.default(`Invalid price defined for ${productType}.`, 500);
    }
    confirmedPrice = productPriceAsNumber; // Use the parsed number for confirmation
    if (parseFloat(price.toString()) !== confirmedPrice) {
        throw new httpError_1.default(`Price mismatch for ${productType}. Expected ${confirmedPrice}, received ${price}.`, 400);
    }
    try {
        // Cast newOrder to any here to allow access to its properties without explicit model typing
        const newOrder = yield Order_model_1.default.create({
            userId,
            courseId,
            testSeriesId,
            qbankId,
            webinarId,
            price: confirmedPrice,
            status: 'created',
        });
        return {
            success: true,
            message: 'Order created successfully.',
            orderId: newOrder.id, // Now accessible due to 'any' cast
            confirmedPrice: parseFloat(newOrder.price.toString()), // Now accessible due to 'any' cast
        };
    }
    catch (error) {
        console.error('Error creating order:', error);
        if (error instanceof httpError_1.default) {
            throw error;
        }
        throw new httpError_1.default(error.message || 'Failed to create order.', 500);
    }
});
exports.createOrder = createOrder;
/**
 * Initiates a payment transaction with the selected payment gateway.
 */
const initiatePayment = (params) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { orderId, gatewayName } = params;
    // Cast order to any here to allow access to its properties without explicit model typing
    let order = yield Order_model_1.default.findByPk(orderId);
    if (!order) {
        throw new httpError_1.default('Order not found.', 404);
    }
    // Access 'status' property directly (now accessible due to 'any' cast)
    if (order.status !== 'created' && order.status !== 'pending') {
        throw new httpError_1.default(`Order status is '${order.status}'. Cannot process payment.`, 400);
    }
    yield order.update({ status: 'pending' });
    try {
        const activeGateway = yield (0, PaymentGateway_service_1.getPaymentGatewaySettingByIdForBackend)(gatewayName);
        // --- DEBUGGING LOG ---
        console.log('DEBUG: activeGateway fetched:', activeGateway);
        console.log('DEBUG: activeGateway.apiKey:', activeGateway.apiKey);
        console.log('DEBUG: activeGateway.apiSecret:', activeGateway.apiSecret ? '***masked***' : 'N/A'); // Mask secret for logs
        console.log('DEBUG: activeGateway.paymentUrl:', activeGateway.paymentUrl);
        console.log('DEBUG: activeGateway.successUrl:', activeGateway.successUrl);
        console.log('DEBUG: activeGateway.failureUrl:', activeGateway.failureUrl);
        // --- END DEBUGGING LOG ---
        if (!activeGateway) {
            throw new httpError_1.default(`Payment gateway '${gatewayName}' not found or not configured for processing.`, 404);
        }
        if (!activeGateway.isActive) {
            throw new httpError_1.default(`Selected payment gateway '${gatewayName}' is not active.`, 400);
        }
        const PHONEPE_MERCHANT_ID = activeGateway.apiKey;
        const PHONEPE_SALT_KEY = activeGateway.apiSecret;
        const PHONEPE_SALT_INDEX = '1';
        // --- Validation check ---
        if (!PHONEPE_MERCHANT_ID || !PHONEPE_SALT_KEY || !activeGateway.paymentUrl || !activeGateway.successUrl || !activeGateway.failureUrl) {
            // This is the error message being thrown
            throw new httpError_1.default('PhonePe gateway configuration is incomplete. Missing API Key, Secret, or URLs.', 500);
        }
        // --- CONSTRUCT CALLBACK URL DYNAMICALLY ---
        const merchantTransactionId = `MTID_${(0, uuid_1.v4)()}`;
        const amountInPaise = Math.round(order.price * 100);
        let user = yield User_model_1.default.findByPk(order.userId);
        if (!user || !user.phone) {
            throw new httpError_1.default('User phone number not found for payment processing.', 400);
        }
        const userMobileNumber = user.phone;
        const payload = {
            merchantId: PHONEPE_MERCHANT_ID,
            merchantTransactionId: merchantTransactionId,
            merchantUserId: order.userId,
            amount: amountInPaise,
            redirectUrl: activeGateway.successUrl,
            redirectMode: 'REDIRECT',
            callbackUrl: activeGateway.failureUrl, // Use the dynamically constructed callbackUrl
            mobileNumber: userMobileNumber,
            paymentInstrument: {
                type: 'PAY_PAGE'
            }
        };
        const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64');
        const stringToHash = payloadBase64 + '/pg/v1/pay' + PHONEPE_SALT_KEY;
        const checksum = crypto_1.default.createHash('sha256').update(stringToHash).digest('hex') + '###' + PHONEPE_SALT_INDEX;
        const headers = {
            'Content-Type': 'application/json',
            'X-VERIFY': checksum,
            'X-MERCHANT-ID': PHONEPE_MERCHANT_ID,
            'accept': 'application/json'
        };
        console.log('PhonePe Request Payload:', JSON.stringify(payload, null, 2));
        console.log('PhonePe Request Headers:', headers);
        let phonePeResponse;
        try {
            phonePeResponse = yield axios_1.default.post(activeGateway.paymentUrl, { request: payloadBase64 }, { headers });
            console.log('PhonePe API Response:', phonePeResponse.data);
        }
        catch (phonePeError) {
            console.error('PhonePe API Call Error:', ((_a = phonePeError.response) === null || _a === void 0 ? void 0 : _a.data) || phonePeError.message);
            throw new httpError_1.default(((_c = (_b = phonePeError.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || 'Failed to communicate with payment gateway.', 502);
        }
        if (phonePeResponse.data && phonePeResponse.data.success && phonePeResponse.data.data.instrumentResponse) {
            const redirectUrl = phonePeResponse.data.data.instrumentResponse.redirectInfo.url;
            const phonePeTransactionId = phonePeResponse.data.data.transactionId;
            yield order.update({
                status: 'pending',
                transactionId: phonePeTransactionId,
                gatewayName: activeGateway.gatewayName,
            });
            return {
                success: true,
                message: 'Payment initiated successfully. Redirecting to PhonePe.',
                redirectUrl: redirectUrl,
                transactionId: phonePeTransactionId,
                orderId: order.id,
            };
        }
        else {
            const errorMessage = phonePeResponse.data.message || 'Payment initiation failed with PhonePe.';
            yield order.update({
                status: 'failed',
                transactionId: merchantTransactionId,
                gatewayName: activeGateway.gatewayName,
            });
            throw new httpError_1.default(errorMessage, 400);
        }
    }
    catch (error) {
        console.error('Error in initiatePayment service:', error);
        if (order && order.status === 'pending') {
            order.update({
                status: 'failed',
            }).catch((e) => console.error("Failed to update order status to failed:", e));
        }
        if (error instanceof httpError_1.default) {
            throw error;
        }
        throw new httpError_1.default(error.message || 'Failed to process payment.', 500);
    }
});
exports.initiatePayment = initiatePayment;
