import UserTestAttempt from "../models/UserTestAttempt.model";
import Test from "../models/Test.model";
import User from "../models/User.model";
import HttpError from "../utils/httpError";

/**
 * Check if a user can start/take a test
 */
export const checkUserTestEligibilityService = async (userId: string, testId: string) => {
    try {
        // Verify test exists
        const test = await Test.findByPk(testId);
        if (!test) {
            throw new HttpError("Test not found", 404);
        }

        // Find or create the attempt record
        let attemptRecord = await UserTestAttempt.findOne({
            where: { userId, testId }
        });

        if (!attemptRecord) {
            // First time accessing this test - create record with default 1 attempt
            attemptRecord = await UserTestAttempt.create({
                userId,
                testId,
                allowedAttempts: 1,
                attemptsUsed: 0,
                hasStarted: false,
                hasCompleted: false,
            });
        }

        // Check eligibility
        const remainingAttempts = attemptRecord.getDataValue('allowedAttempts') - attemptRecord.getDataValue('attemptsUsed');
        const canAttempt = remainingAttempts > 0;

        return {
            canAttempt,
            allowedAttempts: attemptRecord.getDataValue('allowedAttempts'),
            attemptsUsed: attemptRecord.getDataValue('attemptsUsed'),
            remainingAttempts,
            hasStarted: attemptRecord.getDataValue('hasStarted'),
            hasCompleted: attemptRecord.getDataValue('hasCompleted'),
            lastAttemptAt: attemptRecord.getDataValue('lastAttemptAt'),
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Mark that a user has started a test
 */
export const markTestStartedService = async (userId: string, testId: string) => {
    try {
        const attemptRecord = await UserTestAttempt.findOne({
            where: { userId, testId }
        });

        if (!attemptRecord) {
            throw new HttpError("Test attempt record not found. Please check eligibility first.", 404);
        }

        const remainingAttempts = attemptRecord.getDataValue('allowedAttempts') - attemptRecord.getDataValue('attemptsUsed');
        if (remainingAttempts <= 0) {
            throw new HttpError("No attempts remaining for this test", 403);
        }

        // Update the record
        await attemptRecord.update({
            hasStarted: true,
            attemptsUsed: attemptRecord.getDataValue('attemptsUsed') + 1,
            lastAttemptAt: new Date(),
        });

        return {
            message: "Test started successfully",
            attemptsUsed: attemptRecord.getDataValue('attemptsUsed'),
            remainingAttempts: attemptRecord.getDataValue('allowedAttempts') - attemptRecord.getDataValue('attemptsUsed'),
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Mark that a user has completed a test
 */
export const markTestCompletedService = async (userId: string, testId: string) => {
    try {
        const attemptRecord = await UserTestAttempt.findOne({
            where: { userId, testId }
        });

        if (!attemptRecord) {
            throw new HttpError("Test attempt record not found", 404);
        }

        await attemptRecord.update({
            hasCompleted: true,
        });

        return { message: "Test marked as completed" };
    } catch (error) {
        throw error;
    }
};

/**
 * Admin grants additional attempts to a user for a specific test
 */
export const grantTestAttemptsService = async (
    adminId: string,
    userId: string,
    testId: string,
    additionalAttempts: number,
    reason?: string
) => {
    try {
        // Verify test exists
        const test = await Test.findByPk(testId);
        if (!test) {
            throw new HttpError("Test not found", 404);
        }

        // Verify user exists
        const user = await User.findByPk(userId);
        if (!user) {
            throw new HttpError("User not found", 404);
        }

        // Find or create the attempt record
        let attemptRecord = await UserTestAttempt.findOne({
            where: { userId, testId }
        });

        if (!attemptRecord) {
            // Create new record with the granted attempts
            attemptRecord = await UserTestAttempt.create({
                userId,
                testId,
                allowedAttempts: additionalAttempts,
                attemptsUsed: 0,
                hasStarted: false,
                hasCompleted: false,
                grantedBy: adminId,
                grantReason: reason,
            });
        } else {
            // Update existing record
            const currentAllowed = attemptRecord.getDataValue('allowedAttempts');
            await attemptRecord.update({
                allowedAttempts: currentAllowed + additionalAttempts,
                grantedBy: adminId,
                grantReason: reason,
            });
        }

        return {
            message: "Additional attempts granted successfully",
            allowedAttempts: attemptRecord.getDataValue('allowedAttempts'),
            attemptsUsed: attemptRecord.getDataValue('attemptsUsed'),
            remainingAttempts: attemptRecord.getDataValue('allowedAttempts') - attemptRecord.getDataValue('attemptsUsed'),
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Admin resets all attempts for a user for a specific test
 */
export const resetTestAttemptsService = async (
    adminId: string,
    userId: string,
    testId: string,
    newAllowedAttempts: number = 1,
    reason?: string
) => {
    try {
        const attemptRecord = await UserTestAttempt.findOne({
            where: { userId, testId }
        });

        if (!attemptRecord) {
            throw new HttpError("Test attempt record not found", 404);
        }

        await attemptRecord.update({
            allowedAttempts: newAllowedAttempts,
            attemptsUsed: 0,
            hasStarted: false,
            hasCompleted: false,
            lastAttemptAt: null,
            grantedBy: adminId,
            grantReason: reason,
        });

        return {
            message: "Test attempts reset successfully",
            allowedAttempts: newAllowedAttempts,
            attemptsUsed: 0,
            remainingAttempts: newAllowedAttempts,
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Get all users and their attempt status for a specific test (Admin only)
 */
export const getTestAttemptsStatusService = async (testId: string) => {
    try {
        const test = await Test.findByPk(testId);
        if (!test) {
            throw new HttpError("Test not found", 404);
        }

        const attempts = await UserTestAttempt.findAll({
            where: { testId },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email', 'role']
                },
                {
                    model: User,
                    as: 'admin',
                    attributes: ['id', 'name', 'email'],
                    required: false
                }
            ]
        });

        return attempts;
    } catch (error) {
        throw error;
    }
};

/**
 * Get user's attempt history for all tests or a specific test
 */
export const getUserTestAttemptsService = async (userId: string, testId?: string) => {
    try {
        const whereClause: any = { userId };
        if (testId) {
            whereClause.testId = testId;
        }

        const attempts = await UserTestAttempt.findAll({
            where: whereClause,
            include: [
                {
                    model: Test,
                    as: 'test',
                    attributes: ['id', 'name', 'description', 'durationMinutes', 'numberOfQuestions']
                }
            ]
        });

        return attempts;
    } catch (error) {
        throw error;
    }
};