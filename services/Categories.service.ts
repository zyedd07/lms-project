import Categories from "../models/Categories.model";
import HttpError from "../utils/httpError";
import { CreateCategoriesServiceParams, GetCategorySearchCriteria } from "../utils/types";

export const createCategoryService = async ({ name, description, imageUrl }: CreateCategoriesServiceParams) => {
    try {
        const existingCategory = await Categories.findOne({
            where: { name }
        });
        if (existingCategory) {
            throw new HttpError('Category already exists', 400);
        }
        const newCategory = await Categories.create({
            name,
            description,
            imageUrl
        });
        return newCategory;
    } catch (error) {
        throw error;
    }
}

export const getCategoriesService = async (searchCriteria: GetCategorySearchCriteria) => {
    try {
        let whereClause: GetCategorySearchCriteria = {};
        if (searchCriteria.name) {
            whereClause.name = searchCriteria.name;
        }
        if (searchCriteria.id) {
            whereClause.id = searchCriteria.id;
        }
        const categories = await Categories.findAll({
            where: whereClause
        });

        return categories;
    } catch (error) {
        throw error;
    }
}

export const updateCategoryService = async (id: string, updatedCategory: Partial<CreateCategoriesServiceParams>) => {
    try {
        const category = await Categories.findOne({
            where: { id }
        });
        if (!category) {
            throw new HttpError('Category not found', 404);
        }
        await Categories.update(updatedCategory, {
            where: { id }
        });
        return { message: 'Category updated successfully' };
    } catch (error) {
        throw error;
    }
}

export const deleteCategoryService = async (id: string) => {
    try {
        const category = await Categories.findOne({
            where: { id }
        })
        if (!category) {
            throw new HttpError('Category not found', 404);
        }
        await Categories.destroy({
            where: { id }
        });
        return { message: 'Category deleted successfully' };
    } catch (error) {
        throw error;
    }
}