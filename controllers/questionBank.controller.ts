import { NextFunction, Request, Response } from 'express';
import HttpError from '../utils/httpError';

import { QuestionBankData } from '../utils/types'; // Import QuestionBankData directly from utils/types

import {
    createQuestionBankService,
    getAllQuestionBanksService,
    getQuestionBankByIdService,
    updateQuestionBankService,
    deleteQuestionBankService
} from '../services/questionBank.services';

// AuthenticatedRequest interface (as defined in your middleware/auth.ts)
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}

/**
 * Creates a new Question Bank record in the database, using a provided file URL.
 * The actual file upload to storage is assumed to be handled by a separate media service/process.
 */
export const createQuestionBankController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        // --- Authorization and Data Validation ---
        const uploaderId = req.user?.id; // Get uploader ID from authenticated user
        if (!uploaderId) {
            throw new HttpError("Unauthorized: User ID missing.", 401);
        }

        const { name, description, price, filePath } = req.body;

        if (!name) {
            throw new HttpError("Question bank name is required.", 400);
        }
        if (!filePath) {
            throw new HttpError("PDF file URL is required for creating a question bank.", 400);
        }

        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
            throw new HttpError("Price is required and must be a non-negative number.", 400);
        }

        // --- UPDATED FILENAME EXTRACTION ---
        const urlObj = new URL(filePath);
        const rawFileName = urlObj.pathname.split('/').pop();
        const fileName = rawFileName ? rawFileName.split('?')[0].split('#')[0] : 'untitled_file';
        // --- END UPDATED FILENAME EXTRACTION ---

        // --- Call Service to Save Question Bank Details to Database ---
        const newQuestionBank = await createQuestionBankService({
            name: name,
            description: description,
            filePath: filePath, // Pass the full URL as filePath
            fileName: fileName, // Pass the extracted filename
            price: parsedPrice,
            uploadedBy: uploaderId, // Pass the uploaderId to the service
        });

        res.status(201).json({ success: true, data: newQuestionBank });
    } catch (error) {
        console.error("Error caught in createQuestionBankController (before passing to middleware):", error);
        next(error);
    }
};

/**
 * Retrieves all Question Banks from the database, including uploader information.
 */
export const getAllQuestionBanksController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const questionBanks = await getAllQuestionBanksService();
        res.status(200).json({ success: true, data: questionBanks });
    } catch (error) {
        next(error);
    }
};

/**
 * Retrieves a single Question Bank by its ID, including uploader information.
 */
export const getQuestionBankByIdController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const questionBank: QuestionBankData = await getQuestionBankByIdService(id);

        if (!questionBank) {
            throw new HttpError("Question bank not found.", 404);
        }
        res.status(200).json({ success: true, data: questionBank });
    } catch (error) {
        next(error);
    }
};

/**
 * Updates an existing Question Bank record in the database.
 * It now accepts a new file URL from the request body if the file needs to be changed.
 * The deletion/upload of the actual file from storage is assumed to be handled by a separate media service.
 */
export const updateQuestionBankController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        // --- Authorization ---
        const userId = req.user?.id;
        const userRole = req.user?.role;

        if (!userId || !userRole) {
            throw new HttpError("Unauthorized: User information missing.", 401);
        }

        // Find the question bank to check authorization
        const questionBank: QuestionBankData = await getQuestionBankByIdService(id);
        if (!questionBank) {
            throw new HttpError("Question bank not found.", 404);
        }

        // Check if the user is authorized to update (uploader, admin, or teacher)
        if ((questionBank as any).uploader?.id !== userId && userRole !== 'admin' && userRole !== 'teacher') {
            throw new HttpError("Unauthorized to update this question bank.", 403);
        }

        const { name, description, price, filePath } = req.body;

        // Prepare fields for update
        const updateFields: { [key: string]: any } = {};

        if (name !== undefined) updateFields.name = name;
        if (description !== undefined) updateFields.description = description;

        // Handle price update
        if (price !== undefined) {
            const parsedPrice = parseFloat(price);
            if (isNaN(parsedPrice) || parsedPrice < 0) {
                throw new HttpError("Price must be a non-negative number.", 400);
            }
            updateFields.price = parsedPrice;
        }

        // Handle file URL update (if a new URL is provided)
        if (filePath !== undefined) {
            if (typeof filePath !== 'string' || !filePath.startsWith('http')) {
                throw new HttpError("PDF File URL must be a valid URL (start with http/https).", 400);
            }
            updateFields.filePath = filePath;
            // --- UPDATED FILENAME EXTRACTION FOR UPDATE ---
            const urlObj = new URL(filePath);
            const rawFileName = urlObj.pathname.split('/').pop();
            updateFields.fileName = rawFileName ? rawFileName.split('?')[0].split('#')[0] : 'untitled_file';
            // --- END UPDATED FILENAME EXTRACTION ---
        }

        // --- Perform Database Update via Service ---
        const updatedQuestionBank = await updateQuestionBankService(id, updateFields);

        res.status(200).json({ success: true, data: updatedQuestionBank });
    } catch (error) {
        next(error);
    }
};

/**
 * Deletes a Question Bank record from the database.
 * The deletion of the associated PDF file from storage is assumed to be handled
 * by a separate media service or a manual process if no longer referenced.
 */
export const deleteQuestionBankController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        // --- Authorization ---
        const userId = req.user?.id;
        const userRole = req.user?.role;

        if (!userId || !userRole) {
            throw new HttpError("Unauthorized: User information missing.", 401);
        }

        // Find the question bank to check authorization
        const questionBank: QuestionBankData = await getQuestionBankByIdService(id);
        if (!questionBank) {
            throw new HttpError("Question bank not found.", 404);
        }

        // Check if the user is authorized to delete (uploader, admin, or teacher)
        if ((questionBank as any).uploader?.id !== userId && userRole !== 'admin' && userRole !== 'teacher') {
            throw new HttpError("Unauthorized to delete this question bank.", 403);
        }

        // --- Delete Question Bank Record from Database via Service ---
        const response = await deleteQuestionBankService(id);

        res.status(200).json({ success: true, message: response.message });
    } catch (error) {
        next(error);
    }
};