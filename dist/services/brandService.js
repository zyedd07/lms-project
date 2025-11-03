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
exports.deleteBrandService = exports.updateBrandService = exports.getAllBrandsService = exports.getBrandByIdService = exports.createBrandService = void 0;
// src/services/brandService.ts
const Brand_model_1 = __importDefault(require("../models/Brand.model"));
const BrandCategory_model_1 = __importDefault(require("../models/BrandCategory.model"));
const Company_model_1 = __importDefault(require("../models/Company.model"));
const httpError_1 = __importDefault(require("../utils/httpError"));
const createBrandService = (params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const brandCategoryExists = yield BrandCategory_model_1.default.findByPk(params.brandCategoryId);
        if (!brandCategoryExists) {
            throw new httpError_1.default(`Brand Category with ID ${params.brandCategoryId} not found.`, 404);
        }
        const companyExists = yield Company_model_1.default.findByPk(params.companyId);
        if (!companyExists) {
            throw new httpError_1.default(`Company with ID ${params.companyId} not found.`, 404);
        }
        // RE-ADDED: name to the unique check
        const existingBrand = yield Brand_model_1.default.findOne({
            where: {
                name: params.name, // Re-add name to unique check
                brandCategoryId: params.brandCategoryId,
                companyId: params.companyId
            },
        });
        if (existingBrand) {
            // Updated error message to reflect the re-added unique constraint
            throw new httpError_1.default("A brand with this name, category, and company already exists.", 400);
        }
        const newBrand = yield Brand_model_1.default.create({
            name: params.name, // RE-ADDED: name to create payload
            contents: params.contents || [],
            brandCategoryId: params.brandCategoryId,
            companyId: params.companyId,
            availability: params.availability,
            recommended_by_vets: params.recommended_by_vets,
            details: params.details || {}, // ADDED: New details field to the create payload
        });
        return newBrand;
    }
    catch (error) {
        throw error;
    }
});
exports.createBrandService = createBrandService;
const getBrandByIdService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const brand = yield Brand_model_1.default.findByPk(id, {
            include: [
                {
                    model: BrandCategory_model_1.default,
                    as: 'brandCategory',
                    attributes: ['id', 'name']
                },
                {
                    model: Company_model_1.default,
                    as: 'company',
                    // Only 'id' and 'name' are expected in Company model
                    attributes: ['id', 'name']
                }
            ]
        });
        if (!brand) {
            throw new httpError_1.default("Brand not found", 404);
        }
        return brand;
    }
    catch (error) {
        console.error("Error in getBrandByIdService:", error);
        throw error;
    }
});
exports.getBrandByIdService = getBrandByIdService;
const getAllBrandsService = (params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const whereClause = {};
        if (params.id) {
            whereClause.id = params.id;
        }
        if (params.name) { // RE-ADDED: name to where clause
            whereClause.name = params.name;
        }
        if (params.brandCategoryId) {
            whereClause.brandCategoryId = params.brandCategoryId;
        }
        if (params.companyId) {
            whereClause.companyId = params.companyId;
        }
        if (typeof params.recommended_by_vets === 'boolean') {
            whereClause.recommended_by_vets = params.recommended_by_vets;
        }
        if (params.availability) {
            whereClause.availability = params.availability;
        }
        if (params.details) { // ADDED: Ability to filter by details
            whereClause.details = params.details;
        }
        const brands = yield Brand_model_1.default.findAll({
            where: whereClause,
            include: [
                {
                    model: BrandCategory_model_1.default,
                    as: 'brandCategory',
                    attributes: ['id', 'name'],
                    required: false
                },
                {
                    model: Company_model_1.default,
                    as: 'company',
                    attributes: ['id', 'name'],
                    required: false
                }
            ],
            limit: params.limit,
            offset: params.offset,
        });
        return brands;
    }
    catch (error) {
        throw error;
    }
});
exports.getAllBrandsService = getAllBrandsService;
const updateBrandService = (id, params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const brand = yield Brand_model_1.default.findByPk(id);
        if (!brand) {
            throw new httpError_1.default('Brand not found', 404);
        }
        if (params.brandCategoryId) {
            const brandCategoryExists = yield BrandCategory_model_1.default.findByPk(params.brandCategoryId);
            if (!brandCategoryExists) {
                throw new httpError_1.default(`Brand Category with ID ${params.brandCategoryId} not found.`, 404);
            }
        }
        if (params.companyId) {
            const companyExists = yield Company_model_1.default.findByPk(params.companyId);
            if (!companyExists) {
                throw new httpError_1.default(`Company with ID ${params.companyId} not found.`, 404);
            }
        }
        // RE-ADDED: targetName for unique check logic
        const targetName = params.name !== undefined ? params.name : brand.name;
        const targetBrandCategoryId = params.brandCategoryId !== undefined ? params.brandCategoryId : brand.brandCategoryId;
        const targetCompanyId = params.companyId !== undefined ? params.companyId : brand.companyId;
        // RE-ADDED: name to the unique check condition
        if (targetName !== brand.name || targetBrandCategoryId !== brand.brandCategoryId || targetCompanyId !== brand.companyId) {
            const existingBrand = yield Brand_model_1.default.findOne({
                where: {
                    name: targetName, // Re-add name to unique check
                    brandCategoryId: targetBrandCategoryId,
                    companyId: targetCompanyId
                },
            });
            if (existingBrand && existingBrand.id !== id) {
                throw new httpError_1.default("A brand with this name, category, and company already exists.", 400);
            }
        }
        // The params object can now contain the details field, and the update function will handle it.
        yield brand.update(params);
        const updatedBrand = yield Brand_model_1.default.findByPk(id, {
            include: [
                { model: BrandCategory_model_1.default, as: 'brandCategory', attributes: ['id', 'name'] },
                { model: Company_model_1.default, as: 'company', attributes: ['id', 'name'] }
            ]
        });
        return updatedBrand;
    }
    catch (error) {
        throw error;
    }
});
exports.updateBrandService = updateBrandService;
const deleteBrandService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deletedRows = yield Brand_model_1.default.destroy({
            where: { id: id }
        });
        if (deletedRows === 0) {
            throw new httpError_1.default('Brand not found', 404);
        }
        return { message: 'Brand deleted successfully' };
    }
    catch (error) {
        throw error;
    }
});
exports.deleteBrandService = deleteBrandService;
