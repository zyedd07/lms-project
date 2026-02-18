import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import HttpError from "../utils/httpError";
import {
    createQuestionService, getQuestionsByTestService,
    updateQuestionService, deleteQuestionService, getQuestionByIdService
} from "../services/Question.service";
import { Role } from "../utils/constants";

const VALID_TYPES = ['mcq', 'match_the_pair', 'image_based'];

export const createQuestionController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.role) throw new HttpError("Authentication required.", 401);
        if (req.user.role !== Role.ADMIN && req.user.role !== Role.TEACHER) throw new HttpError("Unauthorized", 403);

        const {
            testId, questionType = 'mcq', questionText,
            questionImageUrl, options, correctAnswerIndex,
            pairs, points, negativePoints
        } = req.body;

        if (!testId || !questionText || points === undefined || negativePoints === undefined) {
            throw new HttpError("testId, questionText, points, and negativePoints are required.", 400);
        }
        if (!VALID_TYPES.includes(questionType)) {
            throw new HttpError(`questionType must be one of: ${VALID_TYPES.join(', ')}`, 400);
        }
        if (points < 1) throw new HttpError("Points must be at least 1.", 400);
        if (negativePoints > 0) throw new HttpError("Negative points must be 0 or negative.", 400);

        // MCQ and image_based validation
        if (questionType === 'mcq' || questionType === 'image_based') {
            if (!Array.isArray(options) || options.length < 2) {
                throw new HttpError("options must be an array with at least 2 elements.", 400);
            }
            if (correctAnswerIndex === undefined || correctAnswerIndex < 0 || correctAnswerIndex >= options.length) {
                throw new HttpError("correctAnswerIndex is invalid.", 400);
            }
            if (questionType === 'image_based' && !questionImageUrl) {
                throw new HttpError("questionImageUrl is required for image_based questions.", 400);
            }
        }

        // Match the pair validation
        if (questionType === 'match_the_pair') {
            if (!Array.isArray(pairs) || pairs.length < 2) {
                throw new HttpError("pairs must be an array with at least 2 items.", 400);
            }
            for (const pair of pairs) {
                if (!pair.left || !pair.right) {
                    throw new HttpError("Each pair must have 'left' and 'right' values.", 400);
                }
            }
        }

        const newQuestion = await createQuestionService({
            testId, questionType, questionText, questionImageUrl,
            options, correctAnswerIndex, pairs, points, negativePoints,
        });

        res.status(201).json(newQuestion);
    } catch (error) {
        next(error);
    }
};

export const getQuestionByIdController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const question = await getQuestionByIdService(req.params.id);
        res.status(200).json({ success: true, data: question });
    } catch (error) {
        next(error);
    }
};

export const getQuestionsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { testId } = req.query;
        if (!testId) throw new HttpError("testId query param is required.", 400);
        const questions = await getQuestionsByTestService(testId as string);
        res.status(200).json({ success: true, data: questions });
    } catch (error) {
        next(error);
    }
};

export const updateQuestionController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.role) throw new HttpError("Authentication required.", 401);
        if (req.user.role !== Role.ADMIN && req.user.role !== Role.TEACHER) throw new HttpError("Unauthorized", 403);

        const { id } = req.params;
        const {
            questionType, questionText, questionImageUrl,
            options, correctAnswerIndex, pairs, points, negativePoints
        } = req.body;

        if (questionType && !VALID_TYPES.includes(questionType)) {
            throw new HttpError(`questionType must be one of: ${VALID_TYPES.join(', ')}`, 400);
        }
        if (points !== undefined && points < 1) throw new HttpError("Points must be at least 1.", 400);
        if (negativePoints !== undefined && negativePoints > 0) throw new HttpError("Negative points must be 0 or negative.", 400);
        if (options && (!Array.isArray(options) || options.length < 2)) {
            throw new HttpError("options must be an array with at least 2 elements.", 400);
        }
        if (pairs && (!Array.isArray(pairs) || pairs.length < 2)) {
            throw new HttpError("pairs must be an array with at least 2 items.", 400);
        }

        const result = await updateQuestionService(id, {
            questionType, questionText, questionImageUrl,
            options, correctAnswerIndex, pairs, points, negativePoints,
        });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const deleteQuestionController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.role) throw new HttpError("Authentication required.", 401);
        if (req.user.role !== Role.ADMIN && req.user.role !== Role.TEACHER) throw new HttpError("Unauthorized", 403);
        const result = await deleteQuestionService(req.params.id);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};