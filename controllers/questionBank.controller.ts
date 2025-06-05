
import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth"; // Assuming this path is correct
import HttpError from "../utils/httpError";
import { Role } from "../utils/constants"; // Assuming Role enum is defined here
import {
    createQuestionBankService,
    getAllQuestionBanksService,
    getQuestionBankByIdService,
    updateQuestionBankService,
    deleteQuestionBankService
} from "../services/questionBank.services"; // Path to your new services file

export const createQuestionBankController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role;
        // Only ADMIN and TEACHER roles are authorized to create question banks
        if (role !== Role.ADMIN && role !== Role.TEACHER) {
            throw new HttpError("Unauthorized: Only Admins and Teachers can create question banks.", 403);
        }

        const { name, description, uploadedBy } = req.body;

        // Ensure a file is uploaded for creation
        const file = req.file; // Assumes multer or similar middleware has processed the file
        if (!file) {
            throw new HttpError("PDF file is required for creating a question bank.", 400);
        }

        // The filePath would be where multer saves the file (e.g., req.file.path for local, req.file.location for S3/Supabase Storage)
        const filePath = (file as any).location || file.path; // Use .location if using a cloud storage multer adapter, otherwise .path
        const fileName = file.originalname;

        if (!name || !filePath || !fileName) {
            throw new HttpError("Question bank name, file path, and file name are required.", 400);
        }

        // Call the service to create the question bank
        const newQuestionBank = await createQuestionBankService({
            name,
            description,
            filePath,
            fileName,
            uploadedBy: uploadedBy || req.user?.id, // Use provided uploadedBy or authenticated user's ID
        });

        res.status(201).json({ success: true, data: newQuestionBank });
    } catch (error) {
        next(error);
    }
};

export const getAllQuestionBanksController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // No authorization check for fetching all banks, assuming public visibility or handled by middleware for private banks
        const questionBanks = await getAllQuestionBanksService();
        res.status(200).json({ success: true, data: questionBanks });
    } catch (error) {
        next(error);
    }
};

export const getQuestionBankByIdController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        if (!id) {
            throw new HttpError("Question bank ID is required.", 400);
        }
        // No authorization check for fetching by ID, assuming public visibility or handled by middleware
        const questionBank = await getQuestionBankByIdService(id);
        res.status(200).json({ success: true, data: questionBank });
    } catch (error) {
        next(error);
    }
};

export const updateQuestionBankController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role;
        // Only ADMIN and TEACHER roles are authorized to update question banks
        if (role !== Role.ADMIN && role !== Role.TEACHER) {
            throw new HttpError("Unauthorized: Only Admins and Teachers can update question banks.", 403);
        }

        const { id } = req.params;
        // Extract fields that can be updated. Multer handles 'file' separately.
        const { name, description, uploadedBy } = req.body;

        const updateParams: { name?: string; description?: string; filePath?: string; fileName?: string; uploadedBy?: string } = {
            name,
            description,
            uploadedBy
        };

        // Check if a new file is uploaded
        const file = req.file;
        if (file) {
            // Update file path and name if a new file is provided
            updateParams.filePath = (file as any).location || file.path;
            updateParams.fileName = file.originalname;
        }

        if (Object.keys(updateParams).length === 0) {
            throw new HttpError("No update parameters provided.", 400);
        }

        const result = await updateQuestionBankService(id, updateParams);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const deleteQuestionBankController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role;
        // Only ADMIN and TEACHER roles are authorized to delete question banks
        if (role !== Role.ADMIN && role !== Role.TEACHER) {
            throw new HttpError("Unauthorized: Only Admins and Teachers can delete question banks.", 403);
        }

        const { id } = req.params;
        if (!id) {
            throw new HttpError("Question bank ID is required.", 400);
        }

        const result = await deleteQuestionBankService(id);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};
