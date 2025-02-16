import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import HttpError from "../utils/httpError";
import { 
  createQuestionService, 
  getQuestionsByTestService, 
  updateQuestionService, 
  deleteQuestionService 
} from "../services/Question.service";
import { Role } from "../utils/constants";

export const createQuestionController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role;
        if (role !== Role.ADMIN && role !== Role.TEACHER) {
            throw new HttpError("Unauthorized", 403);
        }
        // Now we expect testId and questionText in the request body
        const { testId, questionText } = req.body;
        if (!testId || !questionText) {
            throw new HttpError("Test ID and question text are required", 400);
        }
        const newQuestion = await createQuestionService({ testId, questionText });
        res.status(201).json(newQuestion);
    } catch (error) {
        next(error);
    }
};

export const getQuestionsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Using testId in query parameters instead of testSeriesId
        const { testId } = req.query;
        if (!testId) {
            throw new HttpError("Test ID is required", 400);
        }
        const questions = await getQuestionsByTestService(testId as string);
        res.status(200).json({ success: true, data: questions });
    } catch (error) {
        next(error);
    }
};

export const updateQuestionController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        // Using questionText in the update body
        const { questionText } = req.body;
        const role = req.user?.role;
        if (role !== Role.ADMIN && role !== Role.TEACHER) {
            throw new HttpError("Unauthorized", 403);
        }
        const result = await updateQuestionService(id, { questionText });
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
