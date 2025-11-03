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
exports.getTestsByTestSeriesService = exports.deleteTestService = exports.updateTestService = exports.getTestByIdService = exports.createTestService = void 0;
const Test_model_1 = __importDefault(require("../models/Test.model"));
const httpError_1 = __importDefault(require("../utils/httpError"));
const sequelize_1 = require("sequelize"); // Ensure Op is imported from sequelize
// Assume these types are correctly defined in ../utils/types.ts
// For example:
// export interface CreateTestServiceParams {
//   testSeriesId: string;
//   name: string;
//   description?: string;
//   durationMinutes: number;
//   numberOfQuestions: number;
//   passMarkPercentage: number;
//   createdBy: string;
// }
//
// export type UpdateTestServiceParams = Partial<Omit<CreateTestServiceParams, 'createdBy'>>;
// (You might also want to exclude 'testSeriesId' if it's never meant to be updated, but currently it is in params)
const createTestService = (params) => __awaiter(void 0, void 0, void 0, function* () {
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
        // To address TS2339: Property 'name' does not exist on type 'Model<any, any>'.
        // Ensure test.name and test.testSeriesId are treated as strings.
        // We can assert 'test' as a specific type if needed, or simply check existence of params properties.
        const currentName = test.getDataValue('name'); // Safely get current name
        const currentTestSeriesId = test.getDataValue('testSeriesId'); // Safely get current testSeriesId
        // Check if 'name' or 'testSeriesId' are provided in params AND if they are different from current values
        if ((params.name !== undefined && params.name !== currentName) ||
            (params.testSeriesId !== undefined && params.testSeriesId !== currentTestSeriesId)) {
            const targetName = params.name !== undefined ? params.name : currentName;
            const targetTestSeriesId = params.testSeriesId !== undefined ? params.testSeriesId : currentTestSeriesId;
            const existingTestWithNewName = yield Test_model_1.default.findOne({
                where: {
                    name: targetName,
                    testSeriesId: targetTestSeriesId,
                    id: { [sequelize_1.Op.ne]: id } // Exclude current test from check
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
