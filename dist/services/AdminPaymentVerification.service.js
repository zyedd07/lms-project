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
exports.getPaymentDetails = exports.getPendingPayments = exports.getAllPayments = exports.verifyPayment = void 0;
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
    const { paymentId, adminId, status, adminNotes, gatewayTransactionId } = input;
    // 1. Fetch Payment, Order, and User details
    const payment = (yield Payment_model_1.default.findByPk(paymentId, {
        include: [
            { model: Order_model_1.default, as: 'order' },
            { model: User_model_1.default, as: 'user', attributes: ['id', 'name', 'email'] }
        ]
    })); // Cast safely
    if (!payment) {
        throw new httpError_1.default('Payment record not found.', 404);
    }
    if (payment.get('status') !== 'pending') {
        throw new httpError_1.default(`Payment already ${payment.get('status')}. Cannot verify again.`, 400);
    }
    const order = payment.get('order');
    if (!order) {
        throw new httpError_1.default('Associated order not found.', 404);
    }
    // 2. Update payment and order status
    yield payment.update({
        status,
        // If gatewayTransactionId is provided in input, use it, otherwise use the existing one (if any)
        gatewayTransactionId: gatewayTransactionId || payment.get('gatewayTransactionId'),
        adminNotes: adminNotes !== null && adminNotes !== void 0 ? adminNotes : null,
        verifiedBy: adminId,
        verifiedAt: new Date(),
    });
    yield order.update({ status });
    console.log(`Payment ${paymentId} verified by admin ${adminId} as ${status}`);
    // 3. Post-verification actions (Grant access and send email)
    const user = payment.get('user');
    if (status === 'successful') {
        yield grantProductAccess(payment, order);
        yield sendPaymentConfirmationEmail(user, order, payment);
    }
    else {
        yield sendPaymentRejectionEmail(user, order, payment, adminNotes);
    }
    return {
        success: true,
        message: `Payment ${status === 'successful' ? 'approved' : 'rejected'} successfully.`,
        paymentId,
        status,
    };
});
exports.verifyPayment = verifyPayment;
// --- Product Access Granting ---
const grantProductAccess = (payment, order) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = payment.get('userId');
    // Check which product ID exists on the Order and grant access via findOrCreate
    if (order.get('courseId')) {
        yield UserCourse_model_1.default.findOrCreate({
            where: { userId, courseId: order.get('courseId') },
            defaults: {
                userId,
                courseId: order.get('courseId'),
                enrolledAt: new Date(),
                paymentId: payment.get('id')
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
                paymentId: payment.get('id')
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
                paymentId: payment.get('id')
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
                paymentId: payment.get('id')
            }
        });
        console.log(`User ${userId} enrolled in webinar ${order.get('webinarId')}`);
    }
});
// --- Payment Listing & Details ---
const getAllPayments = (status_1, ...args_1) => __awaiter(void 0, [status_1, ...args_1], void 0, function* (status, limit = 50, offset = 0) {
    const whereClause = {};
    if (status && ['pending', 'successful', 'failed'].includes(status)) {
        whereClause.status = status;
    }
    const payments = yield Payment_model_1.default.findAndCountAll({
        where: whereClause,
        include: [
            { model: User_model_1.default, as: 'user', attributes: ['id', 'name', 'email'] },
            {
                model: Order_model_1.default,
                as: 'order',
                include: [
                    // Eagerly loads product name using Order's associations
                    { model: Course_model_1.default, as: 'course', attributes: ['id', 'name'], required: false },
                    { model: QuestionBank_model_1.default, as: 'qbank', attributes: ['id', 'name'], required: false },
                    { model: TestSeries_model_1.default, as: 'testSeries', attributes: ['id', 'name'], required: false },
                    { model: webinar_model_1.default, as: 'webinar', attributes: ['id', 'title'], required: false },
                ]
            }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
    });
    return {
        payments: payments.rows,
        total: payments.count,
        limit,
        offset,
    };
});
exports.getAllPayments = getAllPayments;
const getPendingPayments = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (limit = 50, offset = 0) {
    return (0, exports.getAllPayments)('pending', limit, offset);
});
exports.getPendingPayments = getPendingPayments;
const getPaymentDetails = (paymentId) => __awaiter(void 0, void 0, void 0, function* () {
    const payment = yield Payment_model_1.default.findByPk(paymentId, {
        include: [
            { model: User_model_1.default, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
            {
                model: Order_model_1.default,
                as: 'order',
                include: [
                    // Eagerly loads product name using Order's associations
                    { model: Course_model_1.default, as: 'course', attributes: ['id', 'name'], required: false },
                    { model: QuestionBank_model_1.default, as: 'qbank', attributes: ['id', 'name'], required: false },
                    { model: TestSeries_model_1.default, as: 'testSeries', attributes: ['id', 'name'], required: false },
                    { model: webinar_model_1.default, as: 'webinar', attributes: ['id', 'title'], required: false },
                ]
            }
        ]
    });
    if (!payment) {
        throw new httpError_1.default('Payment not found.', 404);
    }
    return payment;
});
exports.getPaymentDetails = getPaymentDetails;
// --- Email Utility Functions ---
const sendPaymentConfirmationEmail = (user, order, payment) => __awaiter(void 0, void 0, void 0, function* () {
    // Fallback logic for productName if null
    const productName = order.get('productName') || 'Product';
    try {
        yield (0, email_1.sendEmail)({
            to: user.get('email'),
            subject: 'Payment Confirmed - Access Granted',
            html: `
                <h2>Payment Confirmed!</h2>
                <p>Dear ${user.get('name')},</p>
                <p>Your payment has been verified and confirmed.</p>
                <h3>Order Details:</h3>
                <ul>
                    <li>Order ID: ${order.get('id')}</li>
                    <li>Product: ${productName}</li>
                    <li>Amount: ₹${payment.get('amount')}</li>
                    <li>Transaction ID: ${payment.get('transactionId')}</li>
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
    try {
        yield (0, email_1.sendEmail)({
            to: user.get('email'),
            subject: 'Payment Verification Failed',
            html: `
                <h2>Payment Verification Failed</h2>
                <p>Dear ${user.get('name')},</p>
                <p>We were unable to verify your payment.</p>
                <h3>Order Details:</h3>
                <ul>
                    <li>Order ID: ${order.get('id')}</li>
                    <li>Product: ${productName}</li>
                    <li>Amount: ₹${payment.get('amount')}</li>
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
