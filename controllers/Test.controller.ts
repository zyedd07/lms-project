import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import HttpError from "../utils/httpError";
import { createTestService, getTestByIdService, updateTestService, deleteTestService, getTestsByTestSeriesService } from "../services/Test.service";
import { checkUserTestEligibilityService, markTestStartedService } from "../services/Usertestattempt.service";
import { Role } from "../utils/constants";

export const createTestController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        // Ensure user is authenticated and ID exists for 'createdBy' field
        if (!req.user || !req.user.id) {
            throw new HttpError("Authentication required: User ID is missing.", 401);
        }

        const role = req.user.role;
        // Authorization check
        if (role !== Role.ADMIN && role !== Role.TEACHER) {
            throw new HttpError("Unauthorized", 403);
        }

        // Destructure all required fields for Test creation
        const { testSeriesId, name, description, durationMinutes, numberOfQuestions, passMarkPercentage } = req.body;

        // Basic input validation
        if (!testSeriesId || !name || durationMinutes === undefined || numberOfQuestions === undefined || passMarkPercentage === undefined) {
            throw new HttpError("TestSeries ID, name, duration, number of questions, and pass mark are required.", 400);
        }

        // Call the service with ALL necessary parameters, including createdBy
        const newTest = await createTestService({
            testSeriesId,
            name,
            description,
            durationMinutes,
            numberOfQuestions,
            passMarkPercentage,
            createdBy: req.user.id, // Pass the ID of the authenticated user
        });

        res.status(201).json(newTest);
    } catch (error) {
        next(error); // Pass error to Express error handling middleware
    }
};

/**
 * Get test details and check if user can attempt it
 * This combines getting test info + checking eligibility
 */
export const getTestController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const test = await getTestByIdService(id);
        
        // If user is authenticated (not admin/teacher viewing), check eligibility
        if (req.user && req.user.id && req.user.role === Role.STUDENT) {
            try {
                const eligibility = await checkUserTestEligibilityService(req.user.id, id);
                res.status(200).json({ 
                    success: true, 
                    data: { 
                        test,
                        attemptInfo: eligibility
                    } 
                });
                return;
            } catch (err) {
                // If eligibility check fails, still return test data
                console.error("Error checking eligibility:", err);
            }
        }
        
        res.status(200).json({ success: true, data: { test } });
    } catch (error) {
        next(error);
    }
};

/**
 * NEW: Start a test attempt
 * This should be called when user clicks "Start Test"
 * It checks eligibility and marks the attempt as started
 */
export const startTestController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user || !req.user.id) {
            throw new HttpError("Authentication required", 401);
        }

        const { testId } = req.params;
        if (!testId) {
            throw new HttpError("Test ID is required", 400);
        }

        // First, check eligibility
        const eligibility = await checkUserTestEligibilityService(req.user.id, testId);
        
        if (!eligibility.canAttempt) {
            throw new HttpError(
                `You have no remaining attempts for this test. Used: ${eligibility.attemptsUsed}/${eligibility.allowedAttempts}`,
                403
            );
        }

        // Mark test as started (increments attempt counter)
        const result = await markTestStartedService(req.user.id, testId);
        
        // Get full test details to return
        const test = await getTestByIdService(testId);

        res.status(200).json({ 
            success: true, 
            data: {
                message: "Test started successfully",
                test,
                attemptInfo: result
            }
        });
    } catch (error) {
        next(error);
    }
};

export const updateTestController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        // Destructure ALL updatable fields from req.body
        const { name, description, durationMinutes, numberOfQuestions, passMarkPercentage } = req.body;

        // Ensure user is authenticated and role exists for authorization
        if (!req.user || !req.user.role) {
            throw new HttpError("Authentication required: User role is missing.", 401);
        }

        const role = req.user.role;
        // Authorization check
        if (role !== Role.ADMIN && role !== Role.TEACHER) {
            throw new HttpError("Unauthorized", 403);
        }

        // Call the service with ALL updatable parameters
        const result = await updateTestService(id, {
            name,
            description,
            durationMinutes,
            numberOfQuestions,
            passMarkPercentage,
        });

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const deleteTestController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        // Ensure user is authenticated and role exists for authorization
        if (!req.user || !req.user.role) {
            throw new HttpError("Authentication required: User role is missing.", 401);
        }

        const role = req.user.role;
        // Authorization check
        if (role !== Role.ADMIN && role !== Role.TEACHER) {
            throw new HttpError("Unauthorized", 403);
        }

        const result = await deleteTestService(id);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

export const getTestsByTestSeriesController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { testSeriesId } = req.query; // Expecting testSeriesId as a query parameter
        if (!testSeriesId) {
            throw new HttpError("TestSeries ID is required as a query parameter (e.g., ?testSeriesId=...).", 400);
        }

        // Cast testSeriesId to string as req.query parameters are typically strings
        const tests = await getTestsByTestSeriesService(testSeriesId as string);
        res.status(200).json({ success: true, data: tests });
    } catch (error) {
        next(error);
    }
};