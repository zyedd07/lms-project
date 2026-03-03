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
exports.deleteCategoryController = exports.updateCategoryController = exports.getCategoriesController = exports.createCategoryController = void 0;
const httpError_1 = __importDefault(require("../utils/httpError"));
const Categories_service_1 = require("../services/Categories.service");
const constants_1 = require("../utils/constants");
const createCategoryController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (role !== constants_1.Role.ADMIN) {
            throw new httpError_1.default('Unauthorized', 403);
        }
        const { name, description, imageUrl } = req.body;
        if (!name) {
            throw new httpError_1.default('Name is required', 400);
        }
        const newCategory = yield (0, Categories_service_1.createCategoryService)({ name, description, imageUrl });
        res.status(201).json({
            success: true,
            data: newCategory
        });
    }
    catch (error) {
        next(error);
    }
});
exports.createCategoryController = createCategoryController;
const getCategoriesController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, id } = req.query;
        const categories = yield (0, Categories_service_1.getCategoriesService)({ name: name, id: id });
        res.status(200).json({
            success: true,
            data: categories
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getCategoriesController = getCategoriesController;
const updateCategoryController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (role !== constants_1.Role.ADMIN) {
            throw new httpError_1.default('Unauthorized', 403);
        }
        const { name, description, imageUrl } = req.body;
        const { id } = req.params;
        if (!id) {
            throw new httpError_1.default('Category ID is required', 400);
        }
        const updatedCategory = yield (0, Categories_service_1.updateCategoryService)(id, { name, description, imageUrl });
        res.status(200).json(Object.assign({ success: true }, updatedCategory));
    }
    catch (error) {
        next(error);
    }
});
exports.updateCategoryController = updateCategoryController;
const deleteCategoryController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id) {
            throw new httpError_1.default('Category ID is required', 400);
        }
        const response = yield (0, Categories_service_1.deleteCategoryService)(id);
        res.status(200).json(Object.assign({ success: true }, response));
    }
    catch (error) {
        next(error);
    }
});
exports.deleteCategoryController = deleteCategoryController;
