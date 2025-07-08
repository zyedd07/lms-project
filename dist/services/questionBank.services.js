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
exports.getQuestionBankByIdService = exports.getAllQuestionBanksService = exports.deleteQuestionBankService = exports.updateQuestionBankService = exports.createQuestionBankService = void 0;
const QuestionBank_model_1 = __importDefault(require("../models/QuestionBank.model"));
const httpError_1 = __importDefault(require("../utils/httpError"));
const User_model_1 = __importDefault(require("../models/User.model")); // Import the User model
// Helper function to safely narrow 'unknown' error type
function isHttpError(error) {
    return error instanceof httpError_1.default;
}
function isSequelizeUniqueConstraintError(error) {
    return typeof error === 'object' && error !== null && 'name' in error && error.name === 'SequelizeUniqueConstraintError';
}
/**
 * Creates a new Question Bank record in the database.
 * @param params - Contains all necessary data for creating a question bank, including the new price and uploaderId.
 * @returns A Promise that resolves to the created QuestionBankData.
 * @throws HttpError if required parameters are missing, if price is invalid, or if a unique constraint is violated.
 * @throws HttpError with 500 status for other internal errors.
 */
const createQuestionBankService = (params // This type should now include 'uploadedBy'
) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Basic validation for core required fields
        if (!params.name || !params.filePath || !params.fileName || !params.uploadedBy) { // FIX: Added uploadedBy check
            throw new httpError_1.default("Name, file path, file name, and uploader are required to create a question bank.", 400);
        }
        // Validate price - ensure it's a number and non-negative
        if (typeof params.price !== 'number' || isNaN(params.price) || params.price < 0) {
            throw new httpError_1.default("Price is required and must be a non-negative number.", 400);
        }
        const newQuestionBank = yield QuestionBank_model_1.default.create({
            name: params.name,
            description: params.description,
            filePath: params.filePath,
            fileName: params.fileName,
            price: params.price,
            uploadedBy: params.uploadedBy, // FIX: Pass the uploadedBy field
            // uploadDate will be set by defaultValue in the model
        });
        // Return the created question bank as plain data
        return newQuestionBank.toJSON();
    }
    catch (error) {
        console.error("Error creating question bank:", error);
        if (isHttpError(error)) {
            throw error; // Re-throw known HTTP errors
        }
        if (isSequelizeUniqueConstraintError(error)) {
            // Handle unique constraint violation specifically for the name
            throw new httpError_1.default(`A question bank with the name '${params.name}' already exists.`, 409);
        }
        // Catch-all for unexpected errors
        throw new httpError_1.default("Failed to create question bank.", 500);
    }
});
exports.createQuestionBankService = createQuestionBankService;
/**
 * Updates an existing Question Bank record in the database.
 * @param id - The ID of the question bank to update.
 * @param params - An object containing the fields to update, including price.
 * @returns A Promise that resolves to the updated QuestionBankData.
 * @throws HttpError if the question bank is not found, if price is invalid, or if a unique constraint is violated.
 * @throws HttpError with 500 status for other internal errors.
 */
