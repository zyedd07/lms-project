"use strict";
// src/controllers/brandCategoryController.ts
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
exports.deleteBrandCategoryController = exports.updateBrandCategoryController = exports.getAllBrandCategoriesController = exports.getBrandCategoryByIdController = exports.createBrandCategoryController = void 0;
const httpError_1 = __importDefault(require("../utils/httpError"));
const constants_1 = require("../utils/constants");
const brandCategoryService_1 = require("../services/brandCategoryService"); // Ensure correct import path
const createBrandCategoryController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (role !== constants_1.Role.ADMIN) {
            throw new httpError_1.default('Unauthorized: Only admins can create brand categories.', 403);
        }
        const { name } = req.body; // Only 'name' is expected for creation
        if (!name) {
            throw new httpError_1.default('Please provide the brand category name.', 400);
        }
        const newBrandCategory = yield (0, brandCategoryService_1.createBrandCategoryService)({ name });
        res.status(201).json({
            success: true,
            message: "Brand category created successfully.",
            data: newBrandCategory
        });
    }
    catch (error) {
        next(error);
    }
});
exports.createBrandCategoryController = createBrandCategoryController;
const getBrandCategoryByIdController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id) {
            throw new httpError_1.default('Brand Category ID is required in URL parameters.', 400);
        }
        const brandCategory = yield (0, brandCategoryService_1.getBrandCategoryByIdService)(id);
        res.status(200).json({
            success: true,
            data: brandCategory
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getBrandCategoryByIdController = getBrandCategoryByIdController;
const getAllBrandCategoriesController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const brandCategories = yield (0, brandCategoryService_1.getAllBrandCategoriesService)();
        res.status(200).json({
            success: true,
            data: brandCategories
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getAllBrandCategoriesController = getAllBrandCategoriesController;
const updateBrandCategoryController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (role !== constants_1.Role.ADMIN) {
            throw new httpError_1.default('Unauthorized: Only admins can update brand categories.', 403);
        }
        const { id } = req.params;
        const { name } = req.body; // Only 'name' is expected for update
        if (!id) {
            throw new httpError_1.default('Brand Category ID is required in URL parameters.', 400);
        }
        if (!name) { // Only name can be updated as per the model
            throw new httpError_1.default('Please provide the new brand category name.', 400);
        }
        const updatedBrandCategory = yield (0, brandCategoryService_1.updateBrandCategoryService)(id, { name });
        res.status(200).json({
            success: true,
            message: "Brand category updated successfully.",
            data: updatedBrandCategory
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateBrandCategoryController = updateBrandCategoryController;
const deleteBrandCategoryController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (role !== constants_1.Role.ADMIN) {
            throw new httpError_1.default('Unauthorized: Only admins can delete brand categories.', 403);
        }
        const { id } = req.params;
        if (!id) {
            throw new httpError_1.default('Brand Category ID is required in URL parameters.', 400);
        }
        const response = yield (0, brandCategoryService_1.deleteBrandCategoryService)(id);
        res.status(200).json(Object.assign({ success: true }, response // Contains the message from the service
        ));
    }
    catch (error) {
        next(error);
    }
});
exports.deleteBrandCategoryController = deleteBrandCategoryController;
