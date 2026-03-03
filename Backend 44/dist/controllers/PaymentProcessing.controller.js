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
exports.getCompletedPayments = exports.getUserPaymentHistoryController = exports.getOrderDetailsController = exports.updateCustomerDetailsController = exports.processPaymentController = exports.createOrderController = void 0;
const httpError_1 = __importDefault(require("../utils/httpError"));
const PaymentProcessing_service_1 = require("../services/PaymentProcessing.service");
const Order_model_1 = __importDefault(require("../models/Order.model"));
const Payment_model_1 = __importDefault(require("../models/Payment.model"));
const User_model_1 = __importDefault(require("../models/User.model"));
const Course_model_1 = __importDefault(require("../models/Course.model"));
const QuestionBank_model_1 = __importDefault(require("../models/QuestionBank.model"));
const TestSeries_model_1 = __importDefault(require("../models/TestSeries.model"));
const webinar_model_1 = __importDefault(require("../models/webinar.model"));
/**
 * @route POST /api/payments/create-order
 * @desc Creates a new order record for a product enrollment.
 * @access Private (Authenticated User)
 */
const createOrderController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            throw new httpError_1.default('Authentication required to create an order.', 401);
        }
        const { courseId, testSeriesId, qbankId, webinarId, price } = req.body;
        // Validation
        if ((!courseId && !testSeriesId && !qbankId && !webinarId) ||
            price === undefined || price === null || isNaN(parseFloat(price))) {
            throw new httpError_1.default('Missing required order details: product ID and valid price.', 400);
        }
        const result = yield (0, PaymentProcessing_service_1.createOrder)({
            userId: req.user.id,
            courseId,
            testSeriesId,
            qbankId,
            webinarId,
            price: parseFloat(price),
        });
        res.status(201).json({
            success: true,
            message: result.message,
            orderId: result.orderId,
            confirmedPrice: result.confirmedPrice,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.createOrderController = createOrderController;
/**
 * @route POST /api/payments/process-transaction
 * @desc Initiates a payment transaction for an existing order with QR code generation
 * @access Private (Authenticated User)
 *
 * Response includes:
 * - transactionId: Unique transaction identifier
 * - qrCodeDataUrl: Base64 encoded QR code image (ready to display in <Image> component)
 * - merchantUpiId: Dynamic merchant UPI ID from admin settings
 * - merchantName: Dynamic merchant name from admin settings
 * - upiDeepLink: Pre-formatted UPI deep link to open UPI apps
 * - amount & currency: Payment details
 */
const processPaymentController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            throw new httpError_1.default('Authentication required to process payment.', 401);
        }
        const { orderId, gatewayName } = req.body;
        if (!orderId || !gatewayName) {
            throw new httpError_1.default('Missing required payment processing details: orderId, gatewayName.', 400);
        }
        const result = yield (0, PaymentProcessing_service_1.initiatePayment)({
            orderId,
            gatewayName,
        });
        // Return all payment details including dynamically generated QR code and merchant info
        res.status(200).json({
            success: true,
            message: result.message,
            transactionId: result.transactionId,
            orderId: result.orderId,
            amount: result.amount,
            currency: result.currency,
            qrCodeDataUrl: result.qrCodeDataUrl, // ✅ Base64 QR code image from backend
            merchantUpiId: result.merchantUpiId, // ✅ Dynamic UPI ID from admin panel settings
            merchantName: result.merchantName, // ✅ Dynamic merchant name from admin panel settings
            upiDeepLink: result.upiDeepLink, // ✅ Pre-generated UPI deep link for apps
        });
    }
    catch (error) {
        console.error('Error processing payment transaction:', error);
        next(error);
    }
});
exports.processPaymentController = processPaymentController;
/**
 * @route POST /api/payments/update-customer-details
 * @desc Update customer details for an order
 * @access Private (Authenticated User)
 */
const updateCustomerDetailsController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            throw new httpError_1.default('Authentication required.', 401);
        }
        const { orderId, name, phone, email } = req.body;
        if (!orderId || !name || !phone || !email) {
            throw new httpError_1.default('Missing required fields: orderId, name, phone, email.', 400);
        }
        // Verify order belongs to user
        const order = yield Order_model_1.default.findOne({
            where: { id: orderId, userId: req.user.id }
        });
        if (!order) {
            throw new httpError_1.default('Order not found or unauthorized.', 404);
        }
        const result = yield (0, PaymentProcessing_service_1.updateOrderCustomerDetails)(orderId, {
            name,
            phone,
            email
        });
        res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
});
exports.updateCustomerDetailsController = updateCustomerDetailsController;
/**
 * @route GET /api/payments/order/:orderId
 * @desc Get order details
 * @access Private (Authenticated User)
 */
const getOrderDetailsController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            throw new httpError_1.default('Authentication required.', 401);
        }
        const { orderId } = req.params;
        const order = yield (0, PaymentProcessing_service_1.getOrderDetails)(orderId);
        // Verify order belongs to user (unless admin)
        if (order.get('userId') !== req.user.id && req.user.role !== 'admin') {
            throw new httpError_1.default('Unauthorized access to order.', 403);
        }
        res.status(200).json({
            success: true,
            data: order
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getOrderDetailsController = getOrderDetailsController;
/**
 * @route GET /api/payments/user/history
 * @desc Get user's payment history
 * @access Private (Authenticated User)
 */
const getUserPaymentHistoryController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            throw new httpError_1.default('Authentication required.', 401);
        }
        const payments = yield Payment_model_1.default.findAll({
            where: { userId: req.user.id },
            include: [
                {
                    model: Order_model_1.default,
                    as: 'order',
                    include: [
                        { model: Course_model_1.default, as: 'course', attributes: ['id', 'name'], required: false },
                        { model: QuestionBank_model_1.default, as: 'qbank', attributes: ['id', 'name'], required: false },
                        { model: TestSeries_model_1.default, as: 'testSeries', attributes: ['id', 'name'], required: false },
                        { model: webinar_model_1.default, as: 'webinar', attributes: ['id', 'title'], required: false },
                    ]
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({
            success: true,
            message: 'Payment history fetched successfully.',
            data: payments
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getUserPaymentHistoryController = getUserPaymentHistoryController;
/**
 * @route GET /api/payments/completed
 * @desc Get all completed payments (Admin only)
 * @access Private (Admin Only)
 */
const getCompletedPayments = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
            throw new httpError_1.default('Forbidden: Only administrators can view completed payments.', 403);
        }
        const completedPayments = yield Order_model_1.default.findAll({
            where: { status: 'successful' },
            include: [
                { model: User_model_1.default, as: 'user', attributes: ['id', 'name', 'email'] },
                { model: Course_model_1.default, as: 'course', attributes: ['id', 'name'], required: false },
                { model: QuestionBank_model_1.default, as: 'qbank', attributes: ['id', 'name'], required: false },
                { model: TestSeries_model_1.default, as: 'testSeries', attributes: ['id', 'name'], required: false },
                { model: webinar_model_1.default, as: 'webinar', attributes: ['id', 'title'], required: false },
            ],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({
            success: true,
            message: 'Successfully fetched completed payments.',
            data: completedPayments
        });
    }
    catch (error) {
        console.error('Error fetching completed payments:', error);
        next(error);
    }
});
exports.getCompletedPayments = getCompletedPayments;
