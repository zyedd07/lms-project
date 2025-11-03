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
exports.deleteTestSeriesController = exports.updateTestSeriesController = exports.getTestSeriesController = exports.getTestSeriesByIdController = exports.getTestSeriesWithTestsController = exports.createTestSeriesController = void 0;
const httpError_1 = __importDefault(require("../utils/httpError"));
const TestSeries_service_1 = require("../services/TestSeries.service");
const constants_1 = require("../utils/constants");
const Test_model_1 = __importDefault(require("../models/Test.model")); // Correct: Test model
const TestSeries_model_1 = __importDefault(require("../models/TestSeries.model")); // Correct: TestSeries model
const User_model_1 = __importDefault(require("../models/User.model")); // Import User model for direct includes if needed
const createTestSeriesController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.user.id) {
            throw new httpError_1.default("Authentication required: User ID is missing.", 401);
        }
        const role = req.user.role;
        if (role !== constants_1.Role.ADMIN && role !== constants_1.Role.TEACHER) {
            throw new httpError_1.default("Unauthorized", 403);
        }
        const { name, description, price } = req.body; // Added price
        if (!name) {
            throw new httpError_1.default("Name is required", 400);
        }
        // Validate price presence if it's non-nullable in the schema
        if (typeof price === 'undefined' || price === null) {
            throw new httpError_1.default("Price is required", 400);
        }
        const newTestSeries = yield (0, TestSeries_service_1.createTestSeriesService)({
            name,
            description,
            price, // Pass price to the service
            createdBy: req.user.id, // Pass the ID of the authenticated user as the creator
        });
        res.status(201).json(newTestSeries);
    }
    catch (error) {
        next(error);
    }
});
exports.createTestSeriesController = createTestSeriesController;
// Renamed from getFullTestSeriesController to getTestSeriesWithTestsController
// to better reflect what it's fetching based on our new model hierarchy.
// This controller will now also include the creator of the TestSeries.
const getTestSeriesWithTestsController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const testSeriesData = yield TestSeries_model_1.default.findAll({
            // Include associated Tests
            include: [
                {
                    model: Test_model_1.default,
                    as: 'tests', // Ensure this alias matches the TestSeries.hasMany(Test, { as: 'tests' }) association
                    // If you need questions nested here, add another include:
                    // include: [{
                    //     model: Question,
                    //     as: 'questions' // Ensure this alias matches the Test.hasMany(Question, { as: 'questions' }) association
                    // }]
                },
                {
                    model: User_model_1.default,
                    as: 'creator', // This alias must match the 'as' in your TestSeries model association
                    required: false, // Set to true if a TestSeries MUST have a creator
                    attributes: ['id', 'name', 'email'] // Select specific user attributes
                }
            ]
        });
        res.status(200).json({ success: true, data: testSeriesData });
    }
    catch (error) {
        next(new httpError_1.default("Error fetching test series data with associated tests", 500));
    }
});
exports.getTestSeriesWithTestsController = getTestSeriesWithTestsController;
// Add a controller to get a single test series by ID, which can then be used to fetch its tests
const getTestSeriesByIdController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // FIX: Use the getTestSeriesByIdService which already includes the creator data
        const testSeries = yield (0, TestSeries_service_1.getTestSeriesByIdService)(id);
        if (!testSeries) {
            throw new httpError_1.default("Test Series not found", 404);
        }
        res.status(200).json({ success: true, data: testSeries });
    }
    catch (error) {
        next(error);
    }
});
exports.getTestSeriesByIdController = getTestSeriesByIdController;
const getTestSeriesController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // This service already includes the 'creator' information
        const testSeriesList = yield (0, TestSeries_service_1.getAllTestSeriesService)({});
        res.status(200).json({
            success: true,
            data: testSeriesList,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getTestSeriesController = getTestSeriesController;
const updateTestSeriesController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { name, description, price } = req.body;
        if (!req.user || !req.user.id || !req.user.role) { // Ensure user ID is available for authorization
            throw new httpError_1.default("Authentication required: User information is missing.", 401);
        }
        const userId = req.user.id;
        const role = req.user.role;
        // FIX: Fetch the test series with creator information for authorization
        const testSeries = yield (0, TestSeries_service_1.getTestSeriesByIdService)(id);
        if (!testSeries) {
            throw new httpError_1.default("Test Series not found", 404);
        }
        // Check if the user is authorized to update (creator, admin, or teacher)
        // FIX: Cast testSeries to 'any' to allow access to 'creator' property if TestSeriesData type is not yet updated
        if (((_a = testSeries.creator) === null || _a === void 0 ? void 0 : _a.id) !== userId && role !== constants_1.Role.ADMIN && role !== constants_1.Role.TEACHER) {
            throw new httpError_1.default("Unauthorized to update this test series.", 403);
        }
        const updatedTestSeries = yield (0, TestSeries_service_1.updateTestSeriesService)(id, { name, description, price });
        res.status(200).json({
            success: true,
            data: updatedTestSeries,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateTestSeriesController = updateTestSeriesController;
const deleteTestSeriesController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        if (!req.user || !req.user.id || !req.user.role) { // Ensure user ID is available for authorization
            throw new httpError_1.default("Authentication required: User information is missing.", 401);
        }
        const userId = req.user.id;
        const role = req.user.role;
        // FIX: Fetch the test series with creator information for authorization
        const testSeries = yield (0, TestSeries_service_1.getTestSeriesByIdService)(id);
        if (!testSeries) {
            // Corrected: Removed the duplicate 'new' keyword
            throw new httpError_1.default("Test Series not found", 404);
        }
        // Check if the user is authorized to delete (creator, admin, or teacher)
        // FIX: Cast testSeries to 'any' to allow access to 'creator' property if TestSeriesData type is not yet updated
        if (((_a = testSeries.creator) === null || _a === void 0 ? void 0 : _a.id) !== userId && role !== constants_1.Role.ADMIN && role !== constants_1.Role.TEACHER) {
            throw new httpError_1.default("Unauthorized to delete this test series.", 403);
        }
        const response = yield (0, TestSeries_service_1.deleteTestSeriesService)(id);
        res.status(200).json(Object.assign({ success: true }, response));
    }
    catch (error) {
        next(error);
    }
});
exports.deleteTestSeriesController = deleteTestSeriesController;
