// services/AdminPaymentVerification.service.ts (Fixed)
import HttpError from '../utils/httpError';
import Payment from '../models/Payment.model';
import Order from '../models/Order.model';
import User from '../models/User.model';
import Course from '../models/Course.model';
import Qbank from '../models/QuestionBank.model';
import TestSeries from '../models/TestSeries.model';
import Webinar from '../models/webinar.model';
import UserCourse from '../models/UserCourse.model';
import UserQbank from '../models/UserQbank.model';
import UserTestSeries from '../models/UserTestSeries.model';
import UserWebinar from '../models/UserWebinar.model';
import { sendEmail } from '../utils/email';

interface VerifyPaymentInput {
    paymentId: string;
    adminId: string;
    status: 'successful' | 'failed';
    adminNotes?: string;
    gatewayTransactionId?: string;
}

export const verifyPayment = async (input: VerifyPaymentInput) => {
    const { paymentId, adminId, status, adminNotes, gatewayTransactionId } = input;

    const payment = await Payment.findByPk(paymentId, {
        include: [
            { model: Order, as: 'order' },
            { model: User, as: 'user', attributes: ['id', 'name', 'email'] }
        ]
    });

    if (!payment) {
        throw new HttpError('Payment record not found.', 404);
    }

    if (payment.get('status') !== 'pending') {
        throw new HttpError(
            `Payment already ${payment.get('status')}. Cannot verify again.`,
            400
        );
    }

    const order = payment.get('order') as any;
    if (!order) {
        throw new HttpError('Associated order not found.', 404);
    }

    // Update payment status with proper field names
    await payment.update({
        status,
        gatewayTransactionId: gatewayTransactionId || payment.get('gatewayTransactionId'),
        adminNotes,
        verifiedBy: adminId,
        verifiedAt: new Date(),
    });

    // Update order status
    await order.update({ status });

    console.log(`Payment ${paymentId} verified by admin ${adminId} as ${status}`);

    if (status === 'successful') {
        await grantProductAccess(payment, order);
        const user = payment.get('user') as any;
        await sendPaymentConfirmationEmail(user, order, payment);
    } else {
        const user = payment.get('user') as any;
        await sendPaymentRejectionEmail(user, order, payment, adminNotes);
    }

    return {
        success: true,
        message: `Payment ${status === 'successful' ? 'approved' : 'rejected'} successfully.`,
        paymentId,
        status,
    };
};

const grantProductAccess = async (payment: any, order: any) => {
    const userId = payment.get('userId') as string;
    
    // Use proper field names (lowercase)
    if (order.get('courseId')) {
        await UserCourse.findOrCreate({
            where: { userId, courseId: order.get('courseId') },
            defaults: { 
                userId, 
                courseId: order.get('courseId'),
                enrolledAt: new Date(),
                paymentId: payment.get('id')
            }
        });
        console.log(`User ${userId} enrolled in course ${order.get('courseId')}`);
    } else if (order.get('qbankId')) {
        await UserQbank.findOrCreate({
            where: { userId, qbankId: order.get('qbankId') },
            defaults: { 
                userId, 
                qbankId: order.get('qbankId'),
                enrolledAt: new Date(),
                paymentId: payment.get('id')
            }
        });
        console.log(`User ${userId} enrolled in qbank ${order.get('qbankId')}`);
    } else if (order.get('testSeriesId')) {
        await UserTestSeries.findOrCreate({
            where: { userId, testSeriesId: order.get('testSeriesId') },
            defaults: { 
                userId, 
                testSeriesId: order.get('testSeriesId'),
                enrolledAt: new Date(),
                paymentId: payment.get('id')
            }
        });
        console.log(`User ${userId} enrolled in test series ${order.get('testSeriesId')}`);
    } else if (order.get('webinarId')) {
        await UserWebinar.findOrCreate({
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
};

export const getAllPayments = async (
    status?: string,
    limit: number = 50,
    offset: number = 0
) => {
    const whereClause: any = {};
    if (status && ['pending', 'successful', 'failed'].includes(status)) {
        whereClause.status = status;
    }

    const payments = await Payment.findAndCountAll({
        where: whereClause,
        include: [
            { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
            { 
                model: Order, 
                as: 'order',
                include: [
                    { model: Course, as: 'course', attributes: ['id', 'name'], required: false },
                    { model: Qbank, as: 'qbank', attributes: ['id', 'name'], required: false },
                    { model: TestSeries, as: 'testSeries', attributes: ['id', 'name'], required: false },
                    { model: Webinar, as: 'webinar', attributes: ['id', 'title'], required: false },
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
};

export const getPendingPayments = async (limit: number = 50, offset: number = 0) => {
    return getAllPayments('pending', limit, offset);
};

export const getPaymentDetails = async (paymentId: string) => {
    const payment = await Payment.findByPk(paymentId, {
        include: [
            { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
            { 
                model: Order, 
                as: 'order',
                include: [
                    { model: Course, as: 'course', attributes: ['id', 'name'], required: false },
                    { model: Qbank, as: 'qbank', attributes: ['id', 'name'], required: false },
                    { model: TestSeries, as: 'testSeries', attributes: ['id', 'name'], required: false },
                    { model: Webinar, as: 'webinar', attributes: ['id', 'title'], required: false },
                ]
            }
        ]
    });

    if (!payment) {
        throw new HttpError('Payment not found.', 404);
    }

    return payment;
};

const sendPaymentConfirmationEmail = async (user: any, order: any, payment: any) => {
    const productName = order.get('productName') || 'Product';
    
    try {
        await sendEmail({
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
    } catch (error) {
        console.error('Error sending confirmation email:', error);
    }
};

const sendPaymentRejectionEmail = async (
    user: any, 
    order: any, 
    payment: any, 
    reason?: string
) => {
    const productName = order.get('productName') || 'Product';
    
    try {
        await sendEmail({
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
    } catch (error) {
        console.error('Error sending rejection email:', error);
    }
};