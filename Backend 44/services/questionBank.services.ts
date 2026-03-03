import QuestionBank from "../models/QuestionBank.model";
import HttpError from "../utils/httpError";
import User from "../models/User.model"; // Import the User model

import {
    CreateQuestionBankServiceParams,
    UpdateQuestionBankServiceParams,
    QuestionBankData
} from "../utils/types"; // Ensure these types are updated with 'price' and 'uploadedBy'

// Helper function to safely narrow 'unknown' error type
function isHttpError(error: unknown): error is HttpError {
    return error instanceof HttpError;
}

function isSequelizeUniqueConstraintError(error: unknown): error is { name: string; message: string } {
    return typeof error === 'object' && error !== null && 'name' in error && (error as any).name === 'SequelizeUniqueConstraintError';
}

/**
 * Creates a new Question Bank record in the database.
 * @param params - Contains all necessary data for creating a question bank, including the new price and uploaderId.
 * @returns A Promise that resolves to the created QuestionBankData.
 * @throws HttpError if required parameters are missing, if price is invalid, or if a unique constraint is violated.
 * @throws HttpError with 500 status for other internal errors.
 */
export const createQuestionBankService = async (
    params: CreateQuestionBankServiceParams // This type should now include 'uploadedBy'
): Promise<QuestionBankData> => {
    try {
        // Basic validation for core required fields
        if (!params.name || !params.filePath || !params.fileName || !params.uploadedBy) { // FIX: Added uploadedBy check
            throw new HttpError("Name, file path, file name, and uploader are required to create a question bank.", 400);
        }

        // Validate price - ensure it's a number and non-negative
        if (typeof params.price !== 'number' || isNaN(params.price) || params.price < 0) {
            throw new HttpError("Price is required and must be a non-negative number.", 400);
        }

        const newQuestionBank = await QuestionBank.create({
            name: params.name,
            description: params.description,
            filePath: params.filePath,
            fileName: params.fileName,
            price: params.price,
            uploadedBy: params.uploadedBy, // FIX: Pass the uploadedBy field
            // uploadDate will be set by defaultValue in the model
        });

        // Return the created question bank as plain data
        return newQuestionBank.toJSON() as QuestionBankData;
    } catch (error: unknown) {
        console.error("Error creating question bank:", error);
        if (isHttpError(error)) {
            throw error; // Re-throw known HTTP errors
        }
        if (isSequelizeUniqueConstraintError(error)) {
            // Handle unique constraint violation specifically for the name
            throw new HttpError(`A question bank with the name '${params.name}' already exists.`, 409);
        }
        // Catch-all for unexpected errors
        throw new HttpError("Failed to create question bank.", 500);
    }
};

/**
 * Updates an existing Question Bank record in the database.
 * @param id - The ID of the question bank to update.
 * @param params - An object containing the fields to update, including price.
 * @returns A Promise that resolves to the updated QuestionBankData.
 * @throws HttpError if the question bank is not found, if price is invalid, or if a unique constraint is violated.
 * @throws HttpError with 500 status for other internal errors.
 */
