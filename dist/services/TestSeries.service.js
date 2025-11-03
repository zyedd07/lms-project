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
exports.deleteTestSeriesService = exports.getTestSeriesByIdService = exports.getAllTestSeriesService = exports.updateTestSeriesService = exports.createTestSeriesService = void 0;
const TestSeries_model_1 = __importDefault(require("../models/TestSeries.model"));
const httpError_1 = __importDefault(require("../utils/httpError"));
const User_model_1 = __importDefault(require("../models/User.model")); // Import the User model
/**
 * Creates a new Test Series record in the database.
 * @param params - Contains all necessary data for creating a test series, including the price and createdBy (uploaderId).
 * @returns A Promise that resolves to the created TestSeriesData.
 * @throws HttpError if required parameters are missing or if a unique constraint is violated.
 */
const createTestSeriesService = (params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // FIX: Ensure createdBy is present for creation
        if (!params.createdBy) {
            throw new httpError_1.default("Creator ID is required to create a test series.", 400);
        }
        const existingTestSeries = yield TestSeries_model_1.default.findOne({
            where: { name: params.name, createdBy: params.createdBy },
        });
        if (existingTestSeries) {
            throw new httpError_1.default("Test Series already exists with the same name by this creator.", 400);
        }
        const newTestSeries = yield TestSeries_model_1.default.create({
            name: params.name,
            description: params.description,
            price: params.price,
            createdBy: params.createdBy, // Assign the createdBy (uploader) ID
        });
        // FIX: Return the created test series as plain data, potentially including creator if needed by controller
        // For consistency, services often return plain data
        return newTestSeries.toJSON();
    }
    catch (error) {
        throw error;
    }
});
exports.createTestSeriesService = createTestSeriesService;
/**
 * Updates an existing Test Series record in the database.
 * @param id - The ID of the test series to update.
 * @param params - An object containing the fields to update.
 * @returns A Promise that resolves with a success message.
 * @throws HttpError if the test series is not found.
 */
const updateTestSeriesService = (id, params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const testSeries = yield TestSeries_model_1.default.findOne({
            where: { id },
        });
        if (!testSeries) {
            throw new httpError_1.default("Test Series not found", 404);
        }
        // Update all provided parameters, including price if it exists in params
        yield testSeries.update(params); // Use instance update for better type inference and hooks
        // FIX: Fetch the updated test series with creator information to return
        const updatedTestSeries = yield TestSeries_model_1.default.findByPk(id, {
            include: [{
                    model: User_model_1.default,
                    as: 'creator', // This alias must match the 'as' in your TestSeries model association
                    attributes: ['id', 'name', 'email'] // Select specific user attributes
                }]
        });
        if (!updatedTestSeries) {
            throw new httpError_1.default("Failed to retrieve updated Test Series.", 500);
        }
        return updatedTestSeries.toJSON();
    }
    catch (error) {
        throw error;
    }
});
exports.updateTestSeriesService = updateTestSeriesService;
/**
 * Retrieves all Test Series records from the database, including creator information.
 * @param filter - Optional filter object for the query.
 * @returns A Promise that resolves to an array of TestSeriesData.
 */
const getAllTestSeriesService = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filter = {}) {
    try {
        // FIX: Include the User model for creator information
        const testSeriesList = yield TestSeries_model_1.default.findAll({
            where: filter,
            include: [{
                    model: User_model_1.default,
                    as: 'creator', // This alias must match the 'as' in your TestSeries model association
                    required: false, // Set to true if a TestSeries MUST have a creator
                    attributes: ['id', 'name', 'email'] // Select specific user attributes
                }]
        });
        return testSeriesList.map(ts => ts.toJSON());
    }
    catch (error) {
        throw error;
    }
});
exports.getAllTestSeriesService = getAllTestSeriesService;
/**
 * Retrieves a single Test Series record by its ID, including creator information.
 * @param id - The ID of the test series to retrieve.
 * @returns A Promise that resolves to the TestSeriesData.
 * @throws HttpError if the test series is not found.
 */
const getTestSeriesByIdService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // FIX: Include the User model for creator information
        const testSeries = yield TestSeries_model_1.default.findByPk(id, {
            include: [{
                    model: User_model_1.default,
                    as: 'creator', // This alias must match the 'as' in your TestSeries model association
                    required: false,
                    attributes: ['id', 'name', 'email']
                }]
        });
        if (!testSeries) {
            throw new httpError_1.default("Test Series not found.", 404);
        }
        return testSeries.toJSON();
    }
    catch (error) {
        throw error;
    }
});
exports.getTestSeriesByIdService = getTestSeriesByIdService;
/**
 * Deletes a Test Series record from the database.
 * @param id - The ID of the test series to delete.
 * @returns A Promise that resolves with a success message.
 * @throws HttpError if the test series is not found.
 */
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
