import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import HttpError from "../utils/httpError";
import {
    checkUserTestEligibilityService,
    markTestStartedService,
    markTestCompletedService,
    grantTestAttemptsService,
    resetTestAttemptsService,
    getTestAttemptsStatusService,
    getUserTestAttemptsService
} from "../services/Usertestattempt.service";
import { Role } from "../utils/constants";

/**
 * Check if the current user can take a specific test
 * GET /api/test-attempts/eligibility/:testId
 */
export const checkTestEligibilityController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user || !req.user.id) {
            throw new HttpError("Authentication required", 401);
        }

        const { testId } = req.params;
        if (!testId) {
            throw new HttpError("Test ID is required", 400);
        }

        const eligibility = await checkUserTestEligibilityService(req.user.id, testId);
        res.status(200).json({ success: true, data: eligibility });
    } catch (error) {
        next(error);
    }
};

/**
 * Mark that the user has started a test (increments attempts used)
 * POST /api/test-attempts/start/:testId
 */
export const startTestAttemptController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user || !req.user.id) {
            throw new HttpError("Authentication required", 401);
        }

        const { testId } = req.params;
        if (!testId) {
            throw new HttpError("Test ID is required", 400);
        }

        const result = await markTestStartedService(req.user.id, testId);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

/**
 * Mark that the user has completed a test
 * POST /api/test-attempts/complete/:testId
 */
export const completeTestAttemptController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user || !req.user.id) {
            throw new HttpError("Authentication required", 401);
        }

        const { testId } = req.params;
        if (!testId) {
            throw new HttpError("Test ID is required", 400);
        }

        const result = await markTestCompletedService(req.user.id, testId);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

/**
 * Admin grants additional attempts to a user
 * POST /api/test-attempts/grant
 * Body: { userId, testId, additionalAttempts, reason? }
 */
export const grantTestAttemptsController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user || !req.user.id || !req.user.role) {
            throw new HttpError("Authentication required", 401);
        }

        if (req.user.role !== Role.ADMIN) {
            throw new HttpError("Only admins can grant additional attempts", 403);
        }

        const { userId, testId, additionalAttempts, reason } = req.body;

        if (!userId || !testId || additionalAttempts === undefined) {
            throw new HttpError("User ID, Test ID, and additional attempts are required", 400);
        }

        if (typeof additionalAttempts !== 'number' || additionalAttempts < 1) {
            throw new HttpError("Additional attempts must be a positive number", 400);
        }

        const result = await grantTestAttemptsService(req.user.id, userId, testId, additionalAttempts, reason);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

/**
 * Admin resets test attempts for a user
 * POST /api/test-attempts/reset
 * Body: { userId, testId, newAllowedAttempts?, reason? }
 */
export const resetTestAttemptsController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user || !req.user.id || !req.user.role) {
            throw new HttpError("Authentication required", 401);
        }

        if (req.user.role !== Role.ADMIN) {
            throw new HttpError("Only admins can reset test attempts", 403);
        }

        const { userId, testId, newAllowedAttempts, reason } = req.body;

        if (!userId || !testId) {
            throw new HttpError("User ID and Test ID are required", 400);
        }

        const allowedAttempts = newAllowedAttempts !== undefined ? newAllowedAttempts : 1;

        if (typeof allowedAttempts !== 'number' || allowedAttempts < 1) {
            throw new HttpError("Allowed attempts must be a positive number", 400);
        }

        const result = await resetTestAttemptsService(req.user.id, userId, testId, allowedAttempts, reason);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

/**
 * Admin gets all users' attempt status for a specific test
 * GET /api/test-attempts/test/:testId/status
 */
export const getTestAttemptsStatusController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user || !req.user.role) {
            throw new HttpError("Authentication required", 401);
        }

        if (req.user.role !== Role.ADMIN && req.user.role !== Role.TEACHER) {
            throw new HttpError("Only admins and teachers can view test attempt status", 403);
        }

        const { testId } = req.params;
        if (!testId) {
            throw new HttpError("Test ID is required", 400);
        }

        const attempts = await getTestAttemptsStatusService(testId);
        res.status(200).json({ success: true, data: attempts });
    } catch (error) {
        next(error);
    }
};

/**
 * Get current user's test attempt history
 * GET /api/test-attempts/my-attempts
 * Query params: testId? (optional - to get attempts for a specific test)
 */
export const getMyTestAttemptsController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user || !req.user.id) {
            throw new HttpError("Authentication required", 401);
        }

        const { testId } = req.query;
        const attempts = await getUserTestAttemptsService(req.user.id, testId as string | undefined);
        res.status(200).json({ success: true, data: attempts });
    } catch (error) {
        next(error);
    }
};

/**
 * Admin gets a specific user's test attempt history
 * GET /api/test-attempts/user/:userId
 * Query params: testId? (optional)
 */
export const getUserTestAttemptsController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user || !req.user.role) {
            throw new HttpError("Authentication required", 401);
        }

        if (req.user.role !== Role.ADMIN && req.user.role !== Role.TEACHER) {
            throw new HttpError("Only admins and teachers can view user test attempts", 403);
        }

        const { userId } = req.params;
        const { testId } = req.query;

        if (!userId) {
            throw new HttpError("User ID is required", 400);
        }

        const attempts = await getUserTestAttemptsService(userId, testId as string | undefined);
        res.status(200).json({ success: true, data: attempts });
    } catch (error) {
        next(error);
    }
};