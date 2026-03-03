import DrugCategory from '../models/DrugCategory.model';
import Drug from '../models/Drug.model'; // Imported to check for associated drugs before deletion
import HttpError from '../utils/httpError';
import { CreateDrugCategoryParams, UpdateDrugCategoryParams } from "../utils/types";


/**
 * @description Create a new drug category.
 * @param {CreateDrugCategoryParams} params - The data for the new category.
 * @returns {Promise<DrugCategory>} The created category instance.
 */
export const createDrugCategoryService = async (params: CreateDrugCategoryParams): Promise<DrugCategory> => {
    try {
        // Check if a category with the same name already exists to prevent duplicates
        const existingCategory = await DrugCategory.findOne({ where: { name: params.name } });
        if (existingCategory) {
            throw new HttpError("A category with this name already exists.", 409); // 409 Conflict
        }
        const newCategory = await DrugCategory.create(params);
        return newCategory;
    } catch (error) {
        if (error instanceof HttpError) throw error;
        console.error("Error creating drug category:", error);
        throw new HttpError("Failed to create drug category.", 500);
    }
};

/**
 * @description Get a list of all drug categories.
 * @returns {Promise<DrugCategory[]>} An array of all drug categories.
 */
export const getAllDrugCategoriesService = async (): Promise<DrugCategory[]> => {
    try {
        const categories = await DrugCategory.findAll({
            order: [['name', 'ASC']], // Order categories alphabetically
        });
        return categories;
    } catch (error) {
        console.error("Error fetching drug categories:", error);
        throw new HttpError("Failed to fetch drug categories.", 500);
    }
};

/**
 * @description Update an existing drug category.
 * @param {string} categoryId - The ID of the category to update.
 * @param {UpdateDrugCategoryParams} params - The fields to update.
 * @returns {Promise<DrugCategory>} The updated category instance.
 */
export const updateDrugCategoryService = async (categoryId: string, params: UpdateDrugCategoryParams): Promise<DrugCategory> => {
    try {
        const category = await DrugCategory.findByPk(categoryId);
        if (!category) {
            throw new HttpError("Drug category not found.", 404);
        }
        // Check for name conflict if the name is being changed
        if (params.name) {
            const existingCategory = await DrugCategory.findOne({ where: { name: params.name } });
            if (existingCategory && existingCategory.id !== categoryId) {
                throw new HttpError("Another category with this name already exists.", 409);
            }
        }
        const updatedCategory = await category.update(params);
        return updatedCategory;
    } catch (error) {
        if (error instanceof HttpError) throw error;
        console.error("Error updating drug category:", error);
        throw new HttpError("Failed to update drug category.", 500);
    }
};

/**
 * @description Delete a drug category.
 * @param {string} categoryId - The ID of the category to delete.
 * @returns {Promise<{ message: string }>} A success message.
 */
export const deleteDrugCategoryService = async (categoryId: string): Promise<{ message: string }> => {
    try {
        const category = await DrugCategory.findByPk(categoryId);
        if (!category) {
            throw new HttpError("Drug category not found.", 404);
        }

        // Prevent deletion if drugs are associated with this category
        const associatedDrugs = await Drug.count({ where: { categoryId: categoryId } });
        if (associatedDrugs > 0) {
            throw new HttpError(`Cannot delete category. It is associated with ${associatedDrugs} drug(s).`, 400);
        }

        await category.destroy();
        return { message: "Drug category deleted successfully." };
    } catch (error) {
        if (error instanceof HttpError) throw error;
        console.error("Error deleting drug category:", error);
        throw new HttpError("Failed to delete drug category.", 500);
    }
};
