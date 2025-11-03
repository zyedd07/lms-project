"use strict";
// services/Question.service.ts
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
exports.getQuestionsByTestService = exports.deleteQuestionService = exports.updateQuestionService = exports.getQuestionByIdService = exports.createQuestionService = void 0;
const Question_model_1 = __importDefault(require("../models/Question.model"));
const httpError_1 = __importDefault(require("../utils/httpError"));
const createQuestionService = (params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const newQuestion = yield Question_model_1.default.create({
            testId: params.testId,
            questionText: params.questionText,
            options: params.options,
            correctAnswerIndex: params.correctAnswerIndex,
            points: params.points,
            negativePoints: params.negativePoints, // <--- ADD THIS LINE
        });
        return newQuestion;
    }
    catch (error) {
        throw error;
    }
});
exports.createQuestionService = createQuestionService;
const getQuestionByIdService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const question = yield Question_model_1.default.findByPk(id);
        if (!question) {
            throw new httpError_1.default("Question not found", 404);
        }
        return question;
    }
    catch (error) {
        throw error;
    }
});
exports.getQuestionByIdService = getQuestionByIdService;
const updateQuestionService = (id, params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const question = yield Question_model_1.default.findByPk(id);
        if (!question) {
            throw new httpError_1.default("Question not found", 404);
        }
        yield question.update(params);
        return { message: "Question updated successfully" };
    }
    catch (error) {
        throw error;
    }
});
exports.updateQuestionService = updateQuestionService;
const deleteQuestionService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const question = yield Question_model_1.default.findByPk(id);
        if (!question) {
            throw new httpError_1.default("Question not found", 404);
        }
        yield question.destroy();
        return { message: "Question deleted successfully" };
    }
    catch (error) {
        throw error;
    }
});
exports.deleteQuestionService = deleteQuestionService;
const getQuestionsByTestService = (testId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const questions = yield Question_model_1.default.findAll({ where: { testId } });
        return questions;
    }
    catch (error) {
        throw error;
    }
});
exports.getQuestionsByTestService = getQuestionsByTestService;
