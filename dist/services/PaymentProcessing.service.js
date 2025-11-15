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
exports.updateOrderCustomerDetails = exports.getOrderDetails = exports.getCustomerDetails = exports.initiatePayment = exports.createOrder = void 0;
// services/PaymentProcessing.service.ts (Updated with QR code generation and fix)
const httpError_1 = __importDefault(require("../utils/httpError"));
const Order_model_1 = __importDefault(require("../models/Order.model"));
const Payment_model_1 = __importDefault(require("../models/Payment.model"));
const Course_model_1 = __importDefault(require("../models/Course.model"));
const QuestionBank_model_1 = __importDefault(require("../models/QuestionBank.model"));
const TestSeries_model_1 = __importDefault(require("../models/TestSeries.model"));
const webinar_model_1 = __importDefault(require("../models/webinar.model"));
const User_model_1 = __importDefault(require("../models/User.model"));
const PaymentGatewaySetting_model_1 = __importDefault(require("../models/PaymentGatewaySetting.model"));
const uuid_1 = require("uuid");
const qrcode_1 = __importDefault(require("qrcode"));
/**
 * Service to create a new order for a product.
 * Validates product exists, price matches, and creates order record.
 */
const createOrder = (input) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, courseId, testSeriesId, qbankId, webinarId, price } = input;
    // Validate user exists
    const user = yield User_model_1.default.findByPk(userId);
    if (!user) {
        throw new httpError_1.default('User not found.', 404);
    }
    // Determine product type and validate
    let productId;
    let productType;
    let actualPrice;
    let productName;
    if (courseId) {
        const course = yield Course_model_1.default.findByPk(courseId);
        if (!course)
            throw new httpError_1.default('Course not found.', 404);
        productId = courseId;
        productType = 'course';
        actualPrice = parseFloat(course.get('price'));
        productName = course.get('name');
    }
    else if (testSeriesId) {
        const testSeries = yield TestSeries_model_1.default.findByPk(testSeriesId);
        if (!testSeries)
            throw new httpError_1.default('Test Series not found.', 404);
        productId = testSeriesId;
        productType = 'testSeries';
        actualPrice = parseFloat(testSeries.get('price'));
        productName = testSeries.get('name');
    }
    else if (qbankId) {
        const qbank = yield QuestionBank_model_1.default.findByPk(qbankId);
        if (!qbank)
            throw new httpError_1.default('Question Bank not found.', 404);
        productId = qbankId;
        productType = 'qbank';
        actualPrice = parseFloat(qbank.get('price'));
        productName = qbank.get('name');
    }
    else if (webinarId) {
        const webinar = yield webinar_model_1.default.findByPk(webinarId);
        if (!webinar)
            throw new httpError_1.default('Webinar not found.', 404);
        productId = webinarId;
        productType = 'webinar';
        actualPrice = parseFloat(webinar.get('price'));
        productName = webinar.get('title');
    }
    else {
        throw new httpError_1.default('No valid product ID provided.', 400);
    }
    // Validate price matches (with small tolerance for floating point)
    if (Math.abs(actualPrice - price) > 0.01) {
        throw new httpError_1.default(`Price mismatch. Expected ${actualPrice}, received ${price}.`, 400);
    }
    // Check if user already has a pending order for this product
    const existingOrder = yield Order_model_1.default.findOne({
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
            orderId: existingOrder.get('id'),
            confirmedPrice: parseFloat(existingOrder.get('amount')),
        };
    }
    // Create new order
    const newOrder = yield Order_model_1.default.create({
        id: (0, uuid_1.v4)(),
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
        orderId: newOrder.get('id'),
        confirmedPrice: actualPrice,
    };
});
exports.createOrder = createOrder;
/**
 * Generate UPI QR Code
 */
