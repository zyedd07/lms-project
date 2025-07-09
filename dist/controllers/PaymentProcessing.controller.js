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
exports.processPaymentController = exports.createOrderController = void 0;
const httpError_1 = __importDefault(require("../utils/httpError"));
const PaymentProcessing_service_1 = require("../services/PaymentProcessing.service"); // Import the new service functions
/**
 * @route POST /api/payments/create-order
 * @desc Creates a new order record for a course enrollment.
 * @access Private (Authenticated User)
 */
const createOrderController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            throw new httpError_1.default('Authentication required to create an order.', 401);
        }
        // Destructure price and other product IDs from the request body
        const { courseId, testSeriesId, qbankId, webinarId, price } = req.body;
        // Basic validation: ensure at least one product ID is provided and price is valid
        if ((!courseId && !testSeriesId && !qbankId && !webinarId) ||
            price === undefined || price === null || isNaN(parseFloat(price))) {
            throw new httpError_1.default('Missing required order details: product ID (courseId, testSeriesId, qbankId, or webinarId) and valid price.', 400);
        }
        // Call the service to create the order
        const result = yield (0, PaymentProcessing_service_1.createOrder)({
            userId: req.user.id, // Get userId from authenticated request
            courseId,
            testSeriesId,
            qbankId,
            webinarId,
            price: parseFloat(price), // Ensure price is a number
        });
        res.status(201).json({
            success: true,
            message: result.message,
            orderId: result.orderId,
            confirmedPrice: result.confirmedPrice,
        });
    }
    catch (error) {
        next(error); // Pass error to the error handling middleware
    }
});
exports.createOrderController = createOrderController;
/**
 * @route POST /api/payments/process-transaction
 * @desc Initiates a payment transaction with the selected payment gateway for an existing order.
 * @access Private (Authenticated User)
 */
const processPaymentController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            throw new httpError_1.default('Authentication required to process payment.', 401);
        }
        const { orderId, gatewayName } = req.body;
        // Basic validation
        if (!orderId || !gatewayName) {
            throw new httpError_1.default('Missing required payment processing details: orderId, gatewayName.', 400);
        }
        // Call the service to initiate the payment
        const result = yield (0, PaymentProcessing_service_1.initiatePayment)({
            orderId,
            gatewayName,
        });
        res.status(200).json({
            success: true,
            message: result.message,
            transactionId: result.transactionId,
            orderId: result.orderId,
            // No redirectUrl is returned for in-app direct processing in this flow
        });
    }
    catch (error) {
        next(error); // Pass error to the error handling middleware
    }
});
exports.processPaymentController = processPaymentController;
