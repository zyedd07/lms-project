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
exports.checkTestScheduleService = exports.getTestsByTestSeriesService = exports.deleteTestService = exports.updateTestService = exports.getTestByIdService = exports.createTestService = void 0;
const Test_model_1 = __importDefault(require("../models/Test.model"));
const httpError_1 = __importDefault(require("../utils/httpError"));
const sequelize_1 = require("sequelize");
const createTestService = (params) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const existingTest = yield Test_model_1.default.findOne({
            where: { name: params.name, testSeriesId: params.testSeriesId },
        });
        if (existingTest) {
            throw new httpError_1.default("A test with the same name already exists in this test series", 400);
        }
        const newTest = yield Test_model_1.default.create({
            testSeriesId: params.testSeriesId,
            name: params.name,
            description: params.description,
            durationMinutes: params.durationMinutes,
            numberOfQuestions: params.numberOfQuestions,
            passMarkPercentage: params.passMarkPercentage,
            createdBy: params.createdBy,
            scheduledStartTime: (_a = params.scheduledStartTime) !== null && _a !== void 0 ? _a : null, // NEW
            scheduledEndTime: (_b = params.scheduledEndTime) !== null && _b !== void 0 ? _b : null, // NEW
            timerEnabled: (_c = params.timerEnabled) !== null && _c !== void 0 ? _c : true, // NEW
        });
        return newTest;
    }
    catch (error) {
        throw error;
    }
});
exports.createTestService = createTestService;
const getTestByIdService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const test = yield Test_model_1.default.findByPk(id);
        if (!test) {
            throw new httpError_1.default("Test not found", 404);
        }
        return test;
    }
    catch (error) {
        throw error;
    }
});
exports.getTestByIdService = getTestByIdService;
const updateTestService = (id, params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const test = yield Test_model_1.default.findByPk(id);
        if (!test) {
            throw new httpError_1.default("Test not found", 404);
        }
        const currentName = test.getDataValue('name');
        const currentTestSeriesId = test.getDataValue('testSeriesId');
        if ((params.name !== undefined && params.name !== currentName) ||
            (params.testSeriesId !== undefined && params.testSeriesId !== currentTestSeriesId)) {
            const targetName = params.name !== undefined ? params.name : currentName;
            const targetTestSeriesId = params.testSeriesId !== undefined ? params.testSeriesId : currentTestSeriesId;
            const existingTestWithNewName = yield Test_model_1.default.findOne({
                where: {
                    name: targetName,
                    testSeriesId: targetTestSeriesId,
                    id: { [sequelize_1.Op.ne]: id }
                },
            });
            if (existingTestWithNewName) {
                throw new httpError_1.default("A test with this name already exists in the target test series", 400);
            }
        }
        yield test.update(params);
        return { message: "Test updated successfully" };
    }
    catch (error) {
        throw error;
    }
});
exports.updateTestService = updateTestService;
const deleteTestService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const test = yield Test_model_1.default.findByPk(id);
        if (!test) {
            throw new httpError_1.default("Test not found", 404);
        }
        yield test.destroy();
        return { message: "Test deleted successfully" };
    }
    catch (error) {
        throw error;
    }
});
exports.deleteTestService = deleteTestService;
const getTestsByTestSeriesService = (testSeriesId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tests = yield Test_model_1.default.findAll({ where: { testSeriesId } });
        return tests;
    }
    catch (error) {
        throw error;
    }
});
exports.getTestsByTestSeriesService = getTestsByTestSeriesService;
const checkTestScheduleService = (test) => {
    const now = new Date();
    const scheduledStartTime = test.getDataValue
        ? test.getDataValue('scheduledStartTime')
        : test.scheduledStartTime;
    const scheduledEndTime = test.getDataValue
        ? test.getDataValue('scheduledEndTime')
        : test.scheduledEndTime;
    const timerEnabled = test.getDataValue
        ? test.getDataValue('timerEnabled')
        : test.timerEnabled;
    if (scheduledStartTime && now < new Date(scheduledStartTime)) {
        return {
            accessible: false,
            timerEnabled: timerEnabled !== null && timerEnabled !== void 0 ? timerEnabled : true,
            reason: `This test will open at ${new Date(scheduledStartTime).toLocaleString()}`,
        };
    }
    if (scheduledEndTime && now > new Date(scheduledEndTime)) {
        return {
            accessible: false,
            timerEnabled: timerEnabled !== null && timerEnabled !== void 0 ? timerEnabled : true,
            reason: `This test will open at ${new Date(scheduledStartTime).toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata'
            })}`,
        };
    }
    return { accessible: true, timerEnabled: timerEnabled !== null && timerEnabled !== void 0 ? timerEnabled : true };
};
exports.checkTestScheduleService = checkTestScheduleService;
