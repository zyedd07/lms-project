// controllers/questionBank.controller.ts
import { NextFunction, Request, Response } from 'express';
import HttpError from '../utils/httpError';
import QuestionBank from '../models/QuestionBank.model';
import { createClient } from '@supabase/supabase-js'; // This import should now work after npm install

// Supabase client setup using environment variables
// Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file and on Render
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
}

export const createQuestionBankController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user || !req.user.id) {
            throw new HttpError("Unauthorized: User ID missing.", 401);
        }
        if (!req.file) {
            throw new HttpError("PDF file is required for creating a question bank.", 400);
        }

        const { name, description } = req.body;
        if (!name) {
            throw new HttpError("Question bank name is required.", 400);
        }

        const fileBuffer = req.file.buffer;
        const originalFileName = req.file.originalname;
        const fileMimeType = req.file.mimetype;

        const supabaseFilePath = `question-banks/${req.user.id}/${Date.now()}-${originalFileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('question-banks')
            .upload(supabaseFilePath, fileBuffer, {
                contentType: fileMimeType,
                upsert: false,
            });

        if (uploadError) {
            console.error("Supabase Upload Error:", uploadError);
            throw new HttpError(`Failed to upload PDF file to storage: ${uploadError.message}`, 500);
        }

        const { data: publicUrlData } = supabase.storage
            .from('question-banks')
            .getPublicUrl(supabaseFilePath);

        const filePublicUrl = publicUrlData?.publicUrl;

        if (!filePublicUrl) {
            throw new HttpError("Failed to get public URL for uploaded file.", 500);
        }

        const newQuestionBank = await QuestionBank.create({
            name: name,
            description: description,
            filePath: filePublicUrl,
            fileName: originalFileName,
            uploadedBy: req.user.id,
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
        // Use 'as any' to allow access to properties not explicitly typed by Model<any,any>
        const questionBank = await QuestionBank.findByPk(id) as any;
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
        const { id } = req.params;
        if (!req.user || !req.user.id || !req.user.role) {
            throw new HttpError("Unauthorized: User information missing.", 401);
        }

        // Use 'as any' to allow access to properties
        const questionBank = await QuestionBank.findByPk(id) as any;
        if (!questionBank) {
            throw new HttpError("Question bank not found.", 404);
        }

        // Accessing 'uploadedBy' with 'as any'
        if (questionBank.uploadedBy !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'teacher') {
            throw new HttpError("Unauthorized to update this question bank.", 403);
        }

        const { name, description } = req.body;
        let newFileUrl: string | undefined = undefined;
        let newFileName: string | undefined = undefined;

        if (req.file) {
            // Accessing 'filePath' with 'as any'
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

            const fileBuffer = req.file.buffer;
            const originalFileName = req.file.originalname;
            const fileMimeType = req.file.mimetype;

            const supabaseFilePath = `question-banks/${req.user.id}/${Date.now()}-${originalFileName}`;

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

            const { data: publicUrlData } = supabase.storage
                .from('question-banks')
                .getPublicUrl(supabaseFilePath);

            newFileUrl = publicUrlData?.publicUrl;
            newFileName = originalFileName;

            if (!newFileUrl) {
                throw new HttpError("Failed to get public URL for new uploaded file.", 500);
            }
        }

        // Accessing and assigning properties with 'as any'
        await questionBank.update({
            name: name !== undefined ? name : (questionBank as any).name,
            description: description !== undefined ? description : (questionBank as any).description,
            filePath: newFileUrl !== undefined ? newFileUrl : (questionBank as any).filePath,
            fileName: newFileName !== undefined ? newFileName : (questionBank as any).fileName,
        });

        res.status(200).json({ success: true, data: questionBank });
    } catch (error) {
        next(error);
    }
};


export const deleteQuestionBankController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        if (!req.user || !req.user.id || !req.user.role) {
            throw new HttpError("Unauthorized: User information missing.", 401);
        }

        // Use 'as any' to allow access to properties
        const questionBank = await QuestionBank.findByPk(id) as any;
        if (!questionBank) {
            throw new HttpError("Question bank not found.", 404);
        }

        // Accessing 'uploadedBy' with 'as any'
        if (questionBank.uploadedBy !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'teacher') {
            throw new HttpError("Unauthorized to delete this question bank.", 403);
        }

        // Accessing 'filePath' with 'as any'
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

        await questionBank.destroy();

        res.status(200).json({ success: true, message: "Question bank deleted successfully." });
    } catch (error) {
        next(error);
    }
};