
import QuestionBank from "../models/QuestionBank.model";
import HttpError from "../utils/httpError";
import {
    CreateQuestionBankServiceParams,
    UpdateQuestionBankServiceParams,
    QuestionBankData // Assuming you have this type defined for return values
} from "../utils/types"; // Adjust path as needed

// Create a new Question Bank
export const createQuestionBankService = async (
    params: CreateQuestionBankServiceParams
): Promise<QuestionBankData> => {
    try {
        // Ensure required fields are present
        if (!params.name || !params.filePath || !params.fileName) {
            throw new HttpError("Name, file path, and file name are required to create a question bank.", 400);
        }

        const newQuestionBank = await QuestionBank.create({
            name: params.name,
            description: params.description,
            filePath: params.filePath,
            fileName: params.fileName,
            uploadedBy: params.uploadedBy,
            // uploadDate is automatically set by defaultValue in the model
        });

        // Cast to QuestionBankData for consistent return type, assuming model attributes match
        return newQuestionBank.toJSON() as QuestionBankData;
    } catch (error) {
        // Log the error for debugging purposes (optional, but good practice)
        console.error("Error creating question bank:", error);
        // Re-throw to be caught by the controller/error middleware
        if (error instanceof HttpError) {
            throw error;
        }
        // Handle unique constraint violation for 'name'
        if (error.name === 'SequelizeUniqueConstraintError') {
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

        // Apply updates from params
        await questionBank.update(params);

        // Fetch the updated question bank to return its latest state
        const updatedQuestionBank = await QuestionBank.findByPk(id);

        if (!updatedQuestionBank) { // Should not happen if update was successful
            throw new HttpError("Failed to retrieve updated question bank.", 500);
        }

        return updatedQuestionBank.toJSON() as QuestionBankData;
    } catch (error) {
        console.error(`Error updating question bank with ID ${id}:`, error);
        if (error instanceof HttpError) {
            throw error;
        }
         if (error.name === 'SequelizeUniqueConstraintError' && params.name) {
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
    } catch (error) {
        console.error(`Error deleting question bank with ID ${id}:`, error);
        if (error instanceof HttpError) {
            throw error;
        }
        throw new HttpError("Failed to delete question bank.", 500);
    }
};

// Get all Question Banks
export const getAllQuestionBanksService = async (): Promise<QuestionBankData[]> => {
    try {
        const questionBanks = await QuestionBank.findAll();
        // Map to QuestionBankData[] for consistent return type
        return questionBanks.map(qb => qb.toJSON() as QuestionBankData);
    } catch (error) {
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
    } catch (error) {
        console.error(`Error fetching question bank with ID ${id}:`, error);
        if (error instanceof HttpError) {
            throw error;
        }
        throw new HttpError("Failed to retrieve question bank by ID.", 500);
    }
};