const generateUpiQrCode = (merchantUpiId_1, merchantName_1, amount_1, transactionId_1, orderNumber_1, ...args_1) => __awaiter(void 0, [merchantUpiId_1, merchantName_1, amount_1, transactionId_1, orderNumber_1, ...args_1], void 0, function* (merchantUpiId, merchantName, amount, // Relax the type to string | number for safety
transactionId, orderNumber, currency = 'INR') {
    try {
        // 🔑 FIX 1: Convert amount to a number to ensure .toFixed() works.
        const numericAmount = parseFloat(amount);
        // Create UPI deep link string
        const upiString = `upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(merchantName)}&am=${numericAmount.toFixed(2)}&cu=${currency}&tn=${encodeURIComponent(`Order ${orderNumber} - ${transactionId}`)}`;
        // Generate QR code as base64 data URL
        const qrCodeDataUrl = yield qrcode_1.default.toDataURL(upiString, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 300,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        return qrCodeDataUrl;
    }
    catch (error) {
        // Renamed error variable in console output for clarity
        console.error('Error generating QR code:', error);
        throw new httpError_1.default('Failed to generate QR code', 500);
    }
});
/**
 * Service to initiate payment for an existing order.
 * Creates payment record, generates QR code, and returns transaction details.
 */
const initiatePayment = (input) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId, gatewayName } = input;
    // Validate order exists and is pending
    const order = yield Order_model_1.default.findByPk(orderId);
    if (!order) {
        throw new httpError_1.default('Order not found.', 404);
    }
    if (order.get('status') !== 'pending') {
        throw new httpError_1.default('Order is not in pending status.', 400);
    }
    // Validate gateway exists and is active
    const gateway = yield PaymentGatewaySetting_model_1.default.findOne({
        where: { gatewayName, isActive: true }
    });
    if (!gateway) {
        throw new httpError_1.default('Payment gateway not found or inactive.', 400);
    }
    // Get merchant details from gateway settings
    const merchantUpiId = gateway.get('merchantUpiId');
    const merchantName = gateway.get('merchantName');
    const currency = gateway.get('currency') || 'INR';
    if (!merchantUpiId || !merchantName) {
        throw new httpError_1.default('Payment gateway configuration incomplete. Missing UPI details.', 500);
    }
    // Generate unique transaction ID
    const transactionId = `TXN_${Date.now()}_${(0, uuid_1.v4)().substring(0, 8)}`;
    // Retrieve amount from order
    const orderAmount = order.get('amount');
    // 🔑 FIX 2: Convert the order amount to a number for safe use with toFixed()
    const numericOrderAmount = parseFloat(orderAmount);
    if (isNaN(numericOrderAmount) || numericOrderAmount <= 0) {
        throw new httpError_1.default('Invalid order amount.', 400);
    }
    // Generate QR code
    const qrCodeDataUrl = yield generateUpiQrCode(merchantUpiId, merchantName, numericOrderAmount, // Pass the converted numeric amount
    transactionId, orderId, currency);
    // Create payment record
    const payment = yield Payment_model_1.default.create({
        id: (0, uuid_1.v4)(),
        userId: order.get('userId'),
        orderId: orderId,
        courseId: order.get('courseId'),
        testSeriesId: order.get('testSeriesId'),
        qbankId: order.get('qbankId'),
        webinarId: order.get('webinarId'),
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
});
exports.initiatePayment = initiatePayment;
/**
 * Get customer details for payment confirmation
 */
const getCustomerDetails = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield User_model_1.default.findByPk(userId, {
        attributes: ['id', 'name', 'email', 'phone']
    });
    if (!user) {
        throw new httpError_1.default('User not found.', 404);
    }
    return {
        id: user.get('id'),
        name: user.get('name'),
        email: user.get('email'),
        phone: user.get('phone'),
    };
});
exports.getCustomerDetails = getCustomerDetails;
/**
 * Get order details by ID
 */
const getOrderDetails = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield Order_model_1.default.findByPk(orderId, {
        include: [
            { model: User_model_1.default, as: 'user', attributes: ['id', 'name', 'email'] },
            { model: Course_model_1.default, as: 'course', attributes: ['id', 'name'], required: false },
            { model: QuestionBank_model_1.default, as: 'qbank', attributes: ['id', 'name'], required: false },
            { model: TestSeries_model_1.default, as: 'testSeries', attributes: ['id', 'name'], required: false },
            { model: webinar_model_1.default, as: 'webinar', attributes: ['id', 'title'], required: false },
        ]
    });
    if (!order) {
        throw new httpError_1.default('Order not found.', 404);
    }
    return order;
});
exports.getOrderDetails = getOrderDetails;
/**
 * Update customer details for an order
 */
const updateOrderCustomerDetails = (orderId, customerDetails) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield Order_model_1.default.findByPk(orderId);
    if (!order) {
        throw new httpError_1.default('Order not found.', 404);
    }
    yield order.update({
        customerName: customerDetails.name,
        customerPhone: customerDetails.phone,
        customerEmail: customerDetails.email,
    });
    console.log(`Customer details updated for order: ${orderId}`);
    return {
        success: true,
        message: 'Customer details updated successfully.',
    };
});
exports.updateOrderCustomerDetails = updateOrderCustomerDetails;
