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
exports.getActivePaymentGatewayController = exports.getAllPaymentGatewaysController = exports.deletePaymentGatewayController = exports.updatePaymentGatewayController = exports.createPaymentGatewayController = void 0;
const httpError_1 = __importDefault(require("../utils/httpError"));
const constants_1 = require("../utils/constants"); // Assuming you have Role constants
const PaymentGateway_service_1 = require("../services/PaymentGateway.service");
/**
 * Admin: Create a new payment gateway setting.
 * @route POST /api/admin/payment-gateways
 * @access Private (Admin)
 */
const createPaymentGatewayController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== constants_1.Role.ADMIN) {
            throw new httpError_1.default('Unauthorized: Only Admin can create payment gateway settings.', 403);
        }
        const newSetting = yield (0, PaymentGateway_service_1.createPaymentGatewaySetting)(req.body);
        res.status(201).json({ success: true, data: newSetting });
    }
    catch (error) {
        next(error);
    }
});
exports.createPaymentGatewayController = createPaymentGatewayController;
/**
 * Admin: Update an existing payment gateway setting.
 * @route PUT /api/admin/payment-gateways/:id
 * @desc Update an existing payment gateway setting.
 * @access Private (Admin)
 */
const updatePaymentGatewayController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== constants_1.Role.ADMIN) {
            throw new httpError_1.default('Unauthorized: Only Admin can update payment gateway settings.', 403);
        }
        const { id } = req.params;
        const updatedSetting = yield (0, PaymentGateway_service_1.updatePaymentGatewaySetting)(id, req.body);
        res.status(200).json({ success: true, data: updatedSetting });
    }
    catch (error) {
        next(error);
    }
});
exports.updatePaymentGatewayController = updatePaymentGatewayController;
/**
 * Admin: Delete a payment gateway setting.
 * @route DELETE /api/admin/payment-gateways/:id
 * @desc Delete a payment gateway setting.
 * @access Private (Admin)
 */
const deletePaymentGatewayController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== constants_1.Role.ADMIN) {
            throw new httpError_1.default('Unauthorized: Only Admin can delete payment gateway settings.', 403);
        }
        const { id } = req.params;
        const result = yield (0, PaymentGateway_service_1.deletePaymentGatewaySetting)(id);
        res.status(200).json({ success: true, message: result.message });
    }
    catch (error) {
        next(error);
    }
});
exports.deletePaymentGatewayController = deletePaymentGatewayController;
/**
 * Admin: Get all payment gateway settings.
 * @route GET /api/admin/payment-gateways
 * @desc Get all payment gateway settings (for Admin Panel).
 * @access Private (Admin)
 */
const getAllPaymentGatewaysController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== constants_1.Role.ADMIN) {
            throw new httpError_1.default('Unauthorized: Only Admin can view all payment gateway settings.', 403);
        }
        const settings = yield (0, PaymentGateway_service_1.getAllPaymentGatewaySettings)();
        res.status(200).json({ success: true, data: settings });
    }
    catch (error) {
        next(error);
    }
});
exports.getAllPaymentGatewaysController = getAllPaymentGatewaysController;
/**
 * Mobile App: Get the active/default payment gateway setting.
 * This endpoint can be public or authenticated based on your app's needs.
 * It will strip sensitive data (apiSecret).
 * @route GET /api/payment-gateways/active
 * @desc Get the active/default payment gateway setting (for Mobile App).
 * @access Public
 */
const getActivePaymentGatewayController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const setting = yield (0, PaymentGateway_service_1.getActivePaymentGatewaySetting)();
        res.status(200).json({ success: true, data: setting });
    }
    catch (error) {
        next(error);
    }
});
exports.getActivePaymentGatewayController = getActivePaymentGatewayController;
