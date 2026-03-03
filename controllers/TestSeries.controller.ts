import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import HttpError from "../utils/httpError";
import {
    createTestSeriesService,
    getAllTestSeriesService,
    updateTestSeriesService,
    deleteTestSeriesService,
    getTestSeriesByIdService,
} from "../services/TestSeries.service";
import { Role } from "../utils/constants";
import Question from "../models/Question.model";
import Test from "../models/Test.model";
import TestSeries from "../models/TestSeries.model";
import User from "../models/User.model";

export const createTestSeriesController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user || !req.user.id) {
            throw new HttpError("Authentication required: User ID is missing.", 401);
        }

        const role = req.user.role;
        if (role !== Role.ADMIN && role !== Role.TEACHER) {
            throw new HttpError("Unauthorized", 403);
        }

        const { name, description, price, thumbnailUrl } = req.body;  // ← thumbnailUrl added

        if (!name) {
            throw new HttpError("Name is required", 400);
        }
        if (typeof price === 'undefined' || price === null) {
            throw new HttpError("Price is required", 400);
        }

        const newTestSeries = await createTestSeriesService({
            name,
            description,
            price,
            thumbnailUrl: thumbnailUrl ?? null,   // ← pass through (null if omitted)
            createdBy: req.user.id,
        });

        res.status(201).json(newTestSeries);
    } catch (error) {
        next(error);
    }
};

export const getTestSeriesWithTestsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const testSeriesData = await TestSeries.findAll({
            include: [
                {
                    model: Test,
                    as: 'tests',
                },
                {
                    model: User,
                    as: 'creator',
                    required: false,
                    attributes: ['id', 'name', 'email'],
                },
            ],
        });
        res.status(200).json({ success: true, data: testSeriesData });
    } catch (error) {
        next(new HttpError("Error fetching test series data with associated tests", 500));
    }
};

export const getTestSeriesByIdController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const testSeries = await getTestSeriesByIdService(id);
        if (!testSeries) {
            throw new HttpError("Test Series not found", 404);
        }
        res.status(200).json({ success: true, data: testSeries });
    } catch (error) {
        next(error);
    }
};

export const getTestSeriesController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const testSeriesList = await getAllTestSeriesService({});
        res.status(200).json({ success: true, data: testSeriesList });
    } catch (error) {
        next(error);
    }
};

export const updateTestSeriesController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { name, description, price, thumbnailUrl } = req.body;  // ← thumbnailUrl added

        if (!req.user || !req.user.id || !req.user.role) {
            throw new HttpError("Authentication required: User information is missing.", 401);
        }

        const userId = req.user.id;
        const role = req.user.role;

        const testSeries = await getTestSeriesByIdService(id);
        if (!testSeries) {
            throw new HttpError("Test Series not found", 404);
        }

        if ((testSeries as any).creator?.id !== userId && role !== Role.ADMIN && role !== Role.TEACHER) {
            throw new HttpError("Unauthorized to update this test series.", 403);
        }

        const updatedTestSeries = await updateTestSeriesService(id, {
            name,
            description,
            price,
            thumbnailUrl,   // ← passed through (undefined = not changed, null = cleared)
        });

        res.status(200).json({ success: true, data: updatedTestSeries });
    } catch (error) {
        next(error);
    }
};

export const deleteTestSeriesController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        if (!req.user || !req.user.id || !req.user.role) {
            throw new HttpError("Authentication required: User information is missing.", 401);
        }

        const userId = req.user.id;
        const role = req.user.role;

        const testSeries = await getTestSeriesByIdService(id);
        if (!testSeries) {
            throw new HttpError("Test Series not found", 404);
        }

        if ((testSeries as any).creator?.id !== userId && role !== Role.ADMIN && role !== Role.TEACHER) {
            throw new HttpError("Unauthorized to delete this test series.", 403);
        }

        const response = await deleteTestSeriesService(id);
        res.status(200).json({ success: true, ...response });
    } catch (error) {
        next(error);
    }
};