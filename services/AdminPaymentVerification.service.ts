import { Model } from 'sequelize'; // Keep this import for the base Model type reference
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

// --- Type Definitions for Clarity (FIXED) ---

// 1. Define Attribute Interfaces (Model properties)
interface PaymentAttributes {
    id: string;
    userId: string;
    status: 'pending' | 'successful' | 'failed';
    amount: string;
    transactionId: string;
    gatewayTransactionId: string | null;
    adminNotes: string | null;
    verifiedBy: string | null;
    verifiedAt: Date | null;
}

interface OrderAttributes {
    id: string;
    userId: string;
    status: 'pending' | 'successful' | 'failed' | 'cancelled';
    amount: string;
    courseId: string | null;
    qbankId: string | null;
    testSeriesId: string | null;
    webinarId: string | null;
    productName: string | null;
}

interface UserAttributes {
    id: string;
    name: string;
    email: string;
    phone: string | null;
}

// 2. Define Instance Interfaces (Model methods + Associations)
// These explicitly list the methods/accessors used, avoiding the generic Model conflicts.

interface PaymentInstance extends PaymentAttributes {
    // Association Getters
    get(key: 'order'): OrderInstance;
    get(key: 'user'): UserInstance;
    // Attribute Getter (Simplified to avoid overload conflict)
    get(key: keyof PaymentAttributes): any; 
    
    // Sequelize Update method signature
    update(values: Partial<PaymentAttributes> & { adminNotes: string | null; verifiedBy: string; verifiedAt: Date }, options?: any): Promise<PaymentInstance>;
}

interface OrderInstance extends OrderAttributes {
    // Attribute Getter (Simplified to avoid overload conflict)
    get(key: keyof OrderAttributes): any; 
    
    // Sequelize Update method signature
    update(values: Partial<OrderAttributes>, options?: any): Promise<OrderInstance>;
}

interface UserInstance extends UserAttributes {
    // Attribute Getter (Simplified)
    get(key: keyof UserAttributes): any;
}


// --- Verification Logic ---

interface VerifyPaymentInput {
    paymentId: string;
    adminId: string;
    status: 'successful' | 'failed';
    adminNotes?: string;
    gatewayTransactionId?: string;
}

export const verifyPayment = async (input: VerifyPaymentInput) => {
    const { paymentId, adminId, status, adminNotes, gatewayTransactionId } = input;

    // 1. Fetch Payment, Order, and User details
    const payment = (await Payment.findByPk(paymentId, {
        include: [
            { model: Order, as: 'order' },
            { model: User, as: 'user', attributes: ['id', 'name', 'email'] }
        ]
    })) as unknown as PaymentInstance | null; // Cast safely

    if (!payment) {
        throw new HttpError('Payment record not found.', 404);
    }

    if (payment.get('status') !== 'pending') {
        throw new HttpError(
            `Payment already ${payment.get('status')}. Cannot verify again.`,
            400
        );
    }

    const order = payment.get('order') as OrderInstance;
    if (!order) {
        throw new HttpError('Associated order not found.', 404);
    }

    // 2. Update payment and order status
    await payment.update({
        status,
        // If gatewayTransactionId is provided in input, use it, otherwise use the existing one (if any)
        gatewayTransactionId: gatewayTransactionId || payment.get('gatewayTransactionId'),
        adminNotes: adminNotes ?? null, 
        verifiedBy: adminId,
        verifiedAt: new Date(),
    });

    await order.update({ status });

    console.log(`Payment ${paymentId} verified by admin ${adminId} as ${status}`);

    // 3. Post-verification actions (Grant access and send email)
    const user = payment.get('user') as UserInstance;

    if (status === 'successful') {
        await grantProductAccess(payment, order);
        await sendPaymentConfirmationEmail(user, order, payment);
    } else {
        await sendPaymentRejectionEmail(user, order, payment, adminNotes);
    }

    return {
        success: true,
        message: `Payment ${status === 'successful' ? 'approved' : 'rejected'} successfully.`,
        paymentId,
        status,
    };
};

// --- Product Access Granting ---

const grantProductAccess = async (payment: PaymentInstance, order: OrderInstance) => {
    const userId = payment.get('userId') as string;
    
    // Check which product ID exists on the Order and grant access via findOrCreate
    if (order.get('courseId')) {
        await UserCourse.findOrCreate({
            where: { userId, courseId: order.get('courseId') as string },
            defaults: { 
                userId, 
                courseId: order.get('courseId') as string,
                enrolledAt: new Date(),
                paymentId: payment.get('id')
            }
        });
        console.log(`User ${userId} enrolled in course ${order.get('courseId')}`);
    } else if (order.get('qbankId')) {
        await UserQbank.findOrCreate({
            where: { userId, qbankId: order.get('qbankId') as string },
            defaults: { 
                userId, 
                qbankId: order.get('qbankId') as string,
                enrolledAt: new Date(),
                paymentId: payment.get('id')
            }
        });
        console.log(`User ${userId} enrolled in qbank ${order.get('qbankId')}`);
    } else if (order.get('testSeriesId')) {
        await UserTestSeries.findOrCreate({
            where: { userId, testSeriesId: order.get('testSeriesId') as string },
            defaults: { 
                userId, 
                testSeriesId: order.get('testSeriesId') as string,
                enrolledAt: new Date(),
                paymentId: payment.get('id')
            }
        });
        console.log(`User ${userId} enrolled in test series ${order.get('testSeriesId')}`);
    } else if (order.get('webinarId')) {
        await UserWebinar.findOrCreate({
            where: { userId, webinarId: order.get('webinarId') as string },
            defaults: { 
                userId, 
                webinarId: order.get('webinarId') as string,
                enrolledAt: new Date(),
                paymentId: payment.get('id')
            }
        });
        console.log(`User ${userId} enrolled in webinar ${order.get('webinarId')}`);
    }
};

// --- Payment Listing & Details ---

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
                    // Eagerly loads product name using Order's associations
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
                    // Eagerly loads product name using Order's associations
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

// --- Email Utility Functions ---

const sendPaymentConfirmationEmail = async (user: UserInstance, order: OrderInstance, payment: PaymentInstance) => {
    // Fallback logic for productName if null
    const productName = order.get('productName') || 'Product'; 
    
    try {
        await sendEmail({
            to: user.get('email') as string,
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
    user: UserInstance, 
    order: OrderInstance, 
    payment: PaymentInstance, 
    reason?: string
) => {
    const productName = order.get('productName') || 'Product';
    
    try {
        await sendEmail({
            to: user.get('email') as string,
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