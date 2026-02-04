// controllers/Result.controller.ts

import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import HttpError from "../utils/httpError";
import {
    createResultService,
    getResultByIdService,
    getResultsByUserService,
    getResultsByTestService,
    getAllResultsService,
    deleteResultService,
    getUserTestStatisticsService
} from "../services/Result.service";
import { Role } from "../utils/constants";

export const createResultController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user || !req.user.id) {
            throw new HttpError("Authentication required", 401);
        }

        const {
            testId,
            score,
            totalPossiblePoints,
            correctCount,
            incorrectCount,
            skippedCount,
            totalQuestions,
            hasPassed,
            timeTaken,
            userAnswers
        } = req.body;

        if (!testId || score === undefined || !totalPossiblePoints || !userAnswers) {
            throw new HttpError("Missing required fields", 400);
        }

        const result = await createResultService({
            userId: req.user.id,
            testId,
            score,
            totalPossiblePoints,
            correctCount: correctCount || 0,
            incorrectCount: incorrectCount || 0,
            skippedCount: skippedCount || 0,
            totalQuestions: totalQuestions || 0,
            hasPassed: hasPassed || false,
            timeTaken,
            userAnswers
        });

        res.status(201).json({
            success: true,
            message: "Result saved successfully",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const getResultByIdController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const result = await getResultByIdService(id);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const getResultsByUserController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;
        
        // Users can only view their own results unless they're admin
        if (req.user?.role !== Role.ADMIN && req.user?.id !== userId) {
            throw new HttpError("Unauthorized to view these results", 403);
        }

        const results = await getResultsByUserService(userId);
        res.status(200).json({ success: true, data: results });
    } catch (error) {
        next(error);
    }
};

export const getMyResultsController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user || !req.user.id) {
            throw new HttpError("Authentication required", 401);
        }

        const results = await getResultsByUserService(req.user.id);
        res.status(200).json({ success: true, data: results });
    } catch (error) {
        next(error);
    }
};

export const getResultsByTestController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { testId } = req.params;
        const results = await getResultsByTestService(testId);
        res.status(200).json({ success: true, data: results });
    } catch (error) {
        next(error);
    }
};

export const getAllResultsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const results = await getAllResultsService();
        res.status(200).json({ success: true, data: results });
    } catch (error) {
        next(error);
    }
};

export const deleteResultController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user || !req.user.role) {
            throw new HttpError("Authentication required", 401);
        }

        if (req.user.role !== Role.ADMIN) {
            throw new HttpError("Unauthorized", 403);
        }

        const { id } = req.params;
        const result = await deleteResultService(id);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

export const getUserStatisticsController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;

        // Users can only view their own statistics unless they're admin
        if (req.user?.role !== Role.ADMIN && req.user?.id !== userId) {
            throw new HttpError("Unauthorized to view these statistics", 403);
        }

        const statistics = await getUserTestStatisticsService(userId);
        res.status(200).json({ success: true, data: statistics });
    } catch (error) {
        next(error);
    }
};