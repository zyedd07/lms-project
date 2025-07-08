// services/PaymentGateway.service.ts
import PaymentGatewaySetting from '../models/PaymentGatewaySetting.model';
import HttpError from '../utils/httpError';
import { Op } from 'sequelize'; // Import Op for Sequelize operators
import {
    CreatePaymentGatewayParams,
    UpdatePaymentGatewayParams,
    PaymentGatewayData
} from '../utils/types'; // Import from the new types file

/**
 * Creates a new payment gateway setting.
 * Ensures only one gateway can be default at a time.
 */
export const createPaymentGatewaySetting = async (params: CreatePaymentGatewayParams): Promise<PaymentGatewayData> => {
    try {
        if (params.isDefault) {
            await PaymentGatewaySetting.update({ isDefault: false }, { where: { isDefault: true } });
        }
        const newSetting = await PaymentGatewaySetting.create(params);
        return newSetting.toJSON() as PaymentGatewayData;
    } catch (error: any) {
        if (error.name === 'SequelizeUniqueConstraintError' && error.fields.gatewayName) {
            throw new HttpError(`Gateway with name '${params.gatewayName}' already exists.`, 409);
        }
        // The following unique constraint for isDefault might not be needed if the update logic handles it
        // However, if there's a unique constraint on the DB for `isDefault` allowing only one true, keep it.
        if (error.name === 'SequelizeUniqueConstraintError' && error.fields.isDefault) {
            throw new HttpError('Only one payment gateway can be set as default at a time.', 409);
        }
        throw new HttpError(error.message || 'Failed to create payment gateway setting.', 500);
    }
};

/**
 * Updates an existing payment gateway setting.
 * Ensures only one gateway can be default at a time.
 */
export const updatePaymentGatewaySetting = async (id: string, params: UpdatePaymentGatewayParams): Promise<PaymentGatewayData> => {
    try {
        const setting = await PaymentGatewaySetting.findByPk(id);
        if (!setting) {
            throw new HttpError('Payment gateway setting not found.', 404);
        }

        if (params.isDefault) {
            // Set all other default settings to false, excluding the current one being updated
            await PaymentGatewaySetting.update({ isDefault: false }, { where: { isDefault: true, id: { [Op.ne]: id } } });
        }

        await setting.update(params);
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
            return plain;
        }
        const plain = setting.toJSON() as PaymentGatewayData;
        delete plain.apiSecret; // Strip secret
        return plain;
    } catch (error: any) {
        throw new HttpError(error.message || 'Failed to retrieve active payment gateway setting.', 500);
    }
};