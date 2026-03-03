// services/PaymentGateway.service.ts
import PaymentGatewaySetting from '../models/PaymentGatewaySetting.model';
import HttpError from '../utils/httpError';
import { Op } from 'sequelize'; // Import Op for Sequelize operators
import {
    CreatePaymentGatewayParams,
    UpdatePaymentGatewayParams,
    PaymentGatewayData
} from '../utils/types'; // Import from the new types file
import bcrypt from 'bcryptjs'; // Import bcrypt for encryption

const SALT_ROUNDS = 10; // Define salt rounds for bcrypt

/**
 * Hashes a given string using bcrypt.
 * @param {string} plainText - The string to hash.
 * @returns {Promise<string>} The hashed string.
 */
const hashSecret = async (plainText: string): Promise<string> => {
    return bcrypt.hash(plainText, SALT_ROUNDS);
};

/**
 * Creates a new payment gateway setting.
 * Ensures only one gateway can be default at a time.
 * API Key and Secret are hashed before saving.
 */
export const createPaymentGatewaySetting = async (params: CreatePaymentGatewayParams): Promise<PaymentGatewayData> => {
    try {
        // Hash API Key and Secret if provided
        const dataToCreate = { ...params };
        if (dataToCreate.apiKey) {
            dataToCreate.apiKey = await hashSecret(dataToCreate.apiKey);
        }
        if (dataToCreate.apiSecret) {
            dataToCreate.apiSecret = await hashSecret(dataToCreate.apiSecret);
        }

        if (dataToCreate.isDefault) {
            // If the new setting is default, set all other defaults to false
            await PaymentGatewaySetting.update({ isDefault: false }, { where: { isDefault: true } });
        }
        const newSetting = await PaymentGatewaySetting.create(dataToCreate);
        return newSetting.toJSON() as PaymentGatewayData;
    } catch (error: any) {
        if (error.name === 'SequelizeUniqueConstraintError' && error.fields.gatewayName) {
            throw new HttpError(`Gateway with name '${params.gatewayName}' already exists.`, 409);
        }
        // This unique constraint error for `isDefault` might occur if a unique index is set on `isDefault`
        // and a true value already exists. The update logic above should prevent this, but it's good to catch.
        if (error.name === 'SequelizeUniqueConstraintError' && error.fields.isDefault) {
            throw new HttpError('Only one payment gateway can be set as default at a time.', 409);
        }
        throw new HttpError(error.message || 'Failed to create payment gateway setting.', 500);
    }
};

/**
 * Updates an existing payment gateway setting.
 * Ensures only one gateway can be default at a time.
 * API Key and Secret are hashed if updated.
 */
export const updatePaymentGatewaySetting = async (id: string, params: UpdatePaymentGatewayParams): Promise<PaymentGatewayData> => {
    try {
        const setting = await PaymentGatewaySetting.findByPk(id);
        if (!setting) {
            throw new HttpError('Payment gateway setting not found.', 404);
        }

        const dataToUpdate = { ...params };

        // Hash API Key if provided in update parameters
        if (dataToUpdate.apiKey) {
            dataToUpdate.apiKey = await hashSecret(dataToUpdate.apiKey);
        }
        // Hash API Secret if provided in update parameters
        if (dataToUpdate.apiSecret) {
            dataToUpdate.apiSecret = await hashSecret(dataToUpdate.apiSecret);
        }

        if (dataToUpdate.isDefault) {
            // Set all other default settings to false, excluding the current one being updated
            await PaymentGatewaySetting.update({ isDefault: false }, { where: { isDefault: true, id: { [Op.ne]: id } } });
        }

        await setting.update(dataToUpdate);
        return setting.toJSON() as PaymentGatewayData;
    } catch (error: any) {
        if (error.name === 'SequelizeUniqueConstraintError' && error.fields.isDefault) {
            throw new HttpError('Only one payment gateway can be set as default at a time.', 409);
        }
        throw new HttpError(error.message || 'Failed to update payment gateway setting.', 500);
    }
};

/**
 * Deletes a payment gateway setting.
 */
export const deletePaymentGatewaySetting = async (id: string): Promise<{ message: string }> => {
    try {
        const setting = await PaymentGatewaySetting.findByPk(id);
        if (!setting) {
            throw new HttpError('Payment gateway setting not found.', 404);
        }
        await setting.destroy();
        return { message: 'Payment gateway setting deleted successfully.' };
    } catch (error: any) {
        throw new HttpError(error.message || 'Failed to delete payment gateway setting.', 500);
    }
};

/**
 * Retrieves all payment gateway settings (for Admin Panel).
 */
export const getAllPaymentGatewaySettings = async (): Promise<PaymentGatewayData[]> => {
    try {
        const settings = await PaymentGatewaySetting.findAll();
        return settings.map(s => {
            const plain = s.toJSON() as PaymentGatewayData;
            // IMPORTANT: Never send apiSecret to the frontend (even admin panel) unless absolutely necessary and securely handled.
            delete plain.apiSecret; // Strip secret before sending
            // Also strip apiKey, as it's now hashed and not directly usable by frontend
            delete plain.apiKey;
            return plain;
        });
    } catch (error: any) {
        throw new HttpError(error.message || 'Failed to retrieve payment gateway settings.', 500);
    }
};

/**
 * Retrieves the active/default payment gateway setting (for Mobile App).
 * Only returns public keys/URLs.
 */
export const getActivePaymentGatewaySetting = async (): Promise<PaymentGatewayData> => {
    try {
        const setting = await PaymentGatewaySetting.findOne({ where: { isActive: true, isDefault: true } });
        if (!setting) {
            // Fallback to any active if no default is set
            const anyActiveSetting = await PaymentGatewaySetting.findOne({ where: { isActive: true } });
            if (!anyActiveSetting) {
                throw new HttpError('No active payment gateway found.', 404);
            }
            const plain = anyActiveSetting.toJSON() as PaymentGatewayData;
            delete plain.apiSecret; // Strip secret
            delete plain.apiKey; // Strip hashed API key
            return plain;
        }
        const plain = setting.toJSON() as PaymentGatewayData;
        delete plain.apiSecret; // Strip secret
        delete plain.apiKey; // Strip hashed API key
        return plain;
    } catch (error: any) {
        throw new HttpError(error.message || 'Failed to retrieve active payment gateway setting.', 500);
    }
};

/**
 * Retrieves a payment gateway setting by ID, including sensitive keys for backend use.
 * This function should ONLY be called by other backend services that need to use the keys.
 */
export const getPaymentGatewaySettingByIdForBackend = async (gatewayName: string): Promise<PaymentGatewayData> => {
    try {
        // CORRECTED: Use findOne with a where clause to query by gatewayName
        const setting = await PaymentGatewaySetting.findOne({ where: { gatewayName: gatewayName } });
        if (!setting) {
            throw new HttpError(`Payment gateway setting with name '${gatewayName}' not found.`, 404);
        }
        return setting.toJSON() as PaymentGatewayData;
    } catch (error: any) {
        throw new HttpError(error.message || 'Failed to retrieve payment gateway setting for backend use.', 500);
    }
};

/**
 * Verifies a plain text secret against a hashed secret.
 * This would be used in your payment processing logic to verify API keys/secrets
 * retrieved from the DB before making external API calls.
 * @param {string} plainSecret - The plain text secret to verify.
 * @param {string} hashedSecret - The hashed secret from the database.
 * @returns {Promise<boolean>} True if secrets match, false otherwise.
 */
export const verifySecret = async (plainSecret: string, hashedSecret: string): Promise<boolean> => {
    return bcrypt.compare(plainSecret, hashedSecret);
};
