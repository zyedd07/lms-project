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
exports.deleteBrandCategoryService = exports.updateBrandCategoryService = exports.getAllBrandCategoriesService = exports.getBrandCategoryByIdService = exports.createBrandCategoryService = void 0;
// src/services/brandCategoryService.ts
const BrandCategory_model_1 = __importDefault(require("../models/BrandCategory.model"));
const httpError_1 = __importDefault(require("../utils/httpError"));
const createBrandCategoryService = (params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const existingCategory = yield BrandCategory_model_1.default.findOne({
            where: { name: params.name },
        });
        if (existingCategory) {
            throw new httpError_1.default("Brand Category with this name already exists", 400);
        }
        const newBrandCategory = yield BrandCategory_model_1.default.create({
            name: params.name,
        });
        return newBrandCategory;
    }
    catch (error) {
        throw error;
    }
});
exports.createBrandCategoryService = createBrandCategoryService;
const getBrandCategoryByIdService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Explicitly cast the result to BrandCategory (the model instance type)
        const brandCategory = yield BrandCategory_model_1.default.findByPk(id);
        if (!brandCategory) {
            throw new httpError_1.default("Brand Category not found", 404);
        }
        return brandCategory;
    }
    catch (error) {
        throw error;
    }
});
exports.getBrandCategoryByIdService = getBrandCategoryByIdService;
const getAllBrandCategoriesService = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const brandCategories = yield BrandCategory_model_1.default.findAll();
        return brandCategories;
    }
    catch (error) {
        throw error;
    }
});
exports.getAllBrandCategoriesService = getAllBrandCategoriesService;
const updateBrandCategoryService = (id, params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Explicitly cast the result to BrandCategory
        const brandCategory = yield BrandCategory_model_1.default.findByPk(id);
        if (!brandCategory) {
            throw new httpError_1.default('Brand Category not found', 404);
        }
        // Fix: brandCategory is now typed as BrandCategory, so 'name' is accessible
        if (params.name && params.name !== brandCategory.name) {
            const existingCategoryWithName = yield BrandCategory_model_1.default.findOne({
                where: { name: params.name },
            });
            if (existingCategoryWithName) {
                throw new httpError_1.default("Brand Category with this name already exists", 400);
            }
        }
        yield brandCategory.update({ name: params.name });
        // Explicitly cast the result to BrandCategory
        const updatedBrandCategory = yield BrandCategory_model_1.default.findByPk(id);
        return updatedBrandCategory;
    }
    catch (error) {
        throw error;
    }
});
exports.updateBrandCategoryService = updateBrandCategoryService;
const deleteBrandCategoryService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deletedRows = yield BrandCategory_model_1.default.destroy({
            where: { id: id }
        });
        if (deletedRows === 0) {
            throw new httpError_1.default('Brand Category not found', 404);
        }
        return { message: 'Brand Category deleted successfully' };
    }
    catch (error) {
        throw error;
    }
});
exports.deleteBrandCategoryService = deleteBrandCategoryService;
