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
// routes/PaymentGateway.router.ts
const express_1 = __importDefault(require("express"));
const PaymentGatewayController = __importStar(require("../controllers/PaymentGateway.controller"));
const auth_1 = __importStar(require("../middleware/auth")); // Import authorizeAdmin
const router = express_1.default.Router();
// Admin routes (require authentication and ADMIN role)
router.post('/settings', auth_1.default, auth_1.authorizeAdmin, PaymentGatewayController.createPaymentGatewayController);
router.put('/settings/:id', auth_1.default, auth_1.authorizeAdmin, PaymentGatewayController.updatePaymentGatewayController);
router.delete('/settings/:id', auth_1.default, auth_1.authorizeAdmin, PaymentGatewayController.deletePaymentGatewayController);
router.get('/settings', auth_1.default, PaymentGatewayController.getAllPaymentGatewaysController);
// Public/Mobile App route (might not require authentication if settings are generally public)
router.get('/settings/active', auth_1.default, PaymentGatewayController.getActivePaymentGatewayController);
exports.default = router;