export const updateQuestionBankService = async (
    id: string,
    params: UpdateQuestionBankServiceParams
): Promise<QuestionBankData> => {
    try {
        // Find the question bank by its ID
        const questionBank = await QuestionBank.findOne({ where: { id } });

        if (!questionBank) {
            throw new HttpError("Question Bank not found.", 404);
        }

        // Validate price if it's provided in the update parameters
        if (params.price !== undefined) {
            if (typeof params.price !== 'number' || isNaN(params.price) || params.price < 0) {
                throw new HttpError("Price must be a non-negative number.", 400);
            }
        }

        // Update the question bank with the provided parameters
        // Sequelize will only update fields present in the params object
        await questionBank.update(params);

        // Fetch the updated question bank to ensure we return the latest state
        // FIX: Include uploader data when fetching the updated question bank
        const updatedQuestionBank = await QuestionBank.findByPk(id, {
            include: [{
                model: User,
                as: 'uploader', // This alias must match the 'as' in your QuestionBank model association
                attributes: ['id', 'name', 'email'] // Select specific user attributes
            }]
        });

        if (!updatedQuestionBank) {
            // This case indicates a serious issue where the update succeeded but retrieval failed
            throw new HttpError("Failed to retrieve updated question bank.", 500);
        }

        // Return the updated question bank as plain data
        return updatedQuestionBank.toJSON() as QuestionBankData;
    } catch (error: unknown) {
        console.error(`Error updating question bank with ID ${id}:`, error);
        if (isHttpError(error)) {
            throw error;
        }
        if (isSequelizeUniqueConstraintError(error) && params.name) {
            // Handle unique constraint violation specifically if the name was updated
            throw new HttpError(`A question bank with the name '${params.name}' already exists.`, 409);
        }
        throw new HttpError("Failed to update question bank.", 500);
    }
};

/**
 * Deletes a Question Bank record from the database.
 * @param id - The ID of the question bank to delete.
 * @returns A Promise that resolves with a success message.
 * @throws HttpError if the question bank is not found.
 * @throws HttpError with 500 status for other internal errors.
 */
export const deleteQuestionBankService = async (
    id: string
): Promise<{ message: string }> => {
    try {
        const questionBank = await QuestionBank.findOne({ where: { id } });

        if (!questionBank) {
            throw new HttpError("Question Bank not found.", 404);
        }

        await questionBank.destroy();
        return { message: "Question Bank deleted successfully." };
    } catch (error: unknown) {
        console.error(`Error deleting question bank with ID ${id}:`, error);
        if (isHttpError(error)) {
            throw error;
        }
        throw new HttpError("Failed to delete question bank.", 500);
    }
};

/**
 * Retrieves all Question Bank records from the database.
 * @returns A Promise that resolves to an array of QuestionBankData.
 * @throws HttpError with 500 status for internal errors during retrieval.
 */
export const getAllQuestionBanksService = async (): Promise<QuestionBankData[]> => {
    try {
        // FIX: Include the User model for uploader information
        const questionBanks = await QuestionBank.findAll({
            include: [{
                model: User,
                as: 'uploader', // This alias must match the 'as' in your QuestionBank model association
                required: false, // Set to true if a QB MUST have an uploader
                attributes: ['id', 'name', 'email'] // Select specific user attributes
            }]
        });
        // Map Sequelize model instances to plain data objects
        return questionBanks.map(qb => qb.toJSON() as QuestionBankData);
    } catch (error: unknown) {
        console.error("Error fetching all question banks:", error);
        throw new HttpError("Failed to retrieve question banks.", 500);
    }
};

/**
 * Retrieves a single Question Bank record by its ID.
 * @param id - The ID of the question bank to retrieve.
 * @returns A Promise that resolves to the QuestionBankData.
 * @throws HttpError if the question bank is not found.
 * @throws HttpError with 500 status for other internal errors.
 */
export const getQuestionBankByIdService = async (
    id: string
): Promise<QuestionBankData> => {
    try {
        // FIX: Include the User model for uploader information
        const questionBank = await QuestionBank.findByPk(id, {
            include: [{
                model: User,
                as: 'uploader', // This alias must match the 'as' in your QuestionBank model association
                required: false,
                attributes: ['id', 'name', 'email']
            }]
        });

        if (!questionBank) {
            throw new HttpError("Question Bank not found.", 404);
        }

        // Return the found question bank as plain data
        return questionBank.toJSON() as QuestionBankData;
    } catch (error: unknown) {
        console.error(`Error fetching question bank with ID ${id}:`, error);
        if (isHttpError(error)) {
            throw error;
        }
        throw new HttpError("Failed to retrieve question bank by ID.", 500);
    }
};
