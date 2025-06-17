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
        // Removed 'name' from the unique check, as per the updated model and index
        const existingBrand = yield Brand_model_1.default.findOne({
            where: {
                brandCategoryId: params.brandCategoryId,
                companyId: params.companyId
            },
        });
        if (existingBrand) {
            // Updated error message to reflect the new unique constraint
            throw new httpError_1.default("A brand with this category and company already exists.", 400);
        }
        const newBrand = yield Brand_model_1.default.create({
            // Removed 'name: params.name'
            contents: params.contents || [],
            brandCategoryId: params.brandCategoryId,
            companyId: params.companyId,
            availability: params.availability,
            recommended_by_vets: params.recommended_by_vets,
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
        // Removed 'as Brand' cast
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
                    attributes: ['id', 'name', 'website', 'logoUrl']
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
        // Removed 'name' from whereClause
        /*
        if (params.name) {
            whereClause.name = params.name;
        }
        */
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
                    attributes: ['id', 'name', 'website', 'logoUrl'],
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
        // Removed 'as Brand' cast
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
        // Removed 'targetName' and its usage, as 'name' is no longer a field
        // const targetName = params.name !== undefined ? params.name : brand.name; // This line is now incorrect
        const targetBrandCategoryId = params.brandCategoryId !== undefined ? params.brandCategoryId : brand.brandCategoryId;
        const targetCompanyId = params.companyId !== undefined ? params.companyId : brand.companyId;
        // Adjusted the unique check condition
        // If brandCategoryId or companyId is changing, we need to check for existing combinations
        if (targetBrandCategoryId !== brand.brandCategoryId || targetCompanyId !== brand.companyId) {
            // Removed 'as Brand' cast
            const existingBrand = yield Brand_model_1.default.findOne({
                where: {
                    brandCategoryId: targetBrandCategoryId,
                    companyId: targetCompanyId
                },
            });
            // If an existing brand with the new (category, company) combo is found AND it's not the current brand
            if (existingBrand && existingBrand.id !== id) {
                throw new httpError_1.default("A brand with this category and company already exists.", 400);
            }
        }
        yield brand.update(params);
        // Removed 'as Brand' cast
        const updatedBrand = yield Brand_model_1.default.findByPk(id, {
            include: [
                { model: BrandCategory_model_1.default, as: 'brandCategory', attributes: ['id', 'name'] },
                { model: Company_model_1.default, as: 'company', attributes: ['id', 'name', 'website', 'logoUrl'] }
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
