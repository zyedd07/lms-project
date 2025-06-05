// controllers/questionBank.controller.ts
import { NextFunction, Request, Response } from 'express';
import HttpError from '../utils/httpError'; // Adjusted path
import QuestionBank from '../models/QuestionBank.model'; // Adjusted path
import { createClient } from '@supabase/supabase-js';

// Supabase client setup using environment variables
const supabaseUrl = process.env.SUPABASE_URL!;
// Using SERVICE_ROLE_KEY for server-side operations for increased security and RLS bypass
// Ensure this key is NEVER exposed client-side.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use SERVICE_ROLE_KEY for server-side uploads
const supabase = createClient(supabaseUrl, supabaseKey);

// AuthenticatedRequest interface (as defined in your middleware/auth.ts)
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  // req.file will be automatically typed by the 'multer-shim.d.ts' Express.Request augmentation
}


export const createQuestionBankController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        // --- Authorization and Input Validation ---
        if (!req.user || !req.user.id) {
            throw new HttpError("Unauthorized: User ID missing.", 401);
        }
        if (!req.file) {
            throw new HttpError("PDF file is required for creating a question bank.", 400);
        }

        // Changed 'title' to 'name' to match QuestionBank model
        const { name, description } = req.body;
        if (!name) { // 'description' is optional in the model
            throw new HttpError("Question bank name is required.", 400);
        }

        // --- File Handling and Supabase Upload ---
        const fileBuffer = req.file.buffer; // File buffer from multer.memoryStorage()
        const originalFileName = req.file.originalname;
        const fileMimeType = req.file.mimetype;

        // Define a unique path within the Supabase bucket
        // Format: question-banks/{uploader_id}/{timestamp}-{original_filename}
        const supabaseFilePath = `question-banks/${req.user.id}/${Date.now()}-${originalFileName}`;

        // Upload the file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('question-banks') // Using the actual bucket name
            .upload(supabaseFilePath, fileBuffer, {
                contentType: fileMimeType,
                upsert: false, // Set to true to overwrite if a file with the same name/path exists
            });

        if (uploadError) {
            console.error("Supabase Upload Error:", uploadError);
            throw new HttpError(`Failed to upload PDF file to storage: ${uploadError.message}`, 500);
        }

        // Get the public URL of the uploaded file
        const { data: publicUrlData } = supabase.storage
            .from('question-banks') // Using the actual bucket name
            .getPublicUrl(supabaseFilePath);

        const filePublicUrl = publicUrlData?.publicUrl;

        if (!filePublicUrl) {
            throw new HttpError("Failed to get public URL for uploaded file.", 500);
        }

        // --- Create Question Bank Entry in Database ---
        const newQuestionBank = await QuestionBank.create({
            name: name, // Map 'name' from body to model's 'name'
            description: description,
            filePath: filePublicUrl, // Save the public URL in 'filePath'
            fileName: originalFileName, // Save the original filename
            uploadedBy: req.user.id, // Map 'uploadedBy' from authenticated user
            // 'uploadDate' and timestamps (createdAt, updatedAt) are handled by Sequelize model
        });

        res.status(201).json({ success: true, data: newQuestionBank });
    } catch (error) {
        next(error);
    }
};


export const getAllQuestionBanksController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const questionBanks = await QuestionBank.findAll();
        res.status(200).json({ success: true, data: questionBanks });
    } catch (error) {
        next(error);
    }
};


export const getQuestionBankByIdController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const questionBank = await QuestionBank.findByPk(id);
        if (!questionBank) {
            throw new HttpError("Question bank not found.", 404);
        }
        res.status(200).json({ success: true, data: questionBank });
    } catch (error) {
        next(error);
    }
};



