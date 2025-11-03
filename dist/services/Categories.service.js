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
exports.deleteCategoryService = exports.updateCategoryService = exports.getCategoriesService = exports.createCategoryService = void 0;
const Categories_model_1 = __importDefault(require("../models/Categories.model"));
const Course_model_1 = __importDefault(require("../models/Course.model")); // Make sure this path is correct for your Courses model
const httpError_1 = __importDefault(require("../utils/httpError"));
const createCategoryService = (_a) => __awaiter(void 0, [_a], void 0, function* ({ name, description, imageUrl }) {
    try {
        const existingCategory = yield Categories_model_1.default.findOne({
            where: { name }
        });
        if (existingCategory) {
            throw new httpError_1.default('Category already exists', 400);
        }
        const newCategory = yield Categories_model_1.default.create({
            name,
            description,
            imageUrl
        });
        return newCategory;
    }
    catch (error) {
        // Log the error for backend debugging
        console.error("Error in createCategoryService:", error);
        // Re-throw HttpError or encapsulate other errors
        if (error instanceof httpError_1.default) {
            throw error;
        }
        throw new httpError_1.default('Failed to create category due to an unexpected error.', 500);
    }
});
exports.createCategoryService = createCategoryService;
const getCategoriesService = (searchCriteria) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let whereClause = {};
        if (searchCriteria.name) {
            whereClause.name = searchCriteria.name;
        }
        if (searchCriteria.id) {
            whereClause.id = searchCriteria.id;
        }
        const categories = yield Categories_model_1.default.findAll({
            where: whereClause
        });
        return categories;
    }
    catch (error) {
        console.error("Error in getCategoriesService:", error);
        if (error instanceof httpError_1.default) {
            throw error;
        }
        throw new httpError_1.default('Failed to fetch categories due to an unexpected error.', 500);
    }
});
exports.getCategoriesService = getCategoriesService;
const updateCategoryService = (id, updatedCategory) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const category = yield Categories_model_1.default.findOne({
            where: { id }
        });
        if (!category) {
            throw new httpError_1.default('Category not found', 404);
        }
        yield Categories_model_1.default.update(updatedCategory, {
            where: { id }
        });
        return { message: 'Category updated successfully' };
    }
    catch (error) {
        console.error("Error in updateCategoryService:", error);
        if (error instanceof httpError_1.default) {
            throw error;
        }
        throw new httpError_1.default('Failed to update category due to an unexpected error.', 500);
    }
});
exports.updateCategoryService = updateCategoryService;
const deleteCategoryService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const category = yield Categories_model_1.default.findOne({
            where: { id }
        });
        if (!category) {
            throw new httpError_1.default('Category not found', 404);
        }
        const associatedCoursesCount = yield Course_model_1.default.count({
            where: { categoryId: id } // Assuming 'categoryId' is the foreign key in your Courses model
        });
        if (associatedCoursesCount > 0) {
            throw new httpError_1.default('Cannot delete category: It is linked to existing courses. Please reassign or delete associated courses first.', 409 // 409 Conflict status code
            );
        }
        // --- END NEW LOGIC ---
        yield Categories_model_1.default.destroy({
            where: { id }
        });
        return { message: 'Category deleted successfully' };
    }
    catch (error) {
        // Log the full error for debugging on the server
        console.error("Error in deleteCategoryService:", error);
        // Re-throw HttpErrors that we explicitly defined (e.g., 404 or 409)
        if (error instanceof httpError_1.default) {
            throw error;
        }
        // For any other unexpected errors (e.g., actual database connection issues, typos),
        // throw a generic 500 error.
        throw new httpError_1.default('Failed to delete category due to an unexpected server error.', 500);
    }
});
exports.deleteCategoryService = deleteCategoryService;
