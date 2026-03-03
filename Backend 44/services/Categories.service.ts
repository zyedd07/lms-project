import Categories from "../models/Categories.model";
import Courses from "../models/Course.model"; // Make sure this path is correct for your Courses model
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
        // Log the error for backend debugging
        console.error("Error in createCategoryService:", error);
        // Re-throw HttpError or encapsulate other errors
        if (error instanceof HttpError) {
            throw error;
        }
        throw new HttpError('Failed to create category due to an unexpected error.', 500);
    }
};

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
        console.error("Error in getCategoriesService:", error);
        if (error instanceof HttpError) {
            throw error;
        }
        throw new HttpError('Failed to fetch categories due to an unexpected error.', 500);
    }
};

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
        console.error("Error in updateCategoryService:", error);
        if (error instanceof HttpError) {
            throw error;
        }
        throw new HttpError('Failed to update category due to an unexpected error.', 500);
    }
};

export const deleteCategoryService = async (id: string) => {
    try {
        const category = await Categories.findOne({
            where: { id }
        });

        if (!category) {
            throw new HttpError('Category not found', 404);
        }

        const associatedCoursesCount = await Courses.count({
            where: { categoryId: id } // Assuming 'categoryId' is the foreign key in your Courses model
        });

        if (associatedCoursesCount > 0) {
            throw new HttpError(
                'Cannot delete category: It is linked to existing courses. Please reassign or delete associated courses first.',
                409 // 409 Conflict status code
            );
        }
        // --- END NEW LOGIC ---

        await Categories.destroy({
            where: { id }
        });

        return { message: 'Category deleted successfully' };

    } catch (error: any) {
        // Log the full error for debugging on the server
        console.error("Error in deleteCategoryService:", error);

        // Re-throw HttpErrors that we explicitly defined (e.g., 404 or 409)
        if (error instanceof HttpError) {
            throw error;
        }

        // For any other unexpected errors (e.g., actual database connection issues, typos),
        // throw a generic 500 error.
        throw new HttpError('Failed to delete category due to an unexpected server error.', 500);
    }
};
