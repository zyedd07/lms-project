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

        // Removed 'name' from the unique check, as per the updated model and index
        const existingBrand = await Brand.findOne({
            where: {
                brandCategoryId: params.brandCategoryId,
                companyId: params.companyId
            },
        });
        if (existingBrand) {
            // Updated error message to reflect the new unique constraint
            throw new HttpError("A brand with this category and company already exists.", 400);
        }

        const newBrand = await Brand.create({
            // Removed 'name: params.name'
            contents: params.contents || [],
            brandCategoryId: params.brandCategoryId,
            companyId: params.companyId,
            availability: params.availability,
            recommended_by_vets: params.recommended_by_vets,
        });
        return newBrand;
    } catch (error) {
        throw error;
    }
};

export const getBrandByIdService = async (id: string) => {
    try {
        // Removed 'as Brand' cast
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
                    attributes: ['id', 'name', 'website', 'logoUrl']
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
                    attributes: ['id', 'name', 'website', 'logoUrl'],
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
        // Removed 'as Brand' cast
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

        // Removed 'targetName' and its usage, as 'name' is no longer a field
        // const targetName = params.name !== undefined ? params.name : brand.name; // This line is now incorrect
        const targetBrandCategoryId = params.brandCategoryId !== undefined ? params.brandCategoryId : brand.brandCategoryId;
        const targetCompanyId = params.companyId !== undefined ? params.companyId : brand.companyId;

        // Adjusted the unique check condition
        // If brandCategoryId or companyId is changing, we need to check for existing combinations
        if (targetBrandCategoryId !== brand.brandCategoryId || targetCompanyId !== brand.companyId) {
            // Removed 'as Brand' cast
            const existingBrand = await Brand.findOne({
                where: {
                    brandCategoryId: targetBrandCategoryId,
                    companyId: targetCompanyId
                },
            });
            // If an existing brand with the new (category, company) combo is found AND it's not the current brand
            if (existingBrand && existingBrand.id !== id) {
                throw new HttpError("A brand with this category and company already exists.", 400);
            }
        }

        await brand.update(params);
        // Removed 'as Brand' cast
        const updatedBrand = await Brand.findByPk(id, {
            include: [
                { model: BrandCategory, as: 'brandCategory', attributes: ['id', 'name'] },
                { model: Company, as: 'company', attributes: ['id', 'name', 'website', 'logoUrl'] }
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