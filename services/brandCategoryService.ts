// src/services/brandCategoryService.ts
import BrandCategory from "../models/BrandCategory.model";
import HttpError from "../utils/httpError";
import { CreateBrandCategoryServiceParams, UpdateBrandCategoryServiceParams } from "../utils/types";

export const createBrandCategoryService = async (params: CreateBrandCategoryServiceParams) => {
    try {
        const existingCategory = await BrandCategory.findOne({
            where: { name: params.name },
        });
        if (existingCategory) {
            throw new HttpError("Brand Category with this name already exists", 400);
        }

        const newBrandCategory = await BrandCategory.create({
            name: params.name,
        });
        return newBrandCategory;
    } catch (error) {
        throw error;
    }
};

export const getBrandCategoryByIdService = async (id: string) => {
    try {
        // Explicitly cast the result to BrandCategory (the model instance type)
        const brandCategory = await BrandCategory.findByPk(id) as BrandCategory;
        if (!brandCategory) {
            throw new HttpError("Brand Category not found", 404);
        }
        return brandCategory;
    } catch (error) {
        throw error;
    }
};

export const getAllBrandCategoriesService = async () => {
    try {
        const brandCategories = await BrandCategory.findAll();
        return brandCategories;
    } catch (error) {
        throw error;
    }
};

export const updateBrandCategoryService = async (id: string, params: UpdateBrandCategoryServiceParams) => {
    try {
        // Explicitly cast the result to BrandCategory
        const brandCategory = await BrandCategory.findByPk(id) as BrandCategory;
        if (!brandCategory) {
            throw new HttpError('Brand Category not found', 404);
        }

        // Fix: brandCategory is now typed as BrandCategory, so 'name' is accessible
        if (params.name && params.name !== brandCategory.name) {
            const existingCategoryWithName = await BrandCategory.findOne({
                where: { name: params.name },
            });
            if (existingCategoryWithName) {
                throw new HttpError("Brand Category with this name already exists", 400);
            }
        }

        await brandCategory.update({ name: params.name });
        // Explicitly cast the result to BrandCategory
        const updatedBrandCategory = await BrandCategory.findByPk(id) as BrandCategory;
        return updatedBrandCategory;
    } catch (error) {
        throw error;
    }
};

export const deleteBrandCategoryService = async (id: string) => {
    try {
        const deletedRows = await BrandCategory.destroy({
            where: { id: id }
        });
        if (deletedRows === 0) {
            throw new HttpError('Brand Category not found', 404);
        }
        return { message: 'Brand Category deleted successfully' };
    } catch (error) {
        throw error;
    }
};