export const updateQuestionBankController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        // --- Authorization and Input Validation ---
        const { id } = req.params;
        if (!req.user || !req.user.id || !req.user.role) {
            throw new HttpError("Unauthorized: User information missing.", 401);
        }

        const questionBank = await QuestionBank.findByPk(id);
        if (!questionBank) {
            throw new HttpError("Question bank not found.", 404);
        }

        // Check if the user updating is the creator or an admin/teacher
        // `uploadedBy` is the field name in the model
        if (questionBank.uploadedBy !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'teacher') {
            throw new HttpError("Unauthorized to update this question bank.", 403);
        }

        // Changed 'title' to 'name' to match QuestionBank model
        const { name, description } = req.body;
        let newFileUrl: string | undefined = undefined;
        let newFileName: string | undefined = undefined;

        // --- File Handling for Updates ---
        if (req.file) { // If a new file is uploaded
            // It's good practice to delete the old file from Supabase Storage first
            if (questionBank.filePath) {
                // Extract path from the stored public URL.
                // Assuming URL format: https://<supabase-url>/storage/v1/object/public/bucket_name/path_in_bucket
                const oldFilePathInBucket = questionBank.filePath.split('/').slice(8).join('/'); // Adjust slice index if your URL structure differs

                const { error: deleteError } = await supabase.storage
                    .from('question-banks') // Using the actual bucket name
                    .remove([oldFilePathInBucket]);

                if (deleteError) {
                    console.error("Supabase Delete Old File Error:", deleteError);
                    // Decide whether to throw an error or just log if old file deletion is not critical
                    // For now, throwing for strictness:
                    throw new HttpError(`Failed to delete old PDF file from storage: ${deleteError.message}`, 500);
                }
            }

            const fileBuffer = req.file.buffer;
            const originalFileName = req.file.originalname;
            const fileMimeType = req.file.mimetype;

            const supabaseFilePath = `question-banks/${req.user.id}/${Date.now()}-${originalFileName}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('question-banks') // Using the actual bucket name
                .upload(supabaseFilePath, fileBuffer, {
                    contentType: fileMimeType,
                    upsert: false,
                });

            if (uploadError) {
                console.error("Supabase Upload Error:", uploadError);
                throw new HttpError(`Failed to upload new PDF file to storage: ${uploadError.message}`, 500);
            }

            const { data: publicUrlData } = supabase.storage
                .from('question-banks') // Using the actual bucket name
                .getPublicUrl(supabaseFilePath);

            newFileUrl = publicUrlData?.publicUrl;
            newFileName = originalFileName; // Update fileName if a new file is provided

            if (!newFileUrl) {
                throw new HttpError("Failed to get public URL for new uploaded file.", 500);
            }
        }

        // --- Update Question Bank Entry in Database ---
        await questionBank.update({
            name: name !== undefined ? name : questionBank.name, // Update name if provided, otherwise keep existing
            description: description !== undefined ? description : questionBank.description,
            filePath: newFileUrl !== undefined ? newFileUrl : questionBank.filePath, // Update URL if new file was uploaded
            fileName: newFileName !== undefined ? newFileName : questionBank.fileName, // Update fileName if new file was uploaded
        });

        res.status(200).json({ success: true, data: questionBank });
    } catch (error) {
        next(error);
    }
};



export const deleteQuestionBankController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        // --- Authorization and Input Validation ---
        const { id } = req.params;
        if (!req.user || !req.user.id || !req.user.role) {
            throw new HttpError("Unauthorized: User information missing.", 401);
        }

        const questionBank = await QuestionBank.findByPk(id);
        if (!questionBank) {
            throw new HttpError("Question bank not found.", 404);
        }

        // Check if the user deleting is the creator or an admin/teacher
        if (questionBank.uploadedBy !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'teacher') {
            throw new HttpError("Unauthorized to delete this question bank.", 403);
        }

        // --- Delete File from Supabase Storage ---
        if (questionBank.filePath) {
            // Extract path from the stored public URL.
            const filePathInBucket = questionBank.filePath.split('/').slice(8).join('/'); // Adjust slice index if your URL structure differs

            const { error: deleteError } = await supabase.storage
                .from('question-banks') // Using the actual bucket name
                .remove([filePathInBucket]);

            if (deleteError) {
                console.error("Supabase Delete Error:", deleteError);
                // Decide whether to throw error or just log it if file deletion is not critical
                throw new HttpError(`Failed to delete PDF file from storage: ${deleteError.message}`, 500);
            }
        }

        // --- Delete Question Bank Entry from Database ---
        await questionBank.destroy();

        res.status(200).json({ success: true, message: "Question bank deleted successfully." });
    } catch (error) {
        next(error);
    }
};