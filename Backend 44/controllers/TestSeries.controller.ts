import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import HttpError from "../utils/httpError";
import { 
    createTestSeriesService, 
    getAllTestSeriesService, 
    updateTestSeriesService, 
    deleteTestSeriesService,
    getTestSeriesByIdService // Import the service to get by ID
} from "../services/TestSeries.service";
import { Role } from "../utils/constants";
import Question from "../models/Question.model"; // Correct: Question model
import Test from "../models/Test.model";        // Correct: Test model
import TestSeries from "../models/TestSeries.model"; // Correct: TestSeries model
import User from "../models/User.model"; // Import User model for direct includes if needed

export const createTestSeriesController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user || !req.user.id) {
            throw new HttpError("Authentication required: User ID is missing.", 401);
        }

        const role = req.user.role;
        if (role !== Role.ADMIN && role !== Role.TEACHER) {
            throw new HttpError("Unauthorized", 403);
        }
        const { name, description, price } = req.body; // Added price
        if (!name) {
            throw new HttpError("Name is required", 400);
        }
        // Validate price presence if it's non-nullable in the schema
        if (typeof price === 'undefined' || price === null) {
            throw new HttpError("Price is required", 400);
        }
        const newTestSeries = await createTestSeriesService({
            name,
            description,
            price, // Pass price to the service
            createdBy: req.user.id, // Pass the ID of the authenticated user as the creator
        });
        res.status(201).json(newTestSeries);
    } catch (error) {
        next(error);
    }
};

// Renamed from getFullTestSeriesController to getTestSeriesWithTestsController
// to better reflect what it's fetching based on our new model hierarchy.
// This controller will now also include the creator of the TestSeries.
export const getTestSeriesWithTestsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const testSeriesData = await TestSeries.findAll({
            // Include associated Tests
            include: [
                {
                    model: Test,
                    as: 'tests', // Ensure this alias matches the TestSeries.hasMany(Test, { as: 'tests' }) association
                    // If you need questions nested here, add another include:
                    // include: [{
                    //     model: Question,
                    //     as: 'questions' // Ensure this alias matches the Test.hasMany(Question, { as: 'questions' }) association
                    // }]
                },
                { // FIX: Include the User model for creator information
                    model: User,
                    as: 'creator', // This alias must match the 'as' in your TestSeries model association
                    required: false, // Set to true if a TestSeries MUST have a creator
                    attributes: ['id', 'name', 'email'] // Select specific user attributes
                }
            ]
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
        // FIX: Use the getTestSeriesByIdService which already includes the creator data
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
        // This service already includes the 'creator' information
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
        const { name, description, price } = req.body;
        if (!req.user || !req.user.id || !req.user.role) { // Ensure user ID is available for authorization
            throw new HttpError("Authentication required: User information is missing.", 401);
        }
        const userId = req.user.id;
        const role = req.user.role;

        // FIX: Fetch the test series with creator information for authorization
        const testSeries = await getTestSeriesByIdService(id);
        if (!testSeries) {
            throw new HttpError("Test Series not found", 404);
        }

        // Check if the user is authorized to update (creator, admin, or teacher)
        // FIX: Cast testSeries to 'any' to allow access to 'creator' property if TestSeriesData type is not yet updated
        if ((testSeries as any).creator?.id !== userId && role !== Role.ADMIN && role !== Role.TEACHER) {
            throw new HttpError("Unauthorized to update this test series.", 403);
        }

        const updatedTestSeries = await updateTestSeriesService(id, { name, description, price });
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
        if (!req.user || !req.user.id || !req.user.role) { // Ensure user ID is available for authorization
            throw new HttpError("Authentication required: User information is missing.", 401);
        }
        const userId = req.user.id;
        const role = req.user.role;

        // FIX: Fetch the test series with creator information for authorization
        const testSeries = await getTestSeriesByIdService(id);
        if (!testSeries) {
            // Corrected: Removed the duplicate 'new' keyword
            throw new HttpError("Test Series not found", 404);
        }

        // Check if the user is authorized to delete (creator, admin, or teacher)
        // FIX: Cast testSeries to 'any' to allow access to 'creator' property if TestSeriesData type is not yet updated
        if ((testSeries as any).creator?.id !== userId && role !== Role.ADMIN && role !== Role.TEACHER) {
            throw new HttpError("Unauthorized to delete this test series.", 403);
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
