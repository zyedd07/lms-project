// services/PaymentProcessing.service.ts (Updated with QR code generation and fix)
import HttpError from '../utils/httpError';
import Order from '../models/Order.model';
import Payment from '../models/Payment.model';
import Course from '../models/Course.model';
import Qbank from '../models/QuestionBank.model';
import TestSeries from '../models/TestSeries.model';
import Webinar from '../models/webinar.model';
import User from '../models/User.model';
import PaymentGatewaySetting from '../models/PaymentGatewaySetting.model';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';

interface CreateOrderInput {
    userId: string;
    courseId?: string;
    testSeriesId?: string;
    qbankId?: string;
    webinarId?: string;
    price: number;
}

interface InitiatePaymentInput {
    orderId: string;
    gatewayName: string;
}

/**
 * Service to create a new order for a product.
 * Validates product exists, price matches, and creates order record.
 */
export const createOrder = async (input: CreateOrderInput) => {
    const { userId, courseId, testSeriesId, qbankId, webinarId, price } = input;

    // Validate user exists
    const user = await User.findByPk(userId);
    if (!user) {
        throw new HttpError('User not found.', 404);
    }

    // Determine product type and validate
    let productId: string;
    let productType: string;
    let actualPrice: number;
    let productName: string;

    if (courseId) {
        const course = await Course.findByPk(courseId);
        if (!course) throw new HttpError('Course not found.', 404);
        productId = courseId;
        productType = 'course';
        actualPrice = parseFloat(course.get('price') as string);
        productName = course.get('name') as string;
    } else if (testSeriesId) {
        const testSeries = await TestSeries.findByPk(testSeriesId);
        if (!testSeries) throw new HttpError('Test Series not found.', 404);
        productId = testSeriesId;
        productType = 'testSeries';
        actualPrice = parseFloat(testSeries.get('price') as string);
        productName = testSeries.get('name') as string;
    } else if (qbankId) {
        const qbank = await Qbank.findByPk(qbankId);
        if (!qbank) throw new HttpError('Question Bank not found.', 404);
        productId = qbankId;
        productType = 'qbank';
        actualPrice = parseFloat(qbank.get('price') as string);
        productName = qbank.get('name') as string;
    } else if (webinarId) {
        const webinar = await Webinar.findByPk(webinarId);
        if (!webinar) throw new HttpError('Webinar not found.', 404);
        productId = webinarId;
        productType = 'webinar';
        actualPrice = parseFloat(webinar.get('price') as any);
        productName = webinar.get('title') as string;
    } else {
        throw new HttpError('No valid product ID provided.', 400);
    }

    // Validate price matches (with small tolerance for floating point)
    if (Math.abs(actualPrice - price) > 0.01) {
        throw new HttpError(
            `Price mismatch. Expected ${actualPrice}, received ${price}.`,
            400
        );
    }

    // Check if user already has a pending order for this product
    const existingOrder = await Order.findOne({
        where: {
            userId,
            [productType + 'Id']: productId,
            status: 'pending'
        }
    });

    if (existingOrder) {
        // Return existing order instead of creating duplicate
        return {
            message: 'Order already exists for this product.',
            orderId: existingOrder.get('id') as string,
            confirmedPrice: parseFloat(existingOrder.get('amount') as string),
        };
    }

    // Create new order
    const newOrder = await Order.create({
        id: uuidv4(),
        userId,
        [productType + 'Id']: productId,
        amount: actualPrice,
        status: 'pending',
        productType,
        productName,
    });

    console.log(`Order created successfully: ${newOrder.get('id')} for user ${userId}`);

    return {
        message: 'Order created successfully.',
        orderId: newOrder.get('id') as string,
        confirmedPrice: actualPrice,
    };
};

/**
 * Generate UPI QR Code
 */
