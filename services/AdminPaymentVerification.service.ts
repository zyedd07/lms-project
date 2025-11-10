import { Model } from 'sequelize';
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

// --- Type Definitions (FIXED and Adjusted for Order Association) ---

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
    orderId: string;
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

interface PaymentInstance extends PaymentAttributes {
    get(key: 'order'): OrderInstance;
    get(key: keyof PaymentAttributes): any;
    update(values: Partial<PaymentAttributes>, options?: any): Promise<PaymentInstance>;
}

interface OrderInstance extends OrderAttributes {
    get(key: 'user'): UserInstance; 
    get(key: 'payment'): PaymentInstance | null; 
    get(key: keyof OrderAttributes): any; 
    update(values: Partial<OrderAttributes>, options?: any): Promise<OrderInstance>;
}

interface UserInstance extends UserAttributes {
    get(key: keyof UserAttributes): any;
}


// --- Verification Logic (Order-Centric) ---

interface VerifyPaymentInput {
    orderId: string; 
    paymentId?: string; 
    adminId: string;
    status: 'successful' | 'failed';
    adminNotes?: string;
    gatewayTransactionId?: string;
}

export const verifyPayment = async (input: VerifyPaymentInput) => {
    const { orderId, paymentId, adminId, status, adminNotes, gatewayTransactionId } = input;

    // 1. Fetch Order, User, and associated Payment details
    const order = (await Order.findByPk(orderId, {
        include: [
            { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
            { model: Payment, as: 'payment' } 
        ]
    })) as unknown as OrderInstance | null;

    if (!order) {
        throw new HttpError('Order record not found.', 404);
    }

    if (order.get('status') !== 'pending') {
        throw new HttpError(
            `Order already ${order.get('status')}. Cannot verify again.`,
            400
        );
    }
    
    // 2. Update Order status
    await order.update({ status });
    console.log(`Order ${orderId} verified by admin ${adminId} as ${status}`);

    // 3. Update associated Payment record (if one exists and is relevant)
    const payment = order.get('payment') as PaymentInstance | null;
    if (payment) {
        if (!paymentId || payment.id === paymentId) {
            await payment.update({
                status,
                gatewayTransactionId: gatewayTransactionId || payment.get('gatewayTransactionId'),
                adminNotes: adminNotes ?? null,
                verifiedBy: adminId,
                verifiedAt: new Date(),
            });
        }
    }


    // 4. Post-verification actions (Grant access and send email)
    const user = order.get('user') as UserInstance;

    if (status === 'successful') {
        await grantProductAccess(order); 
        await sendPaymentConfirmationEmail(user, order, payment); 
    } else {
        await sendPaymentRejectionEmail(user, order, payment, adminNotes);
    }

    return {
        success: true,
        message: `Order ${status === 'successful' ? 'approved' : 'rejected'} successfully.`,
        orderId: order.get('id'),
        status,
    };
};

// --- Product Access Granting ---

const grantProductAccess = async (order: OrderInstance) => {
    const userId = order.get('userId') as string;
    const paymentId = (order.get('payment') as PaymentInstance)?.id;

    // Check which product ID exists on the Order and grant access via findOrCreate
    if (order.get('courseId')) {
        await UserCourse.findOrCreate({
            where: { userId, courseId: order.get('courseId') as string },
            defaults: { 
                userId, 
                courseId: order.get('courseId') as string,
                enrolledAt: new Date(),
                paymentId: paymentId
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
                paymentId: paymentId
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
                paymentId: paymentId
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
                paymentId: paymentId
            }
        });
        console.log(`User ${userId} enrolled in webinar ${order.get('webinarId')}`);
    }
};

// --- Order Listing & Details (Aliased for Controller Compatibility) ---

export const getAllOrders = async (
    status?: string,
    limit: number = 50,
    offset: number = 0
) => {
    const whereClause: any = {};
    if (status && ['pending', 'successful', 'failed', 'cancelled'].includes(status)) {
        whereClause.status = status;
    }
    
    const orders = await Order.findAndCountAll({
        where: whereClause, 
        include: [
            { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
            { model: Payment, as: 'payment', attributes: ['id', 'status', 'transactionId', 'amount'], required: false },
            { model: Course, as: 'course', attributes: ['id', 'name'], required: false },
            { model: Qbank, as: 'qbank', attributes: ['id', 'name'], required: false },
            { model: TestSeries, as: 'testSeries', attributes: ['id', 'name'], required: false },
            { model: Webinar, as: 'webinar', attributes: ['id', 'title'], required: false },
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
    });

    return {
        orders: orders.rows,
        total: orders.count,
        // FIX: Using the function arguments for limit and offset to resolve TS2339
        limit: limit, 
        offset: offset, 
    };
};

// ALIAS: Used by controller 'getAllPaymentsController'
export const getAllPayments = async (status?: string, limit: number = 50, offset: number = 0) => {
    const result = await getAllOrders(status, limit, offset);
    return {
        payments: result.orders, 
        total: result.total,
        limit: result.limit,
        offset: result.offset,
    };
};


// ALIAS: Used by controller 'getPendingPaymentsController'
export const getPendingPayments = async (limit: number = 50, offset: number = 0) => {
    return getAllPayments('pending', limit, offset); 
};


// ALIAS: Used by controller 'getPaymentDetailsController'
export const getPaymentDetails = async (orderId: string) => {
    const order = await Order.findByPk(orderId, {
        include: [
            { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
            { model: Payment, as: 'payment', required: false }, 
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


// --- Email Utility Functions ---

const sendPaymentConfirmationEmail = async (user: UserInstance, order: OrderInstance, payment?: PaymentInstance | null) => {
    const productName = order.get('productName') || 'Product';
    const transactionId = payment ? payment.get('transactionId') : 'N/A (Manual Verification)';
    const paymentAmount = payment ? payment.get('amount') : order.get('amount');
    
    try {
        await sendEmail({
            to: user.get('email') as string,
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
    } catch (error) {
        console.error('Error sending confirmation email:', error);
    }
};

const sendPaymentRejectionEmail = async (
    user: UserInstance, 
    order: OrderInstance, 
    payment?: PaymentInstance | null, 
    reason?: string
) => {
    const productName = order.get('productName') || 'Product';
    const paymentAmount = payment ? payment.get('amount') : order.get('amount');
    
    try {
        await sendEmail({
            to: user.get('email') as string,
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
    } catch (error) {
        console.error('Error sending rejection email:', error);
    }
};