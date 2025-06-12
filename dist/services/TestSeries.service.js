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
exports.deleteTestSeriesService = exports.getAllTestSeriesService = exports.updateTestSeriesService = exports.createTestSeriesService = void 0;
const TestSeries_model_1 = __importDefault(require("../models/TestSeries.model"));
const httpError_1 = __importDefault(require("../utils/httpError"));
const createTestSeriesService = (params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const existingTestSeries = yield TestSeries_model_1.default.findOne({
            where: { name: params.name, createdBy: params.createdBy },
        });
        if (existingTestSeries) {
            throw new httpError_1.default("Test Series already exists with the same name", 400);
        }
        const newTestSeries = yield TestSeries_model_1.default.create({
            name: params.name,
            description: params.description,
            price: params.price, // Include the price field
            createdBy: params.createdBy,
        });
        return newTestSeries;
    }
    catch (error) {
        throw error;
    }
});
exports.createTestSeriesService = createTestSeriesService;
const updateTestSeriesService = (id, params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const testSeries = yield TestSeries_model_1.default.findOne({
            where: { id },
        });
        if (!testSeries) {
            throw new httpError_1.default("Test Series not found", 404);
        }
        // Update all provided parameters, including price if it exists in params
        yield TestSeries_model_1.default.update(params, { where: { id } });
        return { message: "Test Series updated successfully" };
    }
    catch (error) {
        throw error;
    }
});
exports.updateTestSeriesService = updateTestSeriesService;
const getAllTestSeriesService = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filter = {}) {
    try {
        const testSeriesList = yield TestSeries_model_1.default.findAll({ where: filter });
        return testSeriesList;
    }
    catch (error) {
        throw error;
    }
});
exports.getAllTestSeriesService = getAllTestSeriesService;
const deleteTestSeriesService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const testSeries = yield TestSeries_model_1.default.findOne({ where: { id } });
        if (!testSeries) {
            throw new httpError_1.default("Test Series not found", 404);
        }
        yield testSeries.destroy();
        return { message: "Test Series deleted successfully" };
    }
    catch (error) {
        throw error;
    }
});
exports.deleteTestSeriesService = deleteTestSeriesService;
