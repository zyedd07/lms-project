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
exports.deleteDrugCategoryService = exports.updateDrugCategoryService = exports.getAllDrugCategoriesService = exports.createDrugCategoryService = void 0;
const DrugCategory_model_1 = __importDefault(require("../models/DrugCategory.model"));
const Drug_model_1 = __importDefault(require("../models/Drug.model")); // Imported to check for associated drugs before deletion
const httpError_1 = __importDefault(require("../utils/httpError"));
/**
 * @description Create a new drug category.
 * @param {CreateDrugCategoryParams} params - The data for the new category.
 * @returns {Promise<DrugCategory>} The created category instance.
 */
const createDrugCategoryService = (params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if a category with the same name already exists to prevent duplicates
        const existingCategory = yield DrugCategory_model_1.default.findOne({ where: { name: params.name } });
        if (existingCategory) {
            throw new httpError_1.default("A category with this name already exists.", 409); // 409 Conflict
        }
        const newCategory = yield DrugCategory_model_1.default.create(params);
        return newCategory;
    }
    catch (error) {
        if (error instanceof httpError_1.default)
            throw error;
        console.error("Error creating drug category:", error);
        throw new httpError_1.default("Failed to create drug category.", 500);
    }
});
exports.createDrugCategoryService = createDrugCategoryService;
/**
 * @description Get a list of all drug categories.
 * @returns {Promise<DrugCategory[]>} An array of all drug categories.
 */
const getAllDrugCategoriesService = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield DrugCategory_model_1.default.findAll({
            order: [['name', 'ASC']], // Order categories alphabetically
        });
        return categories;
    }
    catch (error) {
        console.error("Error fetching drug categories:", error);
        throw new httpError_1.default("Failed to fetch drug categories.", 500);
    }
});
exports.getAllDrugCategoriesService = getAllDrugCategoriesService;
/**
 * @description Update an existing drug category.
 * @param {string} categoryId - The ID of the category to update.
 * @param {UpdateDrugCategoryParams} params - The fields to update.
 * @returns {Promise<DrugCategory>} The updated category instance.
 */
const updateDrugCategoryService = (categoryId, params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const category = yield DrugCategory_model_1.default.findByPk(categoryId);
        if (!category) {
            throw new httpError_1.default("Drug category not found.", 404);
        }
        // Check for name conflict if the name is being changed
        if (params.name) {
            const existingCategory = yield DrugCategory_model_1.default.findOne({ where: { name: params.name } });
            if (existingCategory && existingCategory.id !== categoryId) {
                throw new httpError_1.default("Another category with this name already exists.", 409);
            }
        }
        const updatedCategory = yield category.update(params);
        return updatedCategory;
    }
    catch (error) {
        if (error instanceof httpError_1.default)
            throw error;
        console.error("Error updating drug category:", error);
        throw new httpError_1.default("Failed to update drug category.", 500);
    }
});
exports.updateDrugCategoryService = updateDrugCategoryService;
/**
 * @description Delete a drug category.
 * @param {string} categoryId - The ID of the category to delete.
 * @returns {Promise<{ message: string }>} A success message.
 */
const deleteDrugCategoryService = (categoryId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const category = yield DrugCategory_model_1.default.findByPk(categoryId);
        if (!category) {
            throw new httpError_1.default("Drug category not found.", 404);
        }
        // Prevent deletion if drugs are associated with this category
        const associatedDrugs = yield Drug_model_1.default.count({ where: { categoryId: categoryId } });
        if (associatedDrugs > 0) {
            throw new httpError_1.default(`Cannot delete category. It is associated with ${associatedDrugs} drug(s).`, 400);
        }
        yield category.destroy();
        return { message: "Drug category deleted successfully." };
    }
    catch (error) {
        if (error instanceof httpError_1.default)
            throw error;
        console.error("Error deleting drug category:", error);
        throw new httpError_1.default("Failed to delete drug category.", 500);
    }
});
exports.deleteDrugCategoryService = deleteDrugCategoryService;
