import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "./auth";
import HttpError from "../utils/httpError";
import { checkUserTestEligibilityService } from "../services/Usertestattempt.service";

/**
 * Middleware to check if a user is eligible to take a test
 * This should be used before allowing a user to start/access a test
 * 
 * Usage: Apply this middleware to routes where users start a test
 * The testId should be available in req.params or req.body
 */
export const checkTestAttemptEligibility = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user || !req.user.id) {
            throw new HttpError("Authentication required", 401);
        }

        // Get testId from params or body
        const testId = req.params.testId || req.body.testId;
        
        if (!testId) {
            throw new HttpError("Test ID is required", 400);
        }

        // Check eligibility
        const eligibility = await checkUserTestEligibilityService(req.user.id, testId);

        if (!eligibility.canAttempt) {
            throw new HttpError(
                `You have no remaining attempts for this test. Used: ${eligibility.attemptsUsed}/${eligibility.allowedAttempts}`,
                403
            );
        }

        // Attach eligibility info to request for use in controller
        (req as any).testEligibility = eligibility;

        next();
    } catch (error) {
        next(error);
    }
};