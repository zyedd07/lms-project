"use strict";
// services/Result.service.ts
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
exports.getUserTestStatisticsService = exports.deleteResultService = exports.getAllResultsService = exports.getResultsByTestService = exports.getResultsByUserService = exports.getResultByIdService = exports.createResultService = void 0;
const Result_model_1 = __importDefault(require("../models/Result.model"));
const Test_model_1 = __importDefault(require("../models/Test.model"));
const User_model_1 = __importDefault(require("../models/User.model"));
const httpError_1 = __importDefault(require("../utils/httpError"));
const models_1 = require("../models");
const createResultService = (params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Verify test exists
        const test = yield Test_model_1.default.findByPk(params.testId);
        if (!test) {
            throw new httpError_1.default("Test not found", 404);
        }
        // Verify user exists
        const user = yield User_model_1.default.findByPk(params.userId);
        if (!user) {
            throw new httpError_1.default("User not found", 404);
        }
        // Calculate percentage score
        const percentageScore = params.totalPossiblePoints > 0
            ? (params.score / params.totalPossiblePoints) * 100
            : 0;
        // Create result
        const result = yield Result_model_1.default.create({
            userId: params.userId,
            testId: params.testId,
            score: params.score,
            totalPossiblePoints: params.totalPossiblePoints,
            correctCount: params.correctCount,
            incorrectCount: params.incorrectCount,
            skippedCount: params.skippedCount,
            totalQuestions: params.totalQuestions,
            percentageScore: percentageScore,
            hasPassed: params.hasPassed,
            timeTaken: params.timeTaken,
            userAnswers: params.userAnswers,
            completedAt: new Date(),
        });
        return result;
    }
    catch (error) {
        throw error;
    }
});
exports.createResultService = createResultService;
const getResultByIdService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield Result_model_1.default.findByPk(id, {
            include: [
                {
                    model: User_model_1.default,
                    as: 'user',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: Test_model_1.default,
                    as: 'test',
                    attributes: ['id', 'name', 'description', 'durationMinutes', 'passMarkPercentage']
                }
            ]
        });
        if (!result) {
            throw new httpError_1.default("Result not found", 404);
        }
        return result;
    }
    catch (error) {
        throw error;
    }
});
exports.getResultByIdService = getResultByIdService;
const getResultsByUserService = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const results = yield Result_model_1.default.findAll({
            where: { userId },
            include: [
                {
                    model: Test_model_1.default,
                    as: 'test',
                    attributes: ['id', 'name', 'description', 'durationMinutes', 'passMarkPercentage']
                }
            ],
            order: [['completedAt', 'DESC']]
        });
        return results;
    }
    catch (error) {
        throw error;
    }
});
exports.getResultsByUserService = getResultsByUserService;
const getResultsByTestService = (testId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const results = yield Result_model_1.default.findAll({
            where: { testId },
            include: [
                {
                    model: User_model_1.default,
                    as: 'user',
                    attributes: ['id', 'name', 'email']
                }
            ],
            order: [['completedAt', 'DESC']]
        });
        return results;
    }
    catch (error) {
        throw error;
    }
});
exports.getResultsByTestService = getResultsByTestService;
const getAllResultsService = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const results = yield Result_model_1.default.findAll({
            include: [
                {
                    model: User_model_1.default,
                    as: 'user',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: Test_model_1.default,
                    as: 'test',
                    attributes: ['id', 'name', 'description']
                }
            ],
            order: [['completedAt', 'DESC']]
        });
        return results;
    }
    catch (error) {
        throw error;
    }
});
exports.getAllResultsService = getAllResultsService;
const deleteResultService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield Result_model_1.default.findByPk(id);
        if (!result) {
            throw new httpError_1.default("Result not found", 404);
        }
        yield result.destroy();
        return { message: "Result deleted successfully" };
    }
    catch (error) {
        throw error;
    }
});
exports.deleteResultService = deleteResultService;
const getUserTestStatisticsService = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const results = yield Result_model_1.default.findAll({
            where: { userId },
            attributes: [
                'testId',
                [models_1.sequelize.fn('COUNT', models_1.sequelize.col('id')), 'attemptCount'],
                [models_1.sequelize.fn('AVG', models_1.sequelize.col('score')), 'averageScore'],
                [models_1.sequelize.fn('MAX', models_1.sequelize.col('score')), 'highestScore'],
                [models_1.sequelize.fn('MIN', models_1.sequelize.col('score')), 'lowestScore'],
            ],
            group: ['testId'],
            include: [
                {
                    model: Test_model_1.default,
                    as: 'test',
                    attributes: ['id', 'name']
                }
            ]
        });
        return results;
    }
    catch (error) {
        throw error;
    }
});
exports.getUserTestStatisticsService = getUserTestStatisticsService;
