"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserTestAttemptsService = exports.getTestAttemptsStatusService = exports.resetTestAttemptsService = exports.grantTestAttemptsService = exports.markTestCompletedService = exports.markTestStartedService = exports.checkUserTestEligibilityService = void 0;
const Usertestattempt_model_1 = __importDefault(require("../models/Usertestattempt.model"));
const Test_model_1 = __importDefault(require("../models/Test.model"));
const User_model_1 = __importDefault(require("../models/User.model"));
const httpError_1 = __importDefault(require("../utils/httpError"));
/**
 * Check if a user can start/take a test
 */
const checkUserTestEligibilityService = (userId, testId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Verify test exists
        const test = yield Test_model_1.default.findByPk(testId);
        if (!test) {
            throw new httpError_1.default("Test not found", 404);
        }
        // Find or create the attempt record
        let attemptRecord = yield Usertestattempt_model_1.default.findOne({
            where: { userId, testId }
        });
        if (!attemptRecord) {
            // First time accessing this test - create record with default 1 attempt
            attemptRecord = yield Usertestattempt_model_1.default.create({
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
    }
    catch (error) {
        throw error;
    }
});
exports.checkUserTestEligibilityService = checkUserTestEligibilityService;
/**
 * Mark that a user has started a test
 */
const markTestStartedService = (userId, testId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const attemptRecord = yield Usertestattempt_model_1.default.findOne({
            where: { userId, testId }
        });
        if (!attemptRecord) {
            throw new httpError_1.default("Test attempt record not found. Please check eligibility first.", 404);
        }
        const remainingAttempts = attemptRecord.getDataValue('allowedAttempts') - attemptRecord.getDataValue('attemptsUsed');
        if (remainingAttempts <= 0) {
            throw new httpError_1.default("No attempts remaining for this test", 403);
        }
        // Update the record
        yield attemptRecord.update({
            hasStarted: true,
            attemptsUsed: attemptRecord.getDataValue('attemptsUsed') + 1,
            lastAttemptAt: new Date(),
        });
        return {
            message: "Test started successfully",
            attemptsUsed: attemptRecord.getDataValue('attemptsUsed'),
            remainingAttempts: attemptRecord.getDataValue('allowedAttempts') - attemptRecord.getDataValue('attemptsUsed'),
        };
    }
    catch (error) {
        throw error;
    }
});
exports.markTestStartedService = markTestStartedService;
/**
 * Mark that a user has completed a test
 */
const markTestCompletedService = (userId, testId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const attemptRecord = yield Usertestattempt_model_1.default.findOne({
            where: { userId, testId }
        });
        if (!attemptRecord) {
            throw new httpError_1.default("Test attempt record not found", 404);
        }
        yield attemptRecord.update({
            hasCompleted: true,
        });
        return { message: "Test marked as completed" };
    }
    catch (error) {
        throw error;
    }
});
exports.markTestCompletedService = markTestCompletedService;
/**
 * Admin grants additional attempts to a user for a specific test
 */
const grantTestAttemptsService = (adminId, userId, testId, additionalAttempts, reason) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Verify test exists
        const test = yield Test_model_1.default.findByPk(testId);
        if (!test) {
            throw new httpError_1.default("Test not found", 404);
        }
        // Verify user exists
        const user = yield User_model_1.default.findByPk(userId);
        if (!user) {
            throw new httpError_1.default("User not found", 404);
        }
        // Find or create the attempt record
        let attemptRecord = yield Usertestattempt_model_1.default.findOne({
            where: { userId, testId }
        });
        if (!attemptRecord) {
            // Create new record with the granted attempts
            attemptRecord = yield Usertestattempt_model_1.default.create({
                userId,
                testId,
                allowedAttempts: additionalAttempts,
                attemptsUsed: 0,
                hasStarted: false,
                hasCompleted: false,
                grantedBy: adminId,
                grantReason: reason,
            });
        }
        else {
            // Update existing record
            const currentAllowed = attemptRecord.getDataValue('allowedAttempts');
            yield attemptRecord.update({
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
    }
    catch (error) {
        throw error;
    }
});
exports.grantTestAttemptsService = grantTestAttemptsService;
/**
 * Admin resets all attempts for a user for a specific test
 */
const resetTestAttemptsService = (adminId_1, userId_1, testId_1, ...args_1) => __awaiter(void 0, [adminId_1, userId_1, testId_1, ...args_1], void 0, function* (adminId, userId, testId, newAllowedAttempts = 1, reason) {
    try {
        const attemptRecord = yield Usertestattempt_model_1.default.findOne({
            where: { userId, testId }
        });
        if (!attemptRecord) {
            throw new httpError_1.default("Test attempt record not found", 404);
        }
        yield attemptRecord.update({
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
    }
    catch (error) {
        throw error;
    }
});
exports.resetTestAttemptsService = resetTestAttemptsService;
/**
 * Get all users and their attempt status for a specific test (Admin only)
 */
const getTestAttemptsStatusService = (testId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const test = yield Test_model_1.default.findByPk(testId);
        if (!test) {
            throw new httpError_1.default("Test not found", 404);
        }
        const attempts = yield Usertestattempt_model_1.default.findAll({
            where: { testId },
            include: [
                {
                    model: User_model_1.default,
                    as: 'user',
                    attributes: ['id', 'name', 'email', 'role']
                },
                {
                    model: User_model_1.default,
                    as: 'admin',
                    attributes: ['id', 'name', 'email'],
                    required: false
                }
            ]
        });
        return attempts;
    }
    catch (error) {
        throw error;
    }
});
exports.getTestAttemptsStatusService = getTestAttemptsStatusService;
/**
 * Get user's attempt history for all tests or a specific test
 */
const getUserTestAttemptsService = (userId, testId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const whereClause = { userId };
        if (testId) {
            whereClause.testId = testId;
        }
        const attempts = yield Usertestattempt_model_1.default.findAll({
            where: whereClause,
            include: [
                {
                    model: Test_model_1.default,
                    as: 'test',
                    attributes: ['id', 'name', 'description', 'durationMinutes', 'numberOfQuestions']
                }
            ]
        });
        return attempts;
    }
    catch (error) {
        throw error;
    }
});
exports.getUserTestAttemptsService = getUserTestAttemptsService;
