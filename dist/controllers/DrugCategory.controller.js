"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.deleteDrugCategory = exports.updateDrugCategory = exports.getAllDrugCategories = exports.createDrugCategory = void 0;
const drugCategoryService = __importStar(require("../services/DrugCategory.service"));
const httpError_1 = __importDefault(require("../utils/httpError"));
/**
 * @description Controller to create a new drug category.
 */
const createDrugCategory = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const params = req.body;
        if (!params.name || typeof params.name !== 'string' || params.name.trim() === '') {
            throw new httpError_1.default("Category name is required and must be a non-empty string.", 400);
        }
        const newCategory = yield drugCategoryService.createDrugCategoryService(params);
        res.status(201).json({
            success: true,
            message: "Drug category created successfully.",
            data: newCategory
        });
    }
    catch (error) {
        next(error);
    }
});
exports.createDrugCategory = createDrugCategory;
/**
 * @description Controller to get all drug categories.
 */
const getAllDrugCategories = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield drugCategoryService.getAllDrugCategoriesService();
        res.status(200).json({
            success: true,
            message: "Drug categories fetched successfully.",
            data: categories
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getAllDrugCategories = getAllDrugCategories;
/**
 * @description Controller to update an existing drug category.
 */
const updateDrugCategory = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { categoryId } = req.params;
        const params = req.body;
        if (!categoryId) {
            throw new httpError_1.default("Category ID is required in the URL.", 400);
        }
        if (!params.name || typeof params.name !== 'string' || params.name.trim() === '') {
            throw new httpError_1.default("A non-empty category name is required for update.", 400);
        }
        const updatedCategory = yield drugCategoryService.updateDrugCategoryService(categoryId, params);
        res.status(200).json({
            success: true,
            message: "Drug category updated successfully.",
            data: updatedCategory
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateDrugCategory = updateDrugCategory;
/**
 * @description Controller to delete a drug category.
 */
const deleteDrugCategory = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { categoryId } = req.params;
        if (!categoryId) {
            throw new httpError_1.default("Category ID is required in the URL.", 400);
        }
        const result = yield drugCategoryService.deleteDrugCategoryService(categoryId);
        res.status(200).json({
            success: true,
            message: result.message
        });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteDrugCategory = deleteDrugCategory;
