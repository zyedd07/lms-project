// services/PaymentProcessing.service.ts
import { v4 as uuidv4 } from 'uuid'; // For generating unique transaction IDs
import HttpError from '../utils/httpError';
import Order from '../models/Order.model'; // Import the Order model
import Course from '../models/Course.model'; // Assuming you have a Course model
import TestSeries from '../models/TestSeries.model'; // Assuming you have a TestSeries model
import Qbank from '../models/QuestionBank.model'; // Assuming you have a Qbank model
import Webinar from '../models/webinar.model'; // Assuming you have a Webinar model
import User from '../models/User.model'; // Import the User model
import {
    getPaymentGatewaySettingByIdForBackend, // To get full gateway details including secrets
} from './PaymentGateway.service'; // Import from your existing PaymentGateway service
// Importing only the four specified types from utils/types
import {
    CreateOrderParams,
    OrderCreationResult,
    InitiatePaymentParams,
    PaymentInitiationResult
} from '../utils/types';
import axios from 'axios'; // Import axios for making HTTP requests to PhonePe
import crypto from 'crypto'; // Import crypto for SHA256 hashing

/**
 * Creates a new order record in the database.
 * This is the first step when a user clicks "Enroll Now" for a paid course.
 */
export const createOrder = async (params: CreateOrderParams): Promise<OrderCreationResult> => { // Applied specified types
    const { userId, courseId, testSeriesId, qbankId, webinarId, price } = params;

    let confirmedPrice: number; // Explicitly type as number
    let productType: string; // Explicitly type as string
    let product: any; // Keep as any, as specific model types are not provided

    if (courseId) {
        product = await Course.findByPk(courseId);
        productType = 'course';
    } else if (testSeriesId) {
        product = await TestSeries.findByPk(testSeriesId);
        productType = 'test series';
    } else if (qbankId) {
        product = await Qbank.findByPk(qbankId);
        productType = 'QBank';
    } else if (webinarId) {
        product = await Webinar.findByPk(webinarId);
        productType = 'webinar';
    } else {
        throw new HttpError('No product ID provided for order creation.', 400);
    }

    if (!product) {
        throw new HttpError(`${productType.charAt(0).toUpperCase() + productType.slice(1)} not found.`, 404);
    }

    // --- FIX: Convert product.price to number BEFORE validation ---
    const rawProductPrice = product.price; // Get the raw value from Sequelize
    const productPriceAsNumber = parseFloat(rawProductPrice); // Convert it to a number

    // Now, validate the converted number
    if (typeof productPriceAsNumber !== 'number' || isNaN(productPriceAsNumber)) {
        // Log the problematic value for debugging
        console.error(`DEBUG: Problematic product.price: Value=${rawProductPrice}, Type=${typeof rawProductPrice}`);
        throw new HttpError(`Invalid price defined for ${productType}.`, 500);
    }

    confirmedPrice = productPriceAsNumber; // Use the parsed number for confirmation

    if (parseFloat(price.toString()) !== confirmedPrice) {
        throw new HttpError(`Price mismatch for ${productType}. Expected ${confirmedPrice}, received ${price}.`, 400);
    }

    try {
        // Cast newOrder to any here to allow access to its properties without explicit model typing
        const newOrder: any = await Order.create({
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
    } catch (error: any) {
        console.error('Error creating order:', error);
        if (error instanceof HttpError) {
            throw error;
        }
        throw new HttpError(error.message || 'Failed to create order.', 500);
    }
};


/**
 * Initiates a payment transaction with the selected payment gateway.
 */
export const initiatePayment = async (params: InitiatePaymentParams): Promise<PaymentInitiationResult> => { // Applied specified types
    const { orderId, gatewayName } = params;

    // Cast order to any here to allow access to its properties without explicit model typing
    let order: any = await Order.findByPk(orderId);
    if (!order) {
        throw new HttpError('Order not found.', 404);
    }
    // Access 'status' property directly (now accessible due to 'any' cast)
    if (order.status !== 'created' && order.status !== 'pending') {
        throw new HttpError(`Order status is '${order.status}'. Cannot process payment.`, 400);
    }

    await order.update({ status: 'pending' });

    try {
        const activeGateway = await getPaymentGatewaySettingByIdForBackend(gatewayName);

        // --- DEBUGGING LOG ---
        console.log('DEBUG: activeGateway fetched:', activeGateway);
        console.log('DEBUG: activeGateway.apiKey:', activeGateway.apiKey);
        console.log('DEBUG: activeGateway.apiSecret:', activeGateway.apiSecret ? '***masked***' : 'N/A'); // Mask secret for logs
        console.log('DEBUG: activeGateway.paymentUrl:', activeGateway.paymentUrl);
        console.log('DEBUG: activeGateway.successUrl:', activeGateway.successUrl);
        console.log('DEBUG: activeGateway.failureUrl:', activeGateway.failureUrl);
        // --- END DEBUGGING LOG ---

        if (!activeGateway) {
            throw new HttpError(`Payment gateway '${gatewayName}' not found or not configured for processing.`, 404);
        }

        if (!activeGateway.isActive) {
            throw new HttpError(`Selected payment gateway '${gatewayName}' is not active.`, 400);
        }

        const PHONEPE_MERCHANT_ID = activeGateway.apiKey;
        const PHONEPE_SALT_KEY = activeGateway.apiSecret;
        const PHONEPE_SALT_INDEX = '1';

        // --- Validation check ---
        if (!PHONEPE_MERCHANT_ID || !PHONEPE_SALT_KEY || !activeGateway.paymentUrl || !activeGateway.successUrl || !activeGateway.failureUrl) {
            // This is the error message being thrown
            throw new HttpError('PhonePe gateway configuration is incomplete. Missing API Key, Secret, or URLs.', 500);
        }

        // --- CONSTRUCT CALLBACK URL DYNAMICALLY ---
        
        const merchantTransactionId = `MTID_${uuidv4()}`;
        const amountInPaise = Math.round(order.price * 100);

        let user: any = await User.findByPk(order.userId);
        if (!user || !user.phone) {
            throw new HttpError('User phone number not found for payment processing.', 400);
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
        const checksum = crypto.createHash('sha256').update(stringToHash).digest('hex') + '###' + PHONEPE_SALT_INDEX;

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
            phonePeResponse = await axios.post(activeGateway.paymentUrl, { request: payloadBase64 }, { headers });
            console.log('PhonePe API Response:', phonePeResponse.data);
        } catch (phonePeError: any) {
            console.error('PhonePe API Call Error:', phonePeError.response?.data || phonePeError.message);
            throw new HttpError(phonePeError.response?.data?.message || 'Failed to communicate with payment gateway.', 502);
        }

        if (phonePeResponse.data && phonePeResponse.data.success && phonePeResponse.data.data.instrumentResponse) {
            const redirectUrl = phonePeResponse.data.data.instrumentResponse.redirectInfo.url;
            const phonePeTransactionId = phonePeResponse.data.data.transactionId;

            await order.update({
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
        } else {
            const errorMessage = phonePeResponse.data.message || 'Payment initiation failed with PhonePe.';
            await order.update({
                status: 'failed',
                transactionId: merchantTransactionId,
                gatewayName: activeGateway.gatewayName,
            });
            throw new HttpError(errorMessage, 400);
        }

    } catch (error: any) {
        console.error('Error in initiatePayment service:', error);
        if (order && order.status === 'pending') {
             order.update({
                status: 'failed',
            }).catch((e: any) => console.error("Failed to update order status to failed:", e));
        }
        if (error instanceof HttpError) {
            throw error;
        }
        throw new HttpError(error.message || 'Failed to process payment.', 500);
    }
};