const updateQuestionBankService = (id, params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Find the question bank by its ID
        const questionBank = yield QuestionBank_model_1.default.findOne({ where: { id } });
        if (!questionBank) {
            throw new httpError_1.default("Question Bank not found.", 404);
        }
        // Validate price if it's provided in the update parameters
        if (params.price !== undefined) {
            if (typeof params.price !== 'number' || isNaN(params.price) || params.price < 0) {
                throw new httpError_1.default("Price must be a non-negative number.", 400);
            }
        }
        // Update the question bank with the provided parameters
        // Sequelize will only update fields present in the params object
        yield questionBank.update(params);
        // Fetch the updated question bank to ensure we return the latest state
        // FIX: Include uploader data when fetching the updated question bank
        const updatedQuestionBank = yield QuestionBank_model_1.default.findByPk(id, {
            include: [{
                    model: User_model_1.default,
                    as: 'uploader', // This alias must match the 'as' in your QuestionBank model association
                    attributes: ['id', 'name', 'email'] // Select specific user attributes
                }]
        });
        if (!updatedQuestionBank) {
            // This case indicates a serious issue where the update succeeded but retrieval failed
            throw new httpError_1.default("Failed to retrieve updated question bank.", 500);
        }
        // Return the updated question bank as plain data
        return updatedQuestionBank.toJSON();
    }
    catch (error) {
        console.error(`Error updating question bank with ID ${id}:`, error);
        if (isHttpError(error)) {
            throw error;
        }
        if (isSequelizeUniqueConstraintError(error) && params.name) {
            // Handle unique constraint violation specifically if the name was updated
            throw new httpError_1.default(`A question bank with the name '${params.name}' already exists.`, 409);
        }
        throw new httpError_1.default("Failed to update question bank.", 500);
    }
});
exports.updateQuestionBankService = updateQuestionBankService;
/**
 * Deletes a Question Bank record from the database.
 * @param id - The ID of the question bank to delete.
 * @returns A Promise that resolves with a success message.
 * @throws HttpError if the question bank is not found.
 * @throws HttpError with 500 status for other internal errors.
 */
const deleteQuestionBankService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const questionBank = yield QuestionBank_model_1.default.findOne({ where: { id } });
        if (!questionBank) {
            throw new httpError_1.default("Question Bank not found.", 404);
        }
        yield questionBank.destroy();
        return { message: "Question Bank deleted successfully." };
    }
    catch (error) {
        console.error(`Error deleting question bank with ID ${id}:`, error);
        if (isHttpError(error)) {
            throw error;
        }
        throw new httpError_1.default("Failed to delete question bank.", 500);
    }
});
exports.deleteQuestionBankService = deleteQuestionBankService;
/**
 * Retrieves all Question Bank records from the database.
 * @returns A Promise that resolves to an array of QuestionBankData.
 * @throws HttpError with 500 status for internal errors during retrieval.
 */
const getAllQuestionBanksService = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // FIX: Include the User model for uploader information
        const questionBanks = yield QuestionBank_model_1.default.findAll({
            include: [{
                    model: User_model_1.default,
                    as: 'uploader', // This alias must match the 'as' in your QuestionBank model association
                    required: false, // Set to true if a QB MUST have an uploader
                    attributes: ['id', 'name', 'email'] // Select specific user attributes
                }]
        });
        // Map Sequelize model instances to plain data objects
        return questionBanks.map(qb => qb.toJSON());
    }
    catch (error) {
        console.error("Error fetching all question banks:", error);
        throw new httpError_1.default("Failed to retrieve question banks.", 500);
    }
});
exports.getAllQuestionBanksService = getAllQuestionBanksService;
/**
 * Retrieves a single Question Bank record by its ID.
 * @param id - The ID of the question bank to retrieve.
 * @returns A Promise that resolves to the QuestionBankData.
 * @throws HttpError if the question bank is not found.
 * @throws HttpError with 500 status for other internal errors.
 */
const getQuestionBankByIdService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // FIX: Include the User model for uploader information
        const questionBank = yield QuestionBank_model_1.default.findByPk(id, {
            include: [{
                    model: User_model_1.default,
                    as: 'uploader', // This alias must match the 'as' in your QuestionBank model association
                    required: false,
                    attributes: ['id', 'name', 'email']
                }]
        });
        if (!questionBank) {
            throw new httpError_1.default("Question Bank not found.", 404);
        }
        // Return the found question bank as plain data
        return questionBank.toJSON();
    }
    catch (error) {
        console.error(`Error fetching question bank with ID ${id}:`, error);
        if (isHttpError(error)) {
            throw error;
        }
        throw new httpError_1.default("Failed to retrieve question bank by ID.", 500);
    }
});
exports.getQuestionBankByIdService = getQuestionBankByIdService;
