import QuestionBank from "../models/QuestionBank.model";
import HttpError from "../utils/httpError";
import {
    CreateQuestionBankServiceParams,
    UpdateQuestionBankServiceParams,
    QuestionBankData
} from "../utils/types";

// Helper function to safely narrow 'unknown' error type
function isHttpError(error: unknown): error is HttpError {
    return error instanceof HttpError;
}

function isSequelizeUniqueConstraintError(error: unknown): error is { name: string; message: string } {
    return typeof error === 'object' && error !== null && 'name' in error && (error as any).name === 'SequelizeUniqueConstraintError';
}

// Create a new Question Bank
export const createQuestionBankService = async (
    params: CreateQuestionBankServiceParams
): Promise<QuestionBankData> => {
    try {
        if (!params.name || !params.filePath || !params.fileName) {
            throw new HttpError("Name, file path, and file name are required to create a question bank.", 400);
        }

        const newQuestionBank = await QuestionBank.create({
            name: params.name,
            description: params.description,
            filePath: params.filePath,
            fileName: params.fileName,
            uploadedBy: params.uploadedBy,
        });

        return newQuestionBank.toJSON() as QuestionBankData;
    } catch (error: unknown) { // Explicitly type as unknown
        console.error("Error creating question bank:", error);
        if (isHttpError(error)) {
            throw error;
        }
        if (isSequelizeUniqueConstraintError(error)) {
             throw new HttpError(`A question bank with the name '${params.name}' already exists.`, 409);
        }
        throw new HttpError("Failed to create question bank.", 500);
    }
};

// Update an existing Question Bank
export const updateQuestionBankService = async (
    id: string,
    params: UpdateQuestionBankServiceParams
): Promise<QuestionBankData> => {
    try {
        const questionBank = await QuestionBank.findOne({ where: { id } });

        if (!questionBank) {
            throw new HttpError("Question Bank not found.", 404);
        }

        await questionBank.update(params);

        const updatedQuestionBank = await QuestionBank.findByPk(id);

        if (!updatedQuestionBank) {
            throw new HttpError("Failed to retrieve updated question bank.", 500);
        }

        return updatedQuestionBank.toJSON() as QuestionBankData;
    } catch (error: unknown) { // Explicitly type as unknown
        console.error(`Error updating question bank with ID ${id}:`, error);
        if (isHttpError(error)) {
            throw error;
        }
        if (isSequelizeUniqueConstraintError(error) && params.name) {
             throw new HttpError(`A question bank with the name '${params.name}' already exists.`, 409);
        }
        throw new HttpError("Failed to update question bank.", 500);
    }
};

// Delete a Question Bank
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
    } catch (error: unknown) { // Explicitly type as unknown
        console.error(`Error deleting question bank with ID ${id}:`, error);
        if (isHttpError(error)) {
            throw error;
        }
        throw new HttpError("Failed to delete question bank.", 500);
    }
};

// Get all Question Banks
export const getAllQuestionBanksService = async (): Promise<QuestionBankData[]> => {
    try {
        const questionBanks = await QuestionBank.findAll();
        return questionBanks.map(qb => qb.toJSON() as QuestionBankData);
    } catch (error: unknown) { // Explicitly type as unknown
        console.error("Error fetching all question banks:", error);
        throw new HttpError("Failed to retrieve question banks.", 500);
    }
};

// Get a single Question Bank by ID
export const getQuestionBankByIdService = async (
    id: string
): Promise<QuestionBankData> => {
    try {
        const questionBank = await QuestionBank.findByPk(id);

        if (!questionBank) {
            throw new HttpError("Question Bank not found.", 404);
        }

        return questionBank.toJSON() as QuestionBankData;
    } catch (error: unknown) { // Explicitly type as unknown
        console.error(`Error fetching question bank with ID ${id}:`, error);
        if (isHttpError(error)) {
            throw error;
        }
        throw new HttpError("Failed to retrieve question bank by ID.", 500);
    }
};