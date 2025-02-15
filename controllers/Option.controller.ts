import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import HttpError from "../utils/httpError";
import { createOptionService, getOptionsByQuestionService, updateOptionService, deleteOptionService } from "../services/Option.service";
import { Role } from "../utils/constants";

export const createOptionController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role;
        if (role !== Role.ADMIN && role !== Role.TEACHER) {
            throw new HttpError("Unauthorized", 403);
        }
        const { questionId, text, isCorrect } = req.body;
        if (!questionId || !text || typeof isCorrect !== "boolean") {
            throw new HttpError("Question ID, option text, and isCorrect flag are required", 400);
        }
        const newOption = await createOptionService({ questionId, text, isCorrect });
        res.status(201).json(newOption);
    } catch (error) {
        next(error);
    }
};

export const getOptionsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { questionId } = req.query;
        if (!questionId) {
            throw new HttpError("Question ID is required", 400);
        }
        const options = await getOptionsByQuestionService(questionId as string);
        res.status(200).json({ success: true, data: options });
    } catch (error) {
        next(error);
    }
};

export const updateOptionController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { text, isCorrect } = req.body;
        const role = req.user?.role;
        if (role !== Role.ADMIN && role !== Role.TEACHER) {
            throw new HttpError("Unauthorized", 403);
        }
        const result = await updateOptionService(id, { text, isCorrect });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const deleteOptionController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const role = req.user?.role;
        if (role !== Role.ADMIN && role !== Role.TEACHER) {
            throw new HttpError("Unauthorized", 403);
        }
        const result = await deleteOptionService(id);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};
