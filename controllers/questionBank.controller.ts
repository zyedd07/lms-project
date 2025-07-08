import { NextFunction, Request, Response } from 'express';
import HttpError from '../utils/httpError';
import QuestionBank from '../models/QuestionBank.model'; // Ensure this import is correct
import { createClient } from '@supabase/supabase-js';
import {
    createQuestionBankService,
    getAllQuestionBanksService,
    getQuestionBankByIdService,
    updateQuestionBankService,
    deleteQuestionBankService
} from '../services/questionBank.services'; // Import service functions

// Supabase client setup using environment variables
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Using SERVICE_ROLE_KEY for server-side
const supabase = createClient(supabaseUrl, supabaseKey);

// AuthenticatedRequest interface (as defined in your middleware/auth.ts)
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
    file?: Express.Multer.File; // Add file property for multer
}

/**
 * Creates a new Question Bank, uploads the associated PDF file to Supabase Storage,
 * and saves the question bank details (including price and uploader) to the database.
 */
export const createQuestionBankController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        // --- Authorization and File Validation ---
        const uploaderId = req.user?.id; // Get uploader ID from authenticated user
        if (!uploaderId) {
            throw new HttpError("Unauthorized: User ID missing.", 401);
        }
        if (!req.file) {
            throw new HttpError("PDF file is required for creating a question bank.", 400);
        }

        // --- Extract and Validate Request Body Data ---
        const { name, description, price } = req.body; // Destructure price from req.body

        if (!name) {
            throw new HttpError("Question bank name is required.", 400);
        }

        // Parse and validate price
        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
            throw new HttpError("Price is required and must be a non-negative number.", 400);
        }

        // --- File Handling and Supabase Upload ---
        const fileBuffer = req.file.buffer;
        const originalFileName = req.file.originalname;
        const fileMimeType = req.file.mimetype;

        // Create a unique path for the file in Supabase Storage
        const supabaseFilePath = `question-banks/${uploaderId}/${Date.now()}-${originalFileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('question-banks')
            .upload(supabaseFilePath, fileBuffer, {
                contentType: fileMimeType,
                upsert: false, // Do not overwrite existing files
            });

        if (uploadError) {
            console.error("Supabase Upload Error:", uploadError);
            throw new HttpError(`Failed to upload PDF file to storage: ${uploadError.message}`, 500);
        }

        // Get the public URL for the uploaded file
        const { data: publicUrlData } = supabase.storage
            .from('question-banks')
            .getPublicUrl(supabaseFilePath);

        const filePublicUrl = publicUrlData?.publicUrl;

        if (!filePublicUrl) {
            throw new HttpError("Failed to get public URL for uploaded file.", 500);
        }

        // --- Call Service to Save Question Bank Details to Database ---
        const newQuestionBank = await createQuestionBankService({
            name: name,
            description: description,
            filePath: filePublicUrl,
            fileName: originalFileName,
            price: parsedPrice,
            uploadedBy: uploaderId, // Pass the uploaderId to the service
        });

        res.status(201).json({ success: true, data: newQuestionBank });
    } catch (error) {
        next(error); // Pass error to the error handling middleware
    }
};

/**
 * Retrieves all Question Banks from the database, including uploader information.
 */
export const getAllQuestionBanksController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // FIX: Call the service function that includes uploader data
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
        // FIX: Call the service function that includes uploader data
        const questionBank = await getQuestionBankByIdService(id);
        
        if (!questionBank) {
            throw new HttpError("Question bank not found.", 404);
        }
        res.status(200).json({ success: true, data: questionBank });
    } catch (error) {
        next(error);
    }
};

/**
 * Updates an existing Question Bank, optionally replacing its PDF file,
 * and updates its details (including price) in the database.
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
        // Cast to 'any' to allow access to 'uploader' property if QuestionBankData type is not yet updated
        const questionBank = await getQuestionBankByIdService(id) as any;
        if (!questionBank) {
            throw new HttpError("Question bank not found.", 404);
        }

        // Check if the user is authorized to update (uploader, admin, or teacher)
        if (questionBank.uploader?.id !== userId && userRole !== 'admin' && userRole !== 'teacher') {
            throw new HttpError("Unauthorized to update this question bank.", 403);
        }

        const { name, description, price } = req.body;
        let filePublicUrl: string | undefined = undefined;
        let originalFileName: string | undefined = undefined;

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

        // --- Handle File Replacement (if a new file is provided) ---
        if (req.file) {
            // Delete old file from Supabase Storage
            if (questionBank.filePath) {
                const oldFilePathInBucket = questionBank.filePath.split('/').slice(8).join('/');
                const { error: deleteError } = await supabase.storage
                    .from('question-banks')
                    .remove([oldFilePathInBucket]);

                if (deleteError) {
                    console.error("Supabase Delete Old File Error:", deleteError);
                    throw new HttpError(`Failed to delete old PDF file from storage: ${deleteError.message}`, 500);
                }
            }

            // Upload the new file
            const fileBuffer = req.file.buffer;
            originalFileName = req.file.originalname;
            const fileMimeType = req.file.mimetype;

            const supabaseFilePath = `question-banks/${userId}/${Date.now()}-${originalFileName}`; // Use current user's ID for new file path

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('question-banks')
                .upload(supabaseFilePath, fileBuffer, {
                    contentType: fileMimeType,
                    upsert: false,
                });

            if (uploadError) {
                console.error("Supabase Upload Error:", uploadError);
                throw new HttpError(`Failed to upload new PDF file to storage: ${uploadError.message}`, 500);
            }

            // Get public URL for the new file
            const { data: publicUrlData } = supabase.storage
                .from('question-banks')
                .getPublicUrl(supabaseFilePath);

            filePublicUrl = publicUrlData?.publicUrl;

            if (!filePublicUrl) {
                throw new HttpError("Failed to get public URL for new uploaded file.", 500);
            }

            updateFields.filePath = filePublicUrl;
            updateFields.fileName = originalFileName;
        }

        // --- Perform Database Update via Service ---
        // FIX: Call the updateQuestionBankService
        const updatedQuestionBank = await updateQuestionBankService(id, updateFields);

        res.status(200).json({ success: true, data: updatedQuestionBank });
    } catch (error) {
        next(error);
    }
};

/**
 * Deletes a Question Bank record and its associated PDF file from Supabase Storage.
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
        // Cast to 'any' to allow access to 'uploader' property if QuestionBankData type is not yet updated
        const questionBank = await getQuestionBankByIdService(id) as any;
        if (!questionBank) {
            throw new HttpError("Question bank not found.", 404);
        }

        // Check if the user is authorized to delete (uploader, admin, or teacher)
        if (questionBank.uploader?.id !== userId && userRole !== 'admin' && userRole !== 'teacher') {
            throw new HttpError("Unauthorized to delete this question bank.", 403);
        }

        // --- Delete File from Supabase Storage ---
        if (questionBank.filePath) {
            const filePathInBucket = questionBank.filePath.split('/').slice(8).join('/');

            const { error: deleteError } = await supabase.storage
                .from('question-banks')
                .remove([filePathInBucket]);

            if (deleteError) {
                console.error("Supabase Delete Error:", deleteError);
                throw new HttpError(`Failed to delete PDF file from storage: ${deleteError.message}`, 500);
            }
        }

        // --- Delete Question Bank Record from Database via Service ---
        // FIX: Call the deleteQuestionBankService
        const response = await deleteQuestionBankService(id);

        res.status(200).json({ success: true, message: response.message });
    } catch (error) {
        next(error);
    }
};
