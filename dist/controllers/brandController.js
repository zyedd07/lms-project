"use strict";
// src/controllers/brandController.ts
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
exports.deleteBrandController = exports.updateBrandController = exports.getAllBrandsController = exports.getBrandByIdController = exports.createBrandController = void 0;
const httpError_1 = __importDefault(require("../utils/httpError"));
const constants_1 = require("../utils/constants");
const brandService_1 = require("../services/brandService");
const createBrandController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (role !== constants_1.Role.ADMIN) {
            throw new httpError_1.default('Unauthorized: Only admins can create brands.', 403);
        }
        // RE-ADDED: name to destructuring, ADDED: details
        const { name, contents, brandCategoryId, companyId, availability, recommended_by_vets, details } = req.body;
        // RE-ADDED: name to validation check
        if (!name || !brandCategoryId || !companyId || !availability) {
            throw new httpError_1.default('Please provide brand name, category ID, company ID, and availability.', 400);
        }
        const newBrand = yield (0, brandService_1.createBrandService)({
            name, // RE-ADDED: name to service call
            contents,
            brandCategoryId,
            companyId,
            availability,
            recommended_by_vets,
            details // ADDED: details to service call
        });
        res.status(201).json({
            success: true,
            message: "Brand created successfully.",
            data: newBrand
        });
    }
    catch (error) {
        next(error);
    }
});
exports.createBrandController = createBrandController;
const getBrandByIdController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id) {
            throw new httpError_1.default('Brand ID is required in URL parameters.', 400);
        }
        const brand = yield (0, brandService_1.getBrandByIdService)(id);
        res.status(200).json({
            success: true,
            data: brand
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getBrandByIdController = getBrandByIdController;
const getAllBrandsController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // RE-ADDED: name to destructuring query parameters, ADDED: details
        const { id, name, brandCategoryId, companyId, recommended_by_vets, availability, details, limit, offset } = req.query;
        const params = {
            id: id,
            name: name, // RE-ADDED: name to params object
            brandCategoryId: brandCategoryId,
            companyId: companyId,
            recommended_by_vets: typeof recommended_by_vets === 'string' ? recommended_by_vets === 'true' : undefined,
            availability: availability,
            details: details, // ADDED: details to params object
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined,
        };
        const brands = yield (0, brandService_1.getAllBrandsService)(params);
        res.status(200).json({
            success: true,
            data: brands
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getAllBrandsController = getAllBrandsController;
const updateBrandController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (role !== constants_1.Role.ADMIN) {
            throw new httpError_1.default('Unauthorized: Only admins can update brands.', 403);
        }
        const { id } = req.params;
        // RE-ADDED: name to destructuring body, ADDED: details
        const { name, contents, brandCategoryId, companyId, availability, recommended_by_vets, details } = req.body;
        if (!id) {
            throw new httpError_1.default('Brand ID is required in URL parameters.', 400);
        }
        // RE-ADDED: name to the update fields check, ADDED: details
        if (!name && !contents && !brandCategoryId && !companyId && !availability && recommended_by_vets === undefined && !details) {
            throw new httpError_1.default('Please provide at least one field to update.', 400);
        }
        const updatedBrand = yield (0, brandService_1.updateBrandService)(id, {
            name, // RE-ADDED: name to service call
            contents,
            brandCategoryId,
            companyId,
            availability,
            recommended_by_vets,
            details // ADDED: details to service call
        });
        res.status(200).json({
            success: true,
            message: "Brand updated successfully.",
            data: updatedBrand
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateBrandController = updateBrandController;
const deleteBrandController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (role !== constants_1.Role.ADMIN) {
            throw new httpError_1.default('Unauthorized: Only admins can delete brands.', 403);
        }
        const { id } = req.params;
        if (!id) {
            throw new httpError_1.default('Brand ID is required in URL parameters.', 400);
        }
        const response = yield (0, brandService_1.deleteBrandService)(id);
        res.status(200).json(Object.assign({ success: true }, response));
    }
    catch (error) {
        throw error;
    }
});
exports.deleteBrandController = deleteBrandController;
