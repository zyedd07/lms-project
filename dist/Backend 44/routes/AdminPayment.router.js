"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/AdminPaymentVerification.router.ts
const express_1 = __importDefault(require("express"));
const AdminPaymentVerification_controller_1 = require("../controllers/AdminPaymentVerification.controller");
const auth_1 = __importStar(require("../middleware/auth"));
const router = express_1.default.Router();
/**
 * @route GET /api/admin/payments/pending
 * @desc Get all pending payments awaiting verification
 * @access Private (Admin Only)
 */
router.get('/pending', auth_1.default, auth_1.authorizeAdmin, AdminPaymentVerification_controller_1.getPendingPaymentsController);
/**
 * @route GET /api/admin/payments/all
 * @desc Get all payments with optional status filter
 * @access Private (Admin Only)
 */
router.get('/all', auth_1.default, auth_1.authorizeAdmin, AdminPaymentVerification_controller_1.getAllPaymentsController);
/**
 * @route GET /api/admin/payments/:paymentId
 * @desc Get detailed payment information by ID
 * @access Private (Admin Only)
 */
router.get('/:paymentId', auth_1.default, auth_1.authorizeAdmin, AdminPaymentVerification_controller_1.getPaymentDetailsController);
/**
 * @route POST /api/admin/payments/verify
 * @desc Verify and approve/reject a payment
 * @access Private (Admin Only)
 */
router.post('/verify', auth_1.default, auth_1.authorizeAdmin, AdminPaymentVerification_controller_1.verifyPaymentController);
exports.default = router;
