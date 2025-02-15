import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import HttpError from "../utils/httpError";
import { createQuestionService, getQuestionsByTestSeriesService, updateQuestionService, deleteQuestionService } from "../services/Question.service";
import { Role } from "../utils/constants";

export const createQuestionController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role;
        if (role !== Role.ADMIN && role !== Role.TEACHER) {
            throw new HttpError("Unauthorized", 403);
        }
        const { testSeriesId, text } = req.body;
        if (!testSeriesId || !text) {
            throw new HttpError("TestSeries ID and question text are required", 400);
        }
        const newQuestion = await createQuestionService({ testSeriesId, text });
        res.status(201).json(newQuestion);
    } catch (error) {
        next(error);
    }
};

export const getQuestionsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { testSeriesId } = req.query;
        if (!testSeriesId) {
            throw new HttpError("TestSeries ID is required", 400);
        }
        const questions = await getQuestionsByTestSeriesService(testSeriesId as string);
        res.status(200).json({ success: true, data: questions });
    } catch (error) {
        next(error);
    }
};

export const updateQuestionController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { text } = req.body;
        const role = req.user?.role;
        if (role !== Role.ADMIN && role !== Role.TEACHER) {
            throw new HttpError("Unauthorized", 403);
        }
        const result = await updateQuestionService(id, { text });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const deleteQuestionController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const role = req.user?.role;
        if (role !== Role.ADMIN && role !== Role.TEACHER) {
            throw new HttpError("Unauthorized", 403);
        }
        const result = await deleteQuestionService(id);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};
