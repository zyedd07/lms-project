// src/services/brandService.ts
import Brand from "../models/Brand.model";
import BrandCategory from "../models/BrandCategory.model";
import Company from "../models/Company.model";
import HttpError from "../utils/httpError";
import {
    CreateBrandServiceParams,
    GetAllBrandServiceParams,
    UpdateBrandServiceParams
} from "../utils/types";

export const createBrandService = async (params: CreateBrandServiceParams) => {
    try {
        const brandCategoryExists = await BrandCategory.findByPk(params.brandCategoryId);
        if (!brandCategoryExists) {
            throw new HttpError(`Brand Category with ID ${params.brandCategoryId} not found.`, 404);
        }
        const companyExists = await Company.findByPk(params.companyId);
        if (!companyExists) {
            throw new HttpError(`Company with ID ${params.companyId} not found.`, 404);
        }

        // RE-ADDED: name to the unique check
        const existingBrand = await Brand.findOne({
            where: {
                name: params.name, // Re-add name to unique check
                brandCategoryId: params.brandCategoryId,
                companyId: params.companyId
            },
        });
        if (existingBrand) {
            // Updated error message to reflect the re-added unique constraint
            throw new HttpError("A brand with this name, category, and company already exists.", 400);
        }

        const newBrand = await Brand.create({
            name: params.name, // RE-ADDED: name to create payload
            contents: params.contents || [],
            brandCategoryId: params.brandCategoryId,
            companyId: params.companyId,
            availability: params.availability,
            recommended_by_vets: params.recommended_by_vets,
            details: params.details || {}, // ADDED: New details field to the create payload
        });
        return newBrand;
    } catch (error) {
        throw error;
    }
};

export const getBrandByIdService = async (id: string) => {
    try {
        const brand = await Brand.findByPk(id, {
            include: [
                {
                    model: BrandCategory,
                    as: 'brandCategory',
                    attributes: ['id', 'name']
                },
                {
                    model: Company,
                    as: 'company',
                    // Only 'id' and 'name' are expected in Company model
                    attributes: ['id', 'name']
                }
            ]
        });

        if (!brand) {
            throw new HttpError("Brand not found", 404);
        }
        return brand;
    } catch (error) {
        console.error("Error in getBrandByIdService:", error);
        throw error;
    }
};

export const getAllBrandsService = async (params: GetAllBrandServiceParams) => {
    try {
        const whereClause: any = {};
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

        const brands = await Brand.findAll({
            where: whereClause,
            include: [
                {
                    model: BrandCategory,
                    as: 'brandCategory',
                    attributes: ['id', 'name'],
                    required: false
                },
                {
                    model: Company,
                    as: 'company',
                    attributes: ['id', 'name'],
                    required: false
                }
            ],
            limit: params.limit,
            offset: params.offset,
        });

        return brands;
    } catch (error) {
        throw error;
    }
};

export const updateBrandService = async (id: string, params: UpdateBrandServiceParams) => {
    try {
        const brand = await Brand.findByPk(id);
        if (!brand) {
            throw new HttpError('Brand not found', 404);
        }

        if (params.brandCategoryId) {
            const brandCategoryExists = await BrandCategory.findByPk(params.brandCategoryId);
            if (!brandCategoryExists) {
                throw new HttpError(`Brand Category with ID ${params.brandCategoryId} not found.`, 404);
            }
        }
        if (params.companyId) {
            const companyExists = await Company.findByPk(params.companyId);
            if (!companyExists) {
                throw new HttpError(`Company with ID ${params.companyId} not found.`, 404);
            }
        }

        // RE-ADDED: targetName for unique check logic
        const targetName = params.name !== undefined ? params.name : brand.name;
        const targetBrandCategoryId = params.brandCategoryId !== undefined ? params.brandCategoryId : brand.brandCategoryId;
        const targetCompanyId = params.companyId !== undefined ? params.companyId : brand.companyId;

        // RE-ADDED: name to the unique check condition
        if (targetName !== brand.name || targetBrandCategoryId !== brand.brandCategoryId || targetCompanyId !== brand.companyId) {
            const existingBrand = await Brand.findOne({
                where: {
                    name: targetName, // Re-add name to unique check
                    brandCategoryId: targetBrandCategoryId,
                    companyId: targetCompanyId
                },
            });
            if (existingBrand && existingBrand.id !== id) {
                throw new HttpError("A brand with this name, category, and company already exists.", 400);
            }
        }

        // The params object can now contain the details field, and the update function will handle it.
        await brand.update(params);
        const updatedBrand = await Brand.findByPk(id, {
            include: [
                { model: BrandCategory, as: 'brandCategory', attributes: ['id', 'name'] },
                { model: Company, as: 'company', attributes: ['id', 'name'] }
            ]
        });
        return updatedBrand;
    } catch (error) {
        throw error;
    }
};

export const deleteBrandService = async (id: string) => {
    try {
        const deletedRows = await Brand.destroy({
            where: { id: id }
        });
        if (deletedRows === 0) {
            throw new HttpError('Brand not found', 404);
        }
        return { message: 'Brand deleted successfully' };
    } catch (error) {
        throw error;
    }
};