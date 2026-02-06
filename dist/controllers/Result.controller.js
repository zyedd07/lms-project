"use strict";
// controllers/Result.controller.ts
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
exports.getUserStatisticsController = exports.deleteResultController = exports.getAllResultsController = exports.getResultsByTestController = exports.getMyResultsController = exports.getResultsByUserController = exports.getResultByIdController = exports.createResultController = void 0;
const httpError_1 = __importDefault(require("../utils/httpError"));
const Result_service_1 = require("../services/Result.service");
const constants_1 = require("../utils/constants");
const createResultController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.user.id) {
            throw new httpError_1.default("Authentication required", 401);
        }
        const { testId, score, totalPossiblePoints, correctCount, incorrectCount, skippedCount, totalQuestions, hasPassed, timeTaken, userAnswers } = req.body;
        if (!testId || score === undefined || !totalPossiblePoints || !userAnswers) {
            throw new httpError_1.default("Missing required fields", 400);
        }
        const result = yield (0, Result_service_1.createResultService)({
            userId: req.user.id,
            testId,
            score,
            totalPossiblePoints,
            correctCount: correctCount || 0,
            incorrectCount: incorrectCount || 0,
            skippedCount: skippedCount || 0,
            totalQuestions: totalQuestions || 0,
            hasPassed: hasPassed || false,
            timeTaken,
            userAnswers
        });
        res.status(201).json({
            success: true,
            message: "Result saved successfully",
            data: result
        });
    }
    catch (error) {
        next(error);
    }
});
exports.createResultController = createResultController;
const getResultByIdController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield (0, Result_service_1.getResultByIdService)(id);
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
exports.getResultByIdController = getResultByIdController;
const getResultsByUserController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { userId } = req.params;
        // Users can only view their own results unless they're admin
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== constants_1.Role.ADMIN && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id) !== userId) {
            throw new httpError_1.default("Unauthorized to view these results", 403);
        }
        const results = yield (0, Result_service_1.getResultsByUserService)(userId);
        res.status(200).json({ success: true, data: results });
    }
    catch (error) {
        next(error);
    }
});
exports.getResultsByUserController = getResultsByUserController;
const getMyResultsController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.user.id) {
            throw new httpError_1.default("Authentication required", 401);
        }
        const results = yield (0, Result_service_1.getResultsByUserService)(req.user.id);
        res.status(200).json({ success: true, data: results });
    }
    catch (error) {
        next(error);
    }
});
exports.getMyResultsController = getMyResultsController;
const getResultsByTestController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { testId } = req.params;
        const results = yield (0, Result_service_1.getResultsByTestService)(testId);
        res.status(200).json({ success: true, data: results });
    }
    catch (error) {
        next(error);
    }
});
exports.getResultsByTestController = getResultsByTestController;
const getAllResultsController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const results = yield (0, Result_service_1.getAllResultsService)();
        res.status(200).json({ success: true, data: results });
    }
    catch (error) {
        next(error);
    }
});
exports.getAllResultsController = getAllResultsController;
const deleteResultController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.user.role) {
            throw new httpError_1.default("Authentication required", 401);
        }
        if (req.user.role !== constants_1.Role.ADMIN) {
            throw new httpError_1.default("Unauthorized", 403);
        }
        const { id } = req.params;
        const result = yield (0, Result_service_1.deleteResultService)(id);
        res.status(200).json(Object.assign({ success: true }, result));
    }
    catch (error) {
        next(error);
    }
});
exports.deleteResultController = deleteResultController;
const getUserStatisticsController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { userId } = req.params;
        // Users can only view their own statistics unless they're admin
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== constants_1.Role.ADMIN && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id) !== userId) {
            throw new httpError_1.default("Unauthorized to view these statistics", 403);
        }
        const statistics = yield (0, Result_service_1.getUserTestStatisticsService)(userId);
        res.status(200).json({ success: true, data: statistics });
    }
    catch (error) {
        next(error);
    }
});
exports.getUserStatisticsController = getUserStatisticsController;
