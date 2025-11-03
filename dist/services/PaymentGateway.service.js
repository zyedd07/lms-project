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
exports.verifySecret = exports.getPaymentGatewaySettingByIdForBackend = exports.getActivePaymentGatewaySetting = exports.getAllPaymentGatewaySettings = exports.deletePaymentGatewaySetting = exports.updatePaymentGatewaySetting = exports.createPaymentGatewaySetting = void 0;
// services/PaymentGateway.service.ts
const PaymentGatewaySetting_model_1 = __importDefault(require("../models/PaymentGatewaySetting.model"));
const httpError_1 = __importDefault(require("../utils/httpError"));
const sequelize_1 = require("sequelize"); // Import Op for Sequelize operators
const bcryptjs_1 = __importDefault(require("bcryptjs")); // Import bcrypt for encryption
const SALT_ROUNDS = 10; // Define salt rounds for bcrypt
/**
 * Hashes a given string using bcrypt.
 * @param {string} plainText - The string to hash.
 * @returns {Promise<string>} The hashed string.
 */
const hashSecret = (plainText) => __awaiter(void 0, void 0, void 0, function* () {
    return bcryptjs_1.default.hash(plainText, SALT_ROUNDS);
});
/**
 * Creates a new payment gateway setting.
 * Ensures only one gateway can be default at a time.
 * API Key and Secret are hashed before saving.
 */
const createPaymentGatewaySetting = (params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Hash API Key and Secret if provided
        const dataToCreate = Object.assign({}, params);
        if (dataToCreate.apiKey) {
            dataToCreate.apiKey = yield hashSecret(dataToCreate.apiKey);
        }
        if (dataToCreate.apiSecret) {
            dataToCreate.apiSecret = yield hashSecret(dataToCreate.apiSecret);
        }
        if (dataToCreate.isDefault) {
            // If the new setting is default, set all other defaults to false
            yield PaymentGatewaySetting_model_1.default.update({ isDefault: false }, { where: { isDefault: true } });
        }
        const newSetting = yield PaymentGatewaySetting_model_1.default.create(dataToCreate);
        return newSetting.toJSON();
    }
    catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError' && error.fields.gatewayName) {
            throw new httpError_1.default(`Gateway with name '${params.gatewayName}' already exists.`, 409);
        }
        // This unique constraint error for `isDefault` might occur if a unique index is set on `isDefault`
        // and a true value already exists. The update logic above should prevent this, but it's good to catch.
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
 * API Key and Secret are hashed if updated.
 */
const updatePaymentGatewaySetting = (id, params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const setting = yield PaymentGatewaySetting_model_1.default.findByPk(id);
        if (!setting) {
            throw new httpError_1.default('Payment gateway setting not found.', 404);
        }
        const dataToUpdate = Object.assign({}, params);
        // Hash API Key if provided in update parameters
        if (dataToUpdate.apiKey) {
            dataToUpdate.apiKey = yield hashSecret(dataToUpdate.apiKey);
        }
        // Hash API Secret if provided in update parameters
        if (dataToUpdate.apiSecret) {
            dataToUpdate.apiSecret = yield hashSecret(dataToUpdate.apiSecret);
        }
        if (dataToUpdate.isDefault) {
            // Set all other default settings to false, excluding the current one being updated
            yield PaymentGatewaySetting_model_1.default.update({ isDefault: false }, { where: { isDefault: true, id: { [sequelize_1.Op.ne]: id } } });
        }
        yield setting.update(dataToUpdate);
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
            // Also strip apiKey, as it's now hashed and not directly usable by frontend
            delete plain.apiKey;
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
            delete plain.apiKey; // Strip hashed API key
            return plain;
        }
        const plain = setting.toJSON();
        delete plain.apiSecret; // Strip secret
        delete plain.apiKey; // Strip hashed API key
        return plain;
    }
    catch (error) {
        throw new httpError_1.default(error.message || 'Failed to retrieve active payment gateway setting.', 500);
    }
});
exports.getActivePaymentGatewaySetting = getActivePaymentGatewaySetting;
/**
 * Retrieves a payment gateway setting by ID, including sensitive keys for backend use.
 * This function should ONLY be called by other backend services that need to use the keys.
 */
const getPaymentGatewaySettingByIdForBackend = (gatewayName) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // CORRECTED: Use findOne with a where clause to query by gatewayName
        const setting = yield PaymentGatewaySetting_model_1.default.findOne({ where: { gatewayName: gatewayName } });
        if (!setting) {
            throw new httpError_1.default(`Payment gateway setting with name '${gatewayName}' not found.`, 404);
        }
        return setting.toJSON();
    }
    catch (error) {
        throw new httpError_1.default(error.message || 'Failed to retrieve payment gateway setting for backend use.', 500);
    }
});
exports.getPaymentGatewaySettingByIdForBackend = getPaymentGatewaySettingByIdForBackend;
/**
 * Verifies a plain text secret against a hashed secret.
 * This would be used in your payment processing logic to verify API keys/secrets
 * retrieved from the DB before making external API calls.
 * @param {string} plainSecret - The plain text secret to verify.
 * @param {string} hashedSecret - The hashed secret from the database.
 * @returns {Promise<boolean>} True if secrets match, false otherwise.
 */
const verifySecret = (plainSecret, hashedSecret) => __awaiter(void 0, void 0, void 0, function* () {
    return bcryptjs_1.default.compare(plainSecret, hashedSecret);
});
exports.verifySecret = verifySecret;
