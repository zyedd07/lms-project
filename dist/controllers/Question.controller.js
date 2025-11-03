"use strict";
// controllers/Question.controller.ts
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
exports.deleteQuestionController = exports.updateQuestionController = exports.getQuestionsController = exports.getQuestionByIdController = exports.createQuestionController = void 0;
const httpError_1 = __importDefault(require("../utils/httpError"));
const Question_service_1 = require("../services/Question.service");
const constants_1 = require("../utils/constants");
const createQuestionController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.user.role) {
            throw new httpError_1.default("Authentication required: User role is missing.", 401);
        }
        const role = req.user.role;
        if (role !== constants_1.Role.ADMIN && role !== constants_1.Role.TEACHER) {
            throw new httpError_1.default("Unauthorized", 403);
        }
        // --- UPDATED: Destructure negativePoints ---
        const { testId, questionText, options, correctAnswerIndex, points, negativePoints } = req.body;
        if (!testId || !questionText || !options || correctAnswerIndex === undefined || points === undefined || negativePoints === undefined) {
            throw new httpError_1.default("Test ID, question text, options, correct answer index, points, and negative points are all required.", 400);
        }
        if (!Array.isArray(options) || options.length < 2) {
            throw new httpError_1.default("Options must be an array with at least two elements.", 400);
        }
        if (correctAnswerIndex < 0 || correctAnswerIndex >= options.length) {
            throw new httpError_1.default("Correct answer index is invalid for the provided options.", 400);
        }
        if (points < 1) {
            throw new httpError_1.default("Points must be at least 1.", 400);
        }
        if (negativePoints < 0) { // Ensure negative points are non-negative for deduction logic
            throw new httpError_1.default("Negative points cannot be less than 0.", 400);
        }
        const newQuestion = yield (0, Question_service_1.createQuestionService)({
            testId,
            questionText,
            options,
            correctAnswerIndex,
            points,
            negativePoints, // <--- PASS TO SERVICE
        });
        res.status(201).json(newQuestion);
    }
    catch (error) {
        next(error);
    }
});
exports.createQuestionController = createQuestionController;
const getQuestionByIdController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const question = yield (0, Question_service_1.getQuestionByIdService)(id);
        res.status(200).json({ success: true, data: question });
    }
    catch (error) {
        next(error);
    }
});
exports.getQuestionByIdController = getQuestionByIdController;
const getQuestionsController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { testId } = req.query;
        if (!testId) {
            throw new httpError_1.default("Test ID is required as a query parameter (e.g., ?testId=...).", 400);
        }
        const questions = yield (0, Question_service_1.getQuestionsByTestService)(testId);
        res.status(200).json({ success: true, data: questions });
    }
    catch (error) {
        next(error);
    }
});
exports.getQuestionsController = getQuestionsController;
const updateQuestionController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.user.role) {
            throw new httpError_1.default("Authentication required: User role is missing.", 401);
        }
        const role = req.user.role;
        if (role !== constants_1.Role.ADMIN && role !== constants_1.Role.TEACHER) {
            throw new httpError_1.default("Unauthorized", 403);
        }
        const { id } = req.params;
        // --- UPDATED: Destructure negativePoints ---
        const { questionText, options, correctAnswerIndex, points, negativePoints } = req.body;
        if (options && (!Array.isArray(options) || options.length < 2)) {
            throw new httpError_1.default("Options must be an array with at least two elements.", 400);
        }
        if (correctAnswerIndex !== undefined && (correctAnswerIndex < 0 || (options && correctAnswerIndex >= options.length))) {
            throw new httpError_1.default("Correct answer index is invalid for the provided options.", 400);
        }
        if (points !== undefined && points < 1) {
            throw new httpError_1.default("Points must be at least 1.", 400);
        }
        if (negativePoints !== undefined && negativePoints < 0) { // Validate if provided
            throw new httpError_1.default("Negative points cannot be less than 0.", 400);
        }
        const result = yield (0, Question_service_1.updateQuestionService)(id, {
            questionText,
            options,
            correctAnswerIndex,
            points,
            negativePoints, // <--- PASS TO SERVICE
        });
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
exports.updateQuestionController = updateQuestionController;
const deleteQuestionController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.user.role) {
            throw new httpError_1.default("Authentication required: User role is missing.", 401);
        }
        const role = req.user.role;
        if (role !== constants_1.Role.ADMIN && role !== constants_1.Role.TEACHER) {
            throw new httpError_1.default("Unauthorized", 403);
        }
        const { id } = req.params;
        const result = yield (0, Question_service_1.deleteQuestionService)(id);
        res.status(200).json(Object.assign({ success: true }, result));
    }
    catch (error) {
        next(error);
    }
});
exports.deleteQuestionController = deleteQuestionController;
