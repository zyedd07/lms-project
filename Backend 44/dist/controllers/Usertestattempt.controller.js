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
exports.getUserTestAttemptsController = exports.getMyTestAttemptsController = exports.getTestAttemptsStatusController = exports.resetTestAttemptsController = exports.grantTestAttemptsController = exports.completeTestAttemptController = exports.startTestAttemptController = exports.checkTestEligibilityController = void 0;
const httpError_1 = __importDefault(require("../utils/httpError"));
const Usertestattempt_service_1 = require("../services/Usertestattempt.service");
const constants_1 = require("../utils/constants");
/**
 * Check if the current user can take a specific test
 * GET /api/test-attempts/eligibility/:testId
 */
const checkTestEligibilityController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.user.id) {
            throw new httpError_1.default("Authentication required", 401);
        }
        const { testId } = req.params;
        if (!testId) {
            throw new httpError_1.default("Test ID is required", 400);
        }
        const eligibility = yield (0, Usertestattempt_service_1.checkUserTestEligibilityService)(req.user.id, testId);
        res.status(200).json({ success: true, data: eligibility });
    }
    catch (error) {
        next(error);
    }
});
exports.checkTestEligibilityController = checkTestEligibilityController;
/**
 * Mark that the user has started a test (increments attempts used)
 * POST /api/test-attempts/start/:testId
 */
const startTestAttemptController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.user.id) {
            throw new httpError_1.default("Authentication required", 401);
        }
        const { testId } = req.params;
        if (!testId) {
            throw new httpError_1.default("Test ID is required", 400);
        }
        const result = yield (0, Usertestattempt_service_1.markTestStartedService)(req.user.id, testId);
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
exports.startTestAttemptController = startTestAttemptController;
/**
 * Mark that the user has completed a test
 * POST /api/test-attempts/complete/:testId
 */
const completeTestAttemptController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.user.id) {
            throw new httpError_1.default("Authentication required", 401);
        }
        const { testId } = req.params;
        if (!testId) {
            throw new httpError_1.default("Test ID is required", 400);
        }
        const result = yield (0, Usertestattempt_service_1.markTestCompletedService)(req.user.id, testId);
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
exports.completeTestAttemptController = completeTestAttemptController;
/**
 * Admin grants additional attempts to a user
 * POST /api/test-attempts/grant
 * Body: { userId, testId, additionalAttempts, reason? }
 */
const grantTestAttemptsController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.user.id || !req.user.role) {
            throw new httpError_1.default("Authentication required", 401);
        }
        if (req.user.role !== constants_1.Role.ADMIN) {
            throw new httpError_1.default("Only admins can grant additional attempts", 403);
        }
        const { userId, testId, additionalAttempts, reason } = req.body;
        if (!userId || !testId || additionalAttempts === undefined) {
            throw new httpError_1.default("User ID, Test ID, and additional attempts are required", 400);
        }
        if (typeof additionalAttempts !== 'number' || additionalAttempts < 1) {
            throw new httpError_1.default("Additional attempts must be a positive number", 400);
        }
        const result = yield (0, Usertestattempt_service_1.grantTestAttemptsService)(req.user.id, userId, testId, additionalAttempts, reason);
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
exports.grantTestAttemptsController = grantTestAttemptsController;
/**
 * Admin resets test attempts for a user
 * POST /api/test-attempts/reset
 * Body: { userId, testId, newAllowedAttempts?, reason? }
 */
const resetTestAttemptsController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.user.id || !req.user.role) {
            throw new httpError_1.default("Authentication required", 401);
        }
        if (req.user.role !== constants_1.Role.ADMIN) {
            throw new httpError_1.default("Only admins can reset test attempts", 403);
        }
        const { userId, testId, newAllowedAttempts, reason } = req.body;
        if (!userId || !testId) {
            throw new httpError_1.default("User ID and Test ID are required", 400);
        }
        const allowedAttempts = newAllowedAttempts !== undefined ? newAllowedAttempts : 1;
        if (typeof allowedAttempts !== 'number' || allowedAttempts < 1) {
            throw new httpError_1.default("Allowed attempts must be a positive number", 400);
        }
        const result = yield (0, Usertestattempt_service_1.resetTestAttemptsService)(req.user.id, userId, testId, allowedAttempts, reason);
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
exports.resetTestAttemptsController = resetTestAttemptsController;
/**
 * Admin gets all users' attempt status for a specific test
 * GET /api/test-attempts/test/:testId/status
 */
const getTestAttemptsStatusController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.user.role) {
            throw new httpError_1.default("Authentication required", 401);
        }
        if (req.user.role !== constants_1.Role.ADMIN && req.user.role !== constants_1.Role.TEACHER) {
            throw new httpError_1.default("Only admins and teachers can view test attempt status", 403);
        }
        const { testId } = req.params;
        if (!testId) {
            throw new httpError_1.default("Test ID is required", 400);
        }
        const attempts = yield (0, Usertestattempt_service_1.getTestAttemptsStatusService)(testId);
        res.status(200).json({ success: true, data: attempts });
    }
    catch (error) {
        next(error);
    }
});
exports.getTestAttemptsStatusController = getTestAttemptsStatusController;
/**
 * Get current user's test attempt history
 * GET /api/test-attempts/my-attempts
 * Query params: testId? (optional - to get attempts for a specific test)
 */
const getMyTestAttemptsController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.user.id) {
            throw new httpError_1.default("Authentication required", 401);
        }
        const { testId } = req.query;
        const attempts = yield (0, Usertestattempt_service_1.getUserTestAttemptsService)(req.user.id, testId);
        res.status(200).json({ success: true, data: attempts });
    }
    catch (error) {
        next(error);
    }
});
exports.getMyTestAttemptsController = getMyTestAttemptsController;
/**
 * Admin gets a specific user's test attempt history
 * GET /api/test-attempts/user/:userId
 * Query params: testId? (optional)
 */
const getUserTestAttemptsController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.user.role) {
            throw new httpError_1.default("Authentication required", 401);
        }
        if (req.user.role !== constants_1.Role.ADMIN && req.user.role !== constants_1.Role.TEACHER) {
            throw new httpError_1.default("Only admins and teachers can view user test attempts", 403);
        }
        const { userId } = req.params;
        const { testId } = req.query;
        if (!userId) {
            throw new httpError_1.default("User ID is required", 400);
        }
        const attempts = yield (0, Usertestattempt_service_1.getUserTestAttemptsService)(userId, testId);
        res.status(200).json({ success: true, data: attempts });
    }
    catch (error) {
        next(error);
    }
});
exports.getUserTestAttemptsController = getUserTestAttemptsController;