const generateUpiQrCode = async (
    merchantUpiId: string,
    merchantName: string,
    amount: number | string, // Relax the type to string | number for safety
    transactionId: string,
    orderNumber: string,
    currency: string = 'INR'
): Promise<string> => {
    try {
        // 🔑 FIX 1: Convert amount to a number to ensure .toFixed() works.
        const numericAmount = parseFloat(amount as any); 

        // Create UPI deep link string
        const upiString = `upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(merchantName)}&am=${numericAmount.toFixed(2)}&cu=${currency}&tn=${encodeURIComponent(`Order ${orderNumber} - ${transactionId}`)}`;
        
        // Generate QR code as base64 data URL
        const qrCodeDataUrl = await QRCode.toDataURL(upiString, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 300,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        return qrCodeDataUrl;
    } catch (error) {
        // Renamed error variable in console output for clarity
        console.error('Error generating QR code:', error); 
        throw new HttpError('Failed to generate QR code', 500);
    }
};

/**
 * Service to initiate payment for an existing order.
 * Creates payment record, generates QR code, and returns transaction details.
 */
export const initiatePayment = async (input: InitiatePaymentInput) => {
    const { orderId, gatewayName } = input;

    // Validate order exists and is pending
    const order = await Order.findByPk(orderId);
    if (!order) {
        throw new HttpError('Order not found.', 404);
    }

    if (order.get('status') !== 'pending') {
        throw new HttpError('Order is not in pending status.', 400);
    }

    // Validate gateway exists and is active
    const gateway = await PaymentGatewaySetting.findOne({
        where: { gatewayName, isActive: true }
    });

    if (!gateway) {
        throw new HttpError('Payment gateway not found or inactive.', 400);
    }

    // Get merchant details from gateway settings
    const merchantUpiId = gateway.get('merchantUpiId') as string;
    const merchantName = gateway.get('merchantName') as string;
    const currency = gateway.get('currency') as string || 'INR';

    if (!merchantUpiId || !merchantName) {
        throw new HttpError('Payment gateway configuration incomplete. Missing UPI details.', 500);
    }

    // Generate unique transaction ID
    const transactionId = `TXN_${Date.now()}_${uuidv4().substring(0, 8)}`;
    
    // Retrieve amount from order
    const orderAmount = order.get('amount'); 
    // 🔑 FIX 2: Convert the order amount to a number for safe use with toFixed()
    const numericOrderAmount = parseFloat(orderAmount as any); 
    
    if (isNaN(numericOrderAmount) || numericOrderAmount <= 0) {
         throw new HttpError('Invalid order amount.', 400);
    }

    // Generate QR code
    const qrCodeDataUrl = await generateUpiQrCode(
        merchantUpiId,
        merchantName,
        numericOrderAmount, // Pass the converted numeric amount
        transactionId,
        orderId,
        currency
    );

    // Create payment record
    const payment = await Payment.create({
        id: uuidv4(),
        userId: order.get('userId') as string,
        orderId: orderId,
        courseId: order.get('courseId') as string | null,
        testSeriesId: order.get('testSeriesId') as string | null,
        qbankId: order.get('qbankId') as string | null,
        webinarId: order.get('webinarId') as string | null,
        amount: numericOrderAmount, // Store the numeric amount
        gatewayName,
        transactionId,
        status: 'pending',
    });

    console.log(`Payment initiated: ${transactionId} for order ${orderId}`);

    return {
        message: 'Payment initiated. Please complete payment via UPI.',
        transactionId,
        orderId,
        amount: numericOrderAmount,
        currency,
        qrCodeDataUrl, // Base64 QR code image
        merchantUpiId,
        merchantName,
        // 🔑 FIX 3: Use the converted numeric amount here for the deep link
        upiDeepLink: `upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(merchantName)}&am=${numericOrderAmount.toFixed(2)}&cu=${currency}&tn=${encodeURIComponent(`Order ${orderId} - ${transactionId}`)}`,
    };
};

/**
 * Get customer details for payment confirmation
 */
export const getCustomerDetails = async (userId: string) => {
    const user = await User.findByPk(userId, {
        attributes: ['id', 'name', 'email', 'phone']
    });

    if (!user) {
        throw new HttpError('User not found.', 404);
    }

    return {
        id: user.get('id'),
        name: user.get('name'),
        email: user.get('email'),
        phone: user.get('phone'),
    };
};

/**
 * Get order details by ID
 */
export const getOrderDetails = async (orderId: string) => {
    const order = await Order.findByPk(orderId, {
        include: [
            { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
            { model: Course, as: 'course', attributes: ['id', 'name'], required: false },
            { model: Qbank, as: 'qbank', attributes: ['id', 'name'], required: false },
            { model: TestSeries, as: 'testSeries', attributes: ['id', 'name'], required: false },
            { model: Webinar, as: 'webinar', attributes: ['id', 'title'], required: false },
        ]
    });

    if (!order) {
        throw new HttpError('Order not found.', 404);
    }

    return order;
};

/**
 * Update customer details for an order
 */
export const updateOrderCustomerDetails = async (
    orderId: string,
    customerDetails: { name: string; phone: string; email: string }
) => {
    const order = await Order.findByPk(orderId);
    
    if (!order) {
        throw new HttpError('Order not found.', 404);
    }

    await order.update({
        customerName: customerDetails.name,
        customerPhone: customerDetails.phone,
        customerEmail: customerDetails.email,
    });

    console.log(`Customer details updated for order: ${orderId}`);

    return {
        success: true,
        message: 'Customer details updated successfully.',
    };
};