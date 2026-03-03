"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/PaymentProcessing.router.ts (Updated)
const express_1 = __importDefault(require("express"));
const PaymentProcessing_controller_1 = require("../controllers/PaymentProcessing.controller");
const auth_1 = __importDefault(require("../middleware/auth"));
const auth_2 = require("../middleware/auth");
const router = express_1.default.Router();
/**
 * @route POST /api/payments/create-order
 * @desc Create a new order before payment
 * @access Private (Authenticated User)
 */
router.post('/create-order', auth_1.default, PaymentProcessing_controller_1.createOrderController);
/**
 * @route POST /api/payments/process-transaction
 * @desc Initiate payment for an existing order
 * @access Private (Authenticated User)
 */
router.post('/process-transaction', auth_1.default, PaymentProcessing_controller_1.processPaymentController);
/**
 * @route POST /api/payments/update-customer-details
 * @desc Update customer details for an order
 * @access Private (Authenticated User)
 */
router.post('/update-customer-details', auth_1.default, PaymentProcessing_controller_1.updateCustomerDetailsController);
/**
 * @route GET /api/payments/order/:orderId
 * @desc Get order details by ID
 * @access Private (Authenticated User)
 */
router.get('/order/:orderId', auth_1.default, PaymentProcessing_controller_1.getOrderDetailsController);
/**
 * @route GET /api/payments/user/history
 * @desc Get user's payment history
 * @access Private (Authenticated User)
 */
router.get('/user/history', auth_1.default, PaymentProcessing_controller_1.getUserPaymentHistoryController);
/**
 * @route GET /api/payments/completed
 * @desc Get all completed payments (Admin only)
 * @access Private (Admin Only)
 */
router.get('/completed', auth_1.default, auth_2.authorizeAdmin, PaymentProcessing_controller_1.getCompletedPayments);
exports.default = router;
