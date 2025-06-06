import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import HttpError from "../utils/httpError";
import { createTestSeriesService, getAllTestSeriesService, updateTestSeriesService, deleteTestSeriesService } from "../services/TestSeries.service";
import { Role } from "../utils/constants";
import Question from "../models/Question.model"; // Correct: Question model
import Test from "../models/Test.model";         // Correct: Test model
import TestSeries from "../models/TestSeries.model"; // Correct: TestSeries model
// REMOVED: import TestOption from "../models/Option.model"; // This model is no longer used for MCQ options

export const createTestSeriesController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user || !req.user.id) {
            throw new HttpError("Authentication required: User ID is missing.", 401);
        }

        const role = req.user.role;
        if (role !== Role.ADMIN && role !== Role.TEACHER) {
            throw new HttpError("Unauthorized", 403);
        }
        const { name, description } = req.body;
        if (!name) {
            throw new HttpError("Name is required", 400);
        }
        const newTestSeries = await createTestSeriesService({
            name,
            description,
            createdBy: req.user.id,
        });
        res.status(201).json(newTestSeries);
    } catch (error) {
        next(error);
    }
};

// Renamed from getFullTestSeriesController to getTestSeriesWithTestsController
// to better reflect what it's fetching based on our new model hierarchy.
// If you truly need ALL questions and options for ALL series, keep the deeper includes,
// but be mindful of performance.
export const getTestSeriesWithTestsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const testSeriesData = await TestSeries.findAll({
            // Include associated Tests
            include: [{
                model: Test,
                as: 'tests', // Ensure this alias matches the TestSeries.hasMany(Test, { as: 'tests' }) association
                // If you need questions nested here, add another include:
                // include: [{
                //     model: Question,
                //     as: 'questions' // Ensure this alias matches the Test.hasMany(Question, { as: 'questions' }) association
                // }]
            }]
        });
        res.status(200).json({ success: true, data: testSeriesData });
    } catch (error) {
        next(new HttpError("Error fetching test series data with associated tests", 500));
    }
};

// Add a controller to get a single test series by ID, which can then be used to fetch its tests
export const getTestSeriesByIdController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const testSeries = await TestSeries.findByPk(id);
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
        res.status(200).json({
            success: true,
            data: testSeriesList,
        });
    } catch (error) {
        next(error);
    }
};


export const updateTestSeriesController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        if (!req.user || !req.user.role) {
            throw new HttpError("Authentication required: User role is missing.", 401);
        }
        const role = req.user.role;
        if (role !== Role.ADMIN && role !== Role.TEACHER) {
            throw new HttpError("Unauthorized", 403);
        }
        const updatedTestSeries = await updateTestSeriesService(id, { name, description });
        res.status(200).json({
            success: true,
            data: updatedTestSeries,
        });
    } catch (error) {
        next(error);
    }
};


export const deleteTestSeriesController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        if (!req.user || !req.user.role) {
            throw new HttpError("Authentication required: User role is missing.", 401);
        }
        const role = req.user.role;
        if (role !== Role.ADMIN && role !== Role.TEACHER) {
            throw new HttpError("Unauthorized", 403);
        }
        const response = await deleteTestSeriesService(id);
        res.status(200).json({
            success: true,
            ...response,
        });
    } catch (error) {
        next(error);
    }
};
