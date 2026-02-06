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
exports.getTestsByTestSeriesController = exports.deleteTestController = exports.updateTestController = exports.startTestController = exports.getTestController = exports.createTestController = void 0;
const httpError_1 = __importDefault(require("../utils/httpError"));
const Test_service_1 = require("../services/Test.service");
const Usertestattempt_service_1 = require("../services/Usertestattempt.service");
const constants_1 = require("../utils/constants");
const createTestController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Ensure user is authenticated and ID exists for 'createdBy' field
        if (!req.user || !req.user.id) {
            throw new httpError_1.default("Authentication required: User ID is missing.", 401);
        }
        const role = req.user.role;
        // Authorization check
        if (role !== constants_1.Role.ADMIN && role !== constants_1.Role.TEACHER) {
            throw new httpError_1.default("Unauthorized", 403);
        }
        // Destructure all required fields for Test creation
        const { testSeriesId, name, description, durationMinutes, numberOfQuestions, passMarkPercentage } = req.body;
        // Basic input validation
        if (!testSeriesId || !name || durationMinutes === undefined || numberOfQuestions === undefined || passMarkPercentage === undefined) {
            throw new httpError_1.default("TestSeries ID, name, duration, number of questions, and pass mark are required.", 400);
        }
        // Call the service with ALL necessary parameters, including createdBy
        const newTest = yield (0, Test_service_1.createTestService)({
            testSeriesId,
            name,
            description,
            durationMinutes,
            numberOfQuestions,
            passMarkPercentage,
            createdBy: req.user.id, // Pass the ID of the authenticated user
        });
        res.status(201).json(newTest);
    }
    catch (error) {
        next(error); // Pass error to Express error handling middleware
    }
});
exports.createTestController = createTestController;
/**
 * Get test details and check if user can attempt it
 * This combines getting test info + checking eligibility
 */
const getTestController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const test = yield (0, Test_service_1.getTestByIdService)(id);
        // If user is authenticated (not admin/teacher viewing), check eligibility
        if (req.user && req.user.id && req.user.role === constants_1.Role.STUDENT) {
            try {
                const eligibility = yield (0, Usertestattempt_service_1.checkUserTestEligibilityService)(req.user.id, id);
                res.status(200).json({
                    success: true,
                    data: {
                        test,
                        attemptInfo: eligibility
                    }
                });
                return;
            }
            catch (err) {
                // If eligibility check fails, still return test data
                console.error("Error checking eligibility:", err);
            }
        }
        res.status(200).json({ success: true, data: { test } });
    }
    catch (error) {
        next(error);
    }
});
exports.getTestController = getTestController;
/**
 * NEW: Start a test attempt
 * This should be called when user clicks "Start Test"
 * It checks eligibility and marks the attempt as started
 */
const startTestController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.user.id) {
            throw new httpError_1.default("Authentication required", 401);
        }
        const { testId } = req.params;
        if (!testId) {
            throw new httpError_1.default("Test ID is required", 400);
        }
        // First, check eligibility
        const eligibility = yield (0, Usertestattempt_service_1.checkUserTestEligibilityService)(req.user.id, testId);
        if (!eligibility.canAttempt) {
            throw new httpError_1.default(`You have no remaining attempts for this test. Used: ${eligibility.attemptsUsed}/${eligibility.allowedAttempts}`, 403);
        }
        // Mark test as started (increments attempt counter)
        const result = yield (0, Usertestattempt_service_1.markTestStartedService)(req.user.id, testId);
        // Get full test details to return
        const test = yield (0, Test_service_1.getTestByIdService)(testId);
        res.status(200).json({
            success: true,
            data: {
                message: "Test started successfully",
                test,
                attemptInfo: result
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.startTestController = startTestController;
const updateTestController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Destructure ALL updatable fields from req.body
        const { name, description, durationMinutes, numberOfQuestions, passMarkPercentage } = req.body;
        // Ensure user is authenticated and role exists for authorization
        if (!req.user || !req.user.role) {
            throw new httpError_1.default("Authentication required: User role is missing.", 401);
        }
        const role = req.user.role;
        // Authorization check
        if (role !== constants_1.Role.ADMIN && role !== constants_1.Role.TEACHER) {
            throw new httpError_1.default("Unauthorized", 403);
        }
        // Call the service with ALL updatable parameters
        const result = yield (0, Test_service_1.updateTestService)(id, {
            name,
            description,
            durationMinutes,
            numberOfQuestions,
            passMarkPercentage,
        });
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
exports.updateTestController = updateTestController;
const deleteTestController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Ensure user is authenticated and role exists for authorization
        if (!req.user || !req.user.role) {
            throw new httpError_1.default("Authentication required: User role is missing.", 401);
        }
        const role = req.user.role;
        // Authorization check
        if (role !== constants_1.Role.ADMIN && role !== constants_1.Role.TEACHER) {
            throw new httpError_1.default("Unauthorized", 403);
        }
        const result = yield (0, Test_service_1.deleteTestService)(id);
        res.status(200).json(Object.assign({ success: true }, result));
    }
    catch (error) {
        next(error);
    }
});
exports.deleteTestController = deleteTestController;
const getTestsByTestSeriesController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { testSeriesId } = req.query; // Expecting testSeriesId as a query parameter
        if (!testSeriesId) {
            throw new httpError_1.default("TestSeries ID is required as a query parameter (e.g., ?testSeriesId=...).", 400);
        }
        // Cast testSeriesId to string as req.query parameters are typically strings
        const tests = yield (0, Test_service_1.getTestsByTestSeriesService)(testSeriesId);
        res.status(200).json({ success: true, data: tests });
    }
    catch (error) {
        next(error);
    }
});
exports.getTestsByTestSeriesController = getTestsByTestSeriesController;
