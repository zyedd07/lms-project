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
exports.getActivePaymentGatewaySetting = exports.getAllPaymentGatewaySettings = exports.deletePaymentGatewaySetting = exports.updatePaymentGatewaySetting = exports.createPaymentGatewaySetting = void 0;
// services/PaymentGateway.service.ts
const PaymentGatewaySetting_model_1 = __importDefault(require("../models/PaymentGatewaySetting.model"));
const httpError_1 = __importDefault(require("../utils/httpError"));
const sequelize_1 = require("sequelize"); // Import Op for Sequelize operators
/**
 * Creates a new payment gateway setting.
 * Ensures only one gateway can be default at a time.
 */
const createPaymentGatewaySetting = (params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (params.isDefault) {
            yield PaymentGatewaySetting_model_1.default.update({ isDefault: false }, { where: { isDefault: true } });
        }
        const newSetting = yield PaymentGatewaySetting_model_1.default.create(params);
        return newSetting.toJSON();
    }
    catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError' && error.fields.gatewayName) {
            throw new httpError_1.default(`Gateway with name '${params.gatewayName}' already exists.`, 409);
        }
        // The following unique constraint for isDefault might not be needed if the update logic handles it
        // However, if there's a unique constraint on the DB for `isDefault` allowing only one true, keep it.
        if (error.name === 'SequelizeUniqueConstraintError' && error.fields.isDefault) {
            throw new httpError_1.default('Only one payment gateway can be set as default at a time.', 409);
        }
        throw new httpError_1.default(error.message || 'Failed to create payment gateway setting.', 500);
    }
});
exports.createPaymentGatewaySetting = createPaymentGatewaySetting;
/**
 * Updates an existing payment gateway setting.
 * Ensures only one gateway can be default at a time.
 */
const updatePaymentGatewaySetting = (id, params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const setting = yield PaymentGatewaySetting_model_1.default.findByPk(id);
        if (!setting) {
            throw new httpError_1.default('Payment gateway setting not found.', 404);
        }
        if (params.isDefault) {
            // Set all other default settings to false, excluding the current one being updated
            yield PaymentGatewaySetting_model_1.default.update({ isDefault: false }, { where: { isDefault: true, id: { [sequelize_1.Op.ne]: id } } });
        }
        yield setting.update(params);
        return setting.toJSON();
    }
    catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError' && error.fields.isDefault) {
            throw new httpError_1.default('Only one payment gateway can be set as default at a time.', 409);
        }
        throw new httpError_1.default(error.message || 'Failed to update payment gateway setting.', 500);
    }
});
exports.updatePaymentGatewaySetting = updatePaymentGatewaySetting;
/**
 * Deletes a payment gateway setting.
 */
const deletePaymentGatewaySetting = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const setting = yield PaymentGatewaySetting_model_1.default.findByPk(id);
        if (!setting) {
            throw new httpError_1.default('Payment gateway setting not found.', 404);
        }
        yield setting.destroy();
        return { message: 'Payment gateway setting deleted successfully.' };
    }
    catch (error) {
        throw new httpError_1.default(error.message || 'Failed to delete payment gateway setting.', 500);
    }
});
exports.deletePaymentGatewaySetting = deletePaymentGatewaySetting;
/**
 * Retrieves all payment gateway settings (for Admin Panel).
 */
const getAllPaymentGatewaySettings = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const settings = yield PaymentGatewaySetting_model_1.default.findAll();
        return settings.map(s => {
            const plain = s.toJSON();
            // IMPORTANT: Never send apiSecret to the frontend (even admin panel) unless absolutely necessary and securely handled.
            delete plain.apiSecret; // Strip secret before sending
            return plain;
        });
    }
    catch (error) {
        throw new httpError_1.default(error.message || 'Failed to retrieve payment gateway settings.', 500);
    }
});
exports.getAllPaymentGatewaySettings = getAllPaymentGatewaySettings;
/**
 * Retrieves the active/default payment gateway setting (for Mobile App).
 * Only returns public keys/URLs.
 */
const getActivePaymentGatewaySetting = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const setting = yield PaymentGatewaySetting_model_1.default.findOne({ where: { isActive: true, isDefault: true } });
        if (!setting) {
            // Fallback to any active if no default is set
            const anyActiveSetting = yield PaymentGatewaySetting_model_1.default.findOne({ where: { isActive: true } });
            if (!anyActiveSetting) {
                throw new httpError_1.default('No active payment gateway found.', 404);
            }
            const plain = anyActiveSetting.toJSON();
            delete plain.apiSecret; // Strip secret
            return plain;
        }
        const plain = setting.toJSON();
        delete plain.apiSecret; // Strip secret
        return plain;
    }
    catch (error) {
        throw new httpError_1.default(error.message || 'Failed to retrieve active payment gateway setting.', 500);
    }
});
exports.getActivePaymentGatewaySetting = getActivePaymentGatewaySetting;
