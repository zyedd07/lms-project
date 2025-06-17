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
const brandService_1 = require("../services/brandService"); // Ensure correct import path
const createBrandController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (role !== constants_1.Role.ADMIN) {
            throw new httpError_1.default('Unauthorized: Only admins can create brands.', 403);
        }
        const { name, contents, brandCategoryId, companyId, availability, recommended_by_vets } = req.body;
        if (!name || !brandCategoryId || !companyId || !availability) {
            throw new httpError_1.default('Please provide brand name, category ID, company ID, and availability.', 400);
        }
        const newBrand = yield (0, brandService_1.createBrandService)({
            name,
            contents,
            brandCategoryId,
            companyId,
            availability,
            recommended_by_vets
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
        // Destructure and type-cast query parameters
        const { id, name, brandCategoryId, companyId, recommended_by_vets, availability, limit, offset } = req.query;
        const params = {
            id: id,
            name: name,
            brandCategoryId: brandCategoryId,
            companyId: companyId,
            // Convert recommended_by_vets to boolean if present
            recommended_by_vets: typeof recommended_by_vets === 'string' ? recommended_by_vets === 'true' : undefined,
            availability: availability, // This is now a string
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
        const { name, contents, brandCategoryId, companyId, availability, recommended_by_vets } = req.body;
        if (!id) {
            throw new httpError_1.default('Brand ID is required in URL parameters.', 400);
        }
        // At least one field must be provided for update
        if (!name && !contents && !brandCategoryId && !companyId && !availability && recommended_by_vets === undefined) {
            throw new httpError_1.default('Please provide at least one field to update.', 400);
        }
        const updatedBrand = yield (0, brandService_1.updateBrandService)(id, {
            name,
            contents,
            brandCategoryId,
            companyId,
            availability,
            recommended_by_vets
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
        res.status(200).json(Object.assign({ success: true }, response // Contains the message from the service
        ));
    }
    catch (error) {
        next(error);
    }
});
exports.deleteBrandController = deleteBrandController;
