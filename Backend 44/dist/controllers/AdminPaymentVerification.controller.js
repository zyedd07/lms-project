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
exports.verifyPaymentController = exports.getPaymentDetailsController = exports.getAllPaymentsController = exports.getPendingPaymentsController = void 0;
const httpError_1 = __importDefault(require("../utils/httpError"));
const AdminPaymentVerification_service_1 = require("../services/AdminPaymentVerification.service");
/**
 * @route GET /api/admin/payments/pending
 * @desc Get all pending orders for admin verification (aliased as payments)
 * @access Private (Admin Only)
 */
const getPendingPaymentsController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
            throw new httpError_1.default('Forbidden: Admin access required.', 403);
        }
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        const result = yield (0, AdminPaymentVerification_service_1.getPendingPayments)(limit, offset);
        res.status(200).json({
            success: true,
            message: 'Pending payments fetched successfully.',
            data: result
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getPendingPaymentsController = getPendingPaymentsController;
/**
 * @route GET /api/admin/payments/all
 * @desc Get all orders (aliased as payments) with optional status filter
 * @access Private (Admin Only)
 */
const getAllPaymentsController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
            throw new httpError_1.default('Forbidden: Admin access required.', 403);
        }
        const status = req.query.status;
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        const result = yield (0, AdminPaymentVerification_service_1.getAllPayments)(status, limit, offset);
        res.status(200).json({
            success: true,
            message: 'Payments fetched successfully.',
            data: result
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getAllPaymentsController = getAllPaymentsController;
/**
 * @route GET /api/admin/payments/:paymentId
 * @desc Get order details by ID (using :paymentId route parameter)
 * @access Private (Admin Only)
 */
const getPaymentDetailsController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
            throw new httpError_1.default('Forbidden: Admin access required.', 403);
        }
        // FIX: Treat the route parameter (which is named 'paymentId' in the route) as the Order ID
        const { paymentId: orderId } = req.params;
        // The service function now takes the Order ID
        const payment = yield (0, AdminPaymentVerification_service_1.getPaymentDetails)(orderId);
        res.status(200).json({
            success: true,
            message: 'Payment details fetched successfully.',
            data: payment
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getPaymentDetailsController = getPaymentDetailsController;
/**
 * @route POST /api/admin/payments/verify
 * @desc Verify and approve/reject an order
 * @access Private (Admin Only)
 */
const verifyPaymentController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
            throw new httpError_1.default('Forbidden: Admin access required.', 403);
        }
        if (!((_b = req.user) === null || _b === void 0 ? void 0 : _b.id)) {
            throw new httpError_1.default('Admin ID not found in request.', 401);
        }
        // FIX: Change destructuring to expect orderId as the primary key from the body.
        const { orderId, paymentId, status, adminNotes, gatewayTransactionId } = req.body;
        // Validation
        if (!orderId || !status) {
            // FIX: Updated error message to reflect the missing field is now orderId
            throw new httpError_1.default('Missing required fields: orderId, status.', 400);
        }
        if (!['successful', 'failed'].includes(status)) {
            throw new httpError_1.default('Invalid status. Must be "successful" or "failed".', 400);
        }
        const result = yield (0, AdminPaymentVerification_service_1.verifyPayment)({
            // FIX: Pass orderId as the required parameter
            orderId,
            paymentId,
            adminId: req.user.id,
            status,
            adminNotes,
            gatewayTransactionId
        });
        res.status(200).json({
            success: true,
            message: result.message,
            data: {
                // FIX: The service now returns orderId, not paymentId
                orderId: result.orderId,
                status: result.status
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.verifyPaymentController = verifyPaymentController;
