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
exports.getPaymentDetails = exports.getPendingPayments = exports.getAllPayments = exports.getAllOrders = exports.verifyPayment = void 0;
const httpError_1 = __importDefault(require("../utils/httpError"));
const Payment_model_1 = __importDefault(require("../models/Payment.model"));
const Order_model_1 = __importDefault(require("../models/Order.model"));
const User_model_1 = __importDefault(require("../models/User.model"));
const Course_model_1 = __importDefault(require("../models/Course.model"));
const QuestionBank_model_1 = __importDefault(require("../models/QuestionBank.model"));
const TestSeries_model_1 = __importDefault(require("../models/TestSeries.model"));
const webinar_model_1 = __importDefault(require("../models/webinar.model"));
const UserCourse_model_1 = __importDefault(require("../models/UserCourse.model"));
const UserQbank_model_1 = __importDefault(require("../models/UserQbank.model"));
const UserTestSeries_model_1 = __importDefault(require("../models/UserTestSeries.model"));
const UserWebinar_model_1 = __importDefault(require("../models/UserWebinar.model"));
const email_1 = require("../utils/email");
const verifyPayment = (input) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId, paymentId, adminId, status, adminNotes, gatewayTransactionId } = input;
    // 1. Fetch Order, User, and associated Payment details
    const order = (yield Order_model_1.default.findByPk(orderId, {
        include: [
            { model: User_model_1.default, as: 'user', attributes: ['id', 'name', 'email'] },
            { model: Payment_model_1.default, as: 'payment' }
        ]
    }));
    if (!order) {
        throw new httpError_1.default('Order record not found.', 404);
    }
    if (order.get('status') !== 'pending') {
        throw new httpError_1.default(`Order already ${order.get('status')}. Cannot verify again.`, 400);
    }
    // 2. Update Order status
    yield order.update({ status });
    console.log(`Order ${orderId} verified by admin ${adminId} as ${status}`);
    // 3. Update associated Payment record (if one exists and is relevant)
    const payment = order.get('payment');
    if (payment) {
        // Only update the associated payment if its ID matches the one provided, or if no ID was provided.
        if (!paymentId || payment.id === paymentId) {
            yield payment.update({
                status,
                gatewayTransactionId: gatewayTransactionId || payment.get('gatewayTransactionId'),
                adminNotes: adminNotes !== null && adminNotes !== void 0 ? adminNotes : null,
                verifiedBy: adminId,
                verifiedAt: new Date(),
            });
        }
    }
    // 4. Post-verification actions (Grant access and send email)
    const user = order.get('user');
    if (status === 'successful') {
        yield grantProductAccess(order);
        yield sendPaymentConfirmationEmail(user, order, payment);
    }
    else {
        yield sendPaymentRejectionEmail(user, order, payment, adminNotes);
    }
    return {
        success: true,
        message: `Order ${status === 'successful' ? 'approved' : 'rejected'} successfully.`,
        orderId: order.get('id'),
        status,
    };
});
exports.verifyPayment = verifyPayment;
// --- Product Access Granting ---
const grantProductAccess = (order) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = order.get('userId');
    const paymentId = (_a = order.get('payment')) === null || _a === void 0 ? void 0 : _a.id;
    // Check which product ID exists on the Order and grant access via findOrCreate
    if (order.get('courseId')) {
        yield UserCourse_model_1.default.findOrCreate({
            where: { userId, courseId: order.get('courseId') },
            defaults: {
                userId,
                courseId: order.get('courseId'),
                enrolledAt: new Date(),
                paymentId: paymentId // Use retrieved paymentId
            }
        });
        console.log(`User ${userId} enrolled in course ${order.get('courseId')}`);
    }
    else if (order.get('qbankId')) {
        yield UserQbank_model_1.default.findOrCreate({
            where: { userId, qbankId: order.get('qbankId') },
            defaults: {
                userId,
                qbankId: order.get('qbankId'),
                enrolledAt: new Date(),
                paymentId: paymentId
            }
        });
        console.log(`User ${userId} enrolled in qbank ${order.get('qbankId')}`);
    }
    else if (order.get('testSeriesId')) {
        yield UserTestSeries_model_1.default.findOrCreate({
            where: { userId, testSeriesId: order.get('testSeriesId') },
            defaults: {
                userId,
                testSeriesId: order.get('testSeriesId'),
                enrolledAt: new Date(),
                paymentId: paymentId
            }
        });
        console.log(`User ${userId} enrolled in test series ${order.get('testSeriesId')}`);
    }
    else if (order.get('webinarId')) {
        yield UserWebinar_model_1.default.findOrCreate({
            where: { userId, webinarId: order.get('webinarId') },
            defaults: {
                userId,
                webinarId: order.get('webinarId'),
                enrolledAt: new Date(),
                paymentId: paymentId
            }
        });
        console.log(`User ${userId} enrolled in webinar ${order.get('webinarId')}`);
    }
});
// --- Order Listing & Details (Aliased for Controller Compatibility) ---
const getAllOrders = (status_1, ...args_1) => __awaiter(void 0, [status_1, ...args_1], void 0, function* (status, limit = 50, offset = 0) {
    const whereClause = {};
    if (status && ['pending', 'successful', 'failed', 'cancelled'].includes(status)) {
        whereClause.status = status;
    }
    // NOTE: This now fetches by ORDER STATUS, which should resolve the 'zero payments' issue.
    const orders = yield Order_model_1.default.findAndCountAll({
        where: whereClause,
        include: [
            { model: User_model_1.default, as: 'user', attributes: ['id', 'name', 'email'] },
            { model: Payment_model_1.default, as: 'payment', attributes: ['id', 'status', 'transactionId', 'amount'], required: false },
            { model: Course_model_1.default, as: 'course', attributes: ['id', 'name'], required: false },
            { model: QuestionBank_model_1.default, as: 'qbank', attributes: ['id', 'name'], required: false },
            { model: TestSeries_model_1.default, as: 'testSeries', attributes: ['id', 'name'], required: false },
            { model: webinar_model_1.default, as: 'webinar', attributes: ['id', 'title'], required: false },
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
    });
    return {
        orders: orders.rows,
        total: orders.count,
        limit: orders.limit,
        offset: orders.offset,
    };
});
exports.getAllOrders = getAllOrders;
// ALIAS: Used by controller 'getAllPaymentsController'
const getAllPayments = (status_1, ...args_1) => __awaiter(void 0, [status_1, ...args_1], void 0, function* (status, limit = 50, offset = 0) {
    const result = yield (0, exports.getAllOrders)(status, limit, offset);
    return {
        payments: result.orders, // Return orders as 'payments' to match controller expectations
        total: result.total,
        limit: result.limit,
        offset: result.offset,
    };
});
exports.getAllPayments = getAllPayments;
// ALIAS: Used by controller 'getPendingPaymentsController'
const getPendingPayments = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (limit = 50, offset = 0) {
    // This now fetches Orders with status 'pending'
    return (0, exports.getAllPayments)('pending', limit, offset);
});
exports.getPendingPayments = getPendingPayments;
// ALIAS: Used by controller 'getPaymentDetailsController'
const getPaymentDetails = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield Order_model_1.default.findByPk(orderId, {
        include: [
            { model: User_model_1.default, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
            { model: Payment_model_1.default, as: 'payment', required: false },
            { model: Course_model_1.default, as: 'course', attributes: ['id', 'name'], required: false },
            { model: QuestionBank_model_1.default, as: 'qbank', attributes: ['id', 'name'], required: false },
            { model: TestSeries_model_1.default, as: 'testSeries', attributes: ['id', 'name'], required: false },
            { model: webinar_model_1.default, as: 'webinar', attributes: ['id', 'title'], required: false },
        ]
    });
    if (!order) {
        throw new httpError_1.default('Order not found.', 404);
    }
    // Return the Order object; the controller treats it as the payment object
    return order;
});
exports.getPaymentDetails = getPaymentDetails;
// --- Email Utility Functions ---
const sendPaymentConfirmationEmail = (user, order, payment) => __awaiter(void 0, void 0, void 0, function* () {
    const productName = order.get('productName') || 'Product';
    const transactionId = payment ? payment.get('transactionId') : 'N/A (Manual Verification)';
    const paymentAmount = payment ? payment.get('amount') : order.get('amount');
    try {
        yield (0, email_1.sendEmail)({
            to: user.get('email'),
            subject: 'Order Confirmed - Access Granted',
            html: `
                <h2>Order Confirmed!</h2>
                <p>Dear ${user.get('name')},</p>
                <p>Your order for ${productName} has been verified and confirmed.</p>
                <h3>Order Details:</h3>
                <ul>
                    <li>Order ID: ${order.get('id')}</li>
                    <li>Product: ${productName}</li>
                    <li>Amount: ₹${paymentAmount}</li>
                    <li>Transaction ID: ${transactionId}</li>
                </ul>
                <p>You now have full access to ${productName}.</p>
                <p>Thank you for your purchase!</p>
            `
        });
        console.log(`Confirmation email sent to ${user.get('email')}`);
    }
    catch (error) {
        console.error('Error sending confirmation email:', error);
    }
});
const sendPaymentRejectionEmail = (user, order, payment, reason) => __awaiter(void 0, void 0, void 0, function* () {
    const productName = order.get('productName') || 'Product';
    const paymentAmount = payment ? payment.get('amount') : order.get('amount');
    try {
        yield (0, email_1.sendEmail)({
            to: user.get('email'),
            subject: 'Order Verification Failed',
            html: `
                <h2>Order Verification Failed</h2>
                <p>Dear ${user.get('name')},</p>
                <p>We were unable to verify your order/payment.</p>
                <h3>Order Details:</h3>
                <ul>
                    <li>Order ID: ${order.get('id')}</li>
                    <li>Product: ${productName}</li>
                    <li>Amount: ₹${paymentAmount}</li>
                </ul>
                ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
                <p>Please contact support if you believe this is an error.</p>
            `
        });
        console.log(`Rejection email sent to ${user.get('email')}`);
    }
    catch (error) {
        console.error('Error sending rejection email:', error);
    }
});
