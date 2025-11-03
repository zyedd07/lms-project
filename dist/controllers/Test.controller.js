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
exports.getTestsByTestSeriesController = exports.deleteTestController = exports.updateTestController = exports.getTestController = exports.createTestController = void 0;
const httpError_1 = __importDefault(require("../utils/httpError"));
const Test_service_1 = require("../services/Test.service");
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
const getTestController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const test = yield (0, Test_service_1.getTestByIdService)(id);
        res.status(200).json({ success: true, data: test });
    }
    catch (error) {
        next(error);
    }
});
exports.getTestController = getTestController;
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
