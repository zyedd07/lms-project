// controllers/Question.controller.ts

import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import HttpError from "../utils/httpError";
import {
    createQuestionService,
    getQuestionsByTestService,
    updateQuestionService,
    deleteQuestionService,
    getQuestionByIdService
} from "../services/Question.service";
import { Role } from "../utils/constants";

export const createQuestionController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user || !req.user.role) {
            throw new HttpError("Authentication required: User role is missing.", 401);
        }
        const role = req.user.role;
        if (role !== Role.ADMIN && role !== Role.TEACHER) {
            throw new HttpError("Unauthorized", 403);
        }

        const { testId, questionText, options, correctAnswerIndex, points, negativePoints } = req.body;

        if (!testId || !questionText || !options || correctAnswerIndex === undefined || points === undefined || negativePoints === undefined) {
            throw new HttpError("Test ID, question text, options, correct answer index, points, and negative points are all required.", 400);
        }
        if (!Array.isArray(options) || options.length < 2) {
             throw new HttpError("Options must be an array with at least two elements.", 400);
        }
        if (correctAnswerIndex < 0 || correctAnswerIndex >= options.length) {
            throw new HttpError("Correct answer index is invalid for the provided options.", 400);
        }
        if (points < 1) {
            throw new HttpError("Points must be at least 1.", 400);
        }
        // FIXED: Validate that negative points are actually negative (or zero)
        if (negativePoints > 0) {
            throw new HttpError("Negative points must be zero or a negative number (e.g., -1, -0.5).", 400);
        }

        const newQuestion = await createQuestionService({
            testId,
            questionText,
            options,
            correctAnswerIndex,
            points,
            negativePoints,
        });
        res.status(201).json(newQuestion);
    } catch (error) {
        next(error);
    }
};

export const getQuestionByIdController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const question = await getQuestionByIdService(id);
        res.status(200).json({ success: true, data: question });
    } catch (error) {
        next(error);
    }
};

export const getQuestionsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { testId } = req.query;
        if (!testId) {
            throw new HttpError("Test ID is required as a query parameter (e.g., ?testId=...).", 400);
        }
        const questions = await getQuestionsByTestService(testId as string);
        res.status(200).json({ success: true, data: questions });
    } catch (error) {
        next(error);
    }
};

export const updateQuestionController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user || !req.user.role) {
            throw new HttpError("Authentication required: User role is missing.", 401);
        }
        const role = req.user.role;
        if (role !== Role.ADMIN && role !== Role.TEACHER) {
            throw new HttpError("Unauthorized", 403);
        }

        const { id } = req.params;
        const { questionText, options, correctAnswerIndex, points, negativePoints } = req.body;

        if (options && (!Array.isArray(options) || options.length < 2)) {
             throw new HttpError("Options must be an array with at least two elements.", 400);
        }
        if (correctAnswerIndex !== undefined && (correctAnswerIndex < 0 || (options && correctAnswerIndex >= options.length))) {
            throw new HttpError("Correct answer index is invalid for the provided options.", 400);
        }
        if (points !== undefined && points < 1) {
            throw new HttpError("Points must be at least 1.", 400);
        }
        // FIXED: Validate that negative points are actually negative (or zero) if provided
        if (negativePoints !== undefined && negativePoints > 0) {
            throw new HttpError("Negative points must be zero or a negative number (e.g., -1, -0.5).", 400);
        }

        const result = await updateQuestionService(id, {
            questionText,
            options,
            correctAnswerIndex,
            points,
            negativePoints,
        });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const deleteQuestionController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user || !req.user.role) {
            throw new HttpError("Authentication required: User role is missing.", 401);
        }
        const role = req.user.role;
        if (role !== Role.ADMIN && role !== Role.TEACHER) {
            throw new HttpError("Unauthorized", 403);
        }

        const { id } = req.params;
        const result = await deleteQuestionService(id);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};