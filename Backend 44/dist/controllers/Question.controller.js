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
exports.deleteQuestionController = exports.updateQuestionController = exports.getQuestionsController = exports.getQuestionByIdController = exports.createQuestionController = void 0;
const httpError_1 = __importDefault(require("../utils/httpError"));
const Question_service_1 = require("../services/Question.service");
const constants_1 = require("../utils/constants");
const VALID_TYPES = ['mcq', 'match_the_pair', 'image_based'];
const createQuestionController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.role))
            throw new httpError_1.default("Authentication required.", 401);
        if (req.user.role !== constants_1.Role.ADMIN && req.user.role !== constants_1.Role.TEACHER)
            throw new httpError_1.default("Unauthorized", 403);
        const { testId, questionType = 'mcq', questionText, questionImageUrl, options, correctAnswerIndex, pairs, points, negativePoints } = req.body;
        if (!testId || !questionText || points === undefined || negativePoints === undefined) {
            throw new httpError_1.default("testId, questionText, points, and negativePoints are required.", 400);
        }
        if (!VALID_TYPES.includes(questionType)) {
            throw new httpError_1.default(`questionType must be one of: ${VALID_TYPES.join(', ')}`, 400);
        }
        if (points < 1)
            throw new httpError_1.default("Points must be at least 1.", 400);
        if (negativePoints > 0)
            throw new httpError_1.default("Negative points must be 0 or negative.", 400);
        // MCQ and image_based validation
        if (questionType === 'mcq' || questionType === 'image_based') {
            if (!Array.isArray(options) || options.length < 2) {
                throw new httpError_1.default("options must be an array with at least 2 elements.", 400);
            }
            if (correctAnswerIndex === undefined || correctAnswerIndex < 0 || correctAnswerIndex >= options.length) {
                throw new httpError_1.default("correctAnswerIndex is invalid.", 400);
            }
            if (questionType === 'image_based' && !questionImageUrl) {
                throw new httpError_1.default("questionImageUrl is required for image_based questions.", 400);
            }
        }
        // Match the pair validation
        if (questionType === 'match_the_pair') {
            if (!Array.isArray(pairs) || pairs.length < 2) {
                throw new httpError_1.default("pairs must be an array with at least 2 items.", 400);
            }
            for (const pair of pairs) {
                if (!pair.left || !pair.right) {
                    throw new httpError_1.default("Each pair must have 'left' and 'right' values.", 400);
                }
            }
        }
        const newQuestion = yield (0, Question_service_1.createQuestionService)({
            testId, questionType, questionText, questionImageUrl,
            options, correctAnswerIndex, pairs, points, negativePoints,
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
        const question = yield (0, Question_service_1.getQuestionByIdService)(req.params.id);
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
        if (!testId)
            throw new httpError_1.default("testId query param is required.", 400);
        const questions = yield (0, Question_service_1.getQuestionsByTestService)(testId);
        res.status(200).json({ success: true, data: questions });
    }
    catch (error) {
        next(error);
    }
});
exports.getQuestionsController = getQuestionsController;
const updateQuestionController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.role))
            throw new httpError_1.default("Authentication required.", 401);
        if (req.user.role !== constants_1.Role.ADMIN && req.user.role !== constants_1.Role.TEACHER)
            throw new httpError_1.default("Unauthorized", 403);
        const { id } = req.params;
        const { questionType, questionText, questionImageUrl, options, correctAnswerIndex, pairs, points, negativePoints } = req.body;
        if (questionType && !VALID_TYPES.includes(questionType)) {
            throw new httpError_1.default(`questionType must be one of: ${VALID_TYPES.join(', ')}`, 400);
        }
        if (points !== undefined && points < 1)
            throw new httpError_1.default("Points must be at least 1.", 400);
        if (negativePoints !== undefined && negativePoints > 0)
            throw new httpError_1.default("Negative points must be 0 or negative.", 400);
        if (options && (!Array.isArray(options) || options.length < 2)) {
            throw new httpError_1.default("options must be an array with at least 2 elements.", 400);
        }
        if (pairs && (!Array.isArray(pairs) || pairs.length < 2)) {
            throw new httpError_1.default("pairs must be an array with at least 2 items.", 400);
        }
        const result = yield (0, Question_service_1.updateQuestionService)(id, {
            questionType, questionText, questionImageUrl,
            options, correctAnswerIndex, pairs, points, negativePoints,
        });
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
exports.updateQuestionController = updateQuestionController;
const deleteQuestionController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.role))
            throw new httpError_1.default("Authentication required.", 401);
        if (req.user.role !== constants_1.Role.ADMIN && req.user.role !== constants_1.Role.TEACHER)
            throw new httpError_1.default("Unauthorized", 403);
        const result = yield (0, Question_service_1.deleteQuestionService)(req.params.id);
        res.status(200).json(Object.assign({ success: true }, result));
    }
    catch (error) {
        next(error);
    }
});
exports.deleteQuestionController = deleteQuestionController;
