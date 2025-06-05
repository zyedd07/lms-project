import { NextFunction, Request, Response } from "express"; // Import Request from express
import { AuthenticatedRequest } from "../middleware/auth"; // Your custom AuthRequest type
import HttpError from "../utils/httpError";
import { Role } from "../utils/constants";
import {
    createQuestionBankService,
    getAllQuestionBanksService,
    getQuestionBankByIdService,
    updateQuestionBankService,
    deleteQuestionBankService
} from "../services/questionBank.services";

export const createQuestionBankController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role;
        if (role !== Role.ADMIN && role !== Role.TEACHER) {
            throw new HttpError("Unauthorized: Only Admins and Teachers can create question banks.", 403);
        }

        const { name, description, uploadedBy } = req.body;

        const file = req.file; // TypeScript now knows about req.file
        if (!file) {
            throw new HttpError("PDF file is required for creating a question bank.", 400);
        }

        // Use file.path for local storage or file.location if using a cloud storage multer adapter
        const filePath = (file as any).location || file.path; // Keep `as any` for .location if type definition doesn't include it directly
        const fileName = file.originalname;

        if (!name || !filePath || !fileName) {
            throw new HttpError("Question bank name, file path, and file name are required.", 400);
        }

        const newQuestionBank = await createQuestionBankService({
            name,
            description,
            filePath,
            fileName,
            uploadedBy: uploadedBy || req.user?.id,
        });

        res.status(201).json({ success: true, data: newQuestionBank });
    } catch (error) {
        next(error);
    }
};

export const getAllQuestionBanksController = async (req: Request, res: Response, next: NextFunction) => {
    try {
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
        const questionBank = await getQuestionBankByIdService(id);
        res.status(200).json({ success: true, data: questionBank });
    } catch (error) {
        next(error);
    }
};

export const updateQuestionBankController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role;
        if (role !== Role.ADMIN && role !== Role.TEACHER) {
            throw new HttpError("Unauthorized: Only Admins and Teachers can update question banks.", 403);
        }

        const { id } = req.params;
        const { name, description, uploadedBy } = req.body;

        const updateParams: { name?: string; description?: string; filePath?: string; fileName?: string; uploadedBy?: string } = {
            name,
            description,
            uploadedBy
        };

        const file = req.file; // TypeScript now knows about req.file
        if (file) {
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