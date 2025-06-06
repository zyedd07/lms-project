import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import HttpError from "../utils/httpError";
import {
    createQuestionService,
    getQuestionsByTestService,
    updateQuestionService,
    deleteQuestionService,
    getQuestionByIdService // Added import for getting a single question
} from "../services/Question.service";
import { Role } from "../utils/constants";

export const createQuestionController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        // Ensure user is authenticated and has the correct role
        if (!req.user || !req.user.role) {
            throw new HttpError("Authentication required: User role is missing.", 401);
        }
        const role = req.user.role;
        if (role !== Role.ADMIN && role !== Role.TEACHER) {
            throw new HttpError("Unauthorized", 403);
        }

        // Destructure all required fields for Question creation from req.body
        const { testId, questionText, options, correctAnswerIndex, points } = req.body;

        // Basic input validation for all new fields
        if (!testId || !questionText || !options || correctAnswerIndex === undefined || points === undefined) {
            throw new HttpError("Test ID, question text, options, correct answer index, and points are all required.", 400);
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


        // Call the service with ALL necessary parameters
        const newQuestion = await createQuestionService({
            testId,
            questionText,
            options,
            correctAnswerIndex,
            points,
        });
        res.status(201).json(newQuestion);
    } catch (error) {
        next(error); // Pass error to Express error handling middleware
    }
};

// New controller to get a single question by ID
export const getQuestionByIdController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const question = await getQuestionByIdService(id); // Call the service function
        res.status(200).json({ success: true, data: question });
    } catch (error) {
        next(error);
    }
};


export const getQuestionsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Retrieve testId from query parameters
        const { testId } = req.query;
        if (!testId) {
            throw new HttpError("Test ID is required as a query parameter (e.g., ?testId=...).", 400);
        }
        // Cast testId to string as req.query parameters are typically strings
        const questions = await getQuestionsByTestService(testId as string);
        res.status(200).json({ success: true, data: questions });
    } catch (error) {
        next(error);
    }
};

export const updateQuestionController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        // Ensure user is authenticated and has the correct role
        if (!req.user || !req.user.role) {
            throw new HttpError("Authentication required: User role is missing.", 401);
        }
        const role = req.user.role;
        if (role !== Role.ADMIN && role !== Role.TEACHER) {
            throw new HttpError("Unauthorized", 403);
        }

        const { id } = req.params;
        // Destructure ALL updatable fields from req.body
        const { questionText, options, correctAnswerIndex, points } = req.body;

        // You might add validation here for updated fields as well, similar to creation
        if (options && (!Array.isArray(options) || options.length < 2)) {
             throw new HttpError("Options must be an array with at least two elements.", 400);
        }
        if (correctAnswerIndex !== undefined && (correctAnswerIndex < 0 || (options && correctAnswerIndex >= options.length))) {
            throw new HttpError("Correct answer index is invalid for the provided options.", 400);
        }
        if (points !== undefined && points < 1) {
            throw new HttpError("Points must be at least 1.", 400);
        }


        // Pass all updatable parameters to the service
        const result = await updateQuestionService(id, {
            questionText,
            options,
            correctAnswerIndex,
            points,
        });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const deleteQuestionController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        // Ensure user is authenticated and has the correct role
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
