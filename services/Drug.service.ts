import Drug from '../models/Drug.model';
import DrugCategory from '../models/DrugCategory.model';
import HttpError from '../utils/httpError';
import { Op } from 'sequelize';
import { CreateDrugParams, UpdateDrugParams } from "../utils/types";

/**
 * @description Create a new drug entry.
 * @param {CreateDrugParams} params - The data for the new drug.
 * @returns {Promise<Drug>} The created drug instance.
 */
export const createDrugService = async (params: CreateDrugParams): Promise<Drug> => {
    try {
        // Ensure the category exists before creating the drug
        const category = await DrugCategory.findByPk(params.categoryId);
        if (!category) {
            throw new HttpError("The specified category does not exist.", 400);
        }
        const newDrug = await Drug.create(params);
        return newDrug;
    } catch (error) {
        if (error instanceof HttpError) throw error;
        console.error("Error creating drug:", error);
        throw new HttpError("Failed to create drug.", 500);
    }
};

/**
 * @description Get a list of all drugs, grouped by the first letter of their name (A-Z).
 * @returns {Promise<object>} An object where keys are letters and values are arrays of drugs.
 */
export const getAllDrugsGroupedService = async (): Promise<object> => {
    try {
        const drugs = await Drug.findAll({
            order: [['name', 'ASC']],
            include: [{ model: DrugCategory, as: 'category', attributes: ['name'] }]
        });
        
        // Group drugs by the first letter of their name
        const groupedDrugs = drugs.reduce((acc, drug) => {
            const firstLetter = drug.name.charAt(0).toUpperCase();
            if (!acc[firstLetter]) {
                acc[firstLetter] = [];
            }
            acc[firstLetter].push(drug);
            return acc;
        }, {} as { [key: string]: Drug[] });

        return groupedDrugs;
    } catch (error) {
        console.error("Error fetching and grouping drugs:", error);
        throw new HttpError("Failed to fetch drugs.", 500);
    }
};

/**
 * @description Get a single drug by its ID, including category details.
 * @param {string} drugId - The ID of the drug.
 * @returns {Promise<Drug>} The drug instance.
 */
export const getDrugByIdService = async (drugId: string): Promise<Drug> => {
    try {
        const drug = await Drug.findByPk(drugId, {
             include: [{ model: DrugCategory, as: 'category', attributes: ['id', 'name'] }]
        });
        if (!drug) {
            throw new HttpError("Drug not found.", 404);
        }
        return drug;
    } catch (error) {
        if (error instanceof HttpError) throw error;
        console.error("Error fetching drug by ID:", error);
        throw new HttpError("Failed to fetch drug.", 500);
    }
};

/**
 * @description Update an existing drug entry.
 * @param {string} drugId - The ID of the drug to update.
 * @param {UpdateDrugParams} params - The fields to update.
 * @returns {Promise<Drug>} The updated drug instance.
 */
export const updateDrugService = async (drugId: string, params: UpdateDrugParams): Promise<Drug> => {
    try {
        const drug = await getDrugByIdService(drugId); // Reuse getById to check existence
        
        // If categoryId is being updated, ensure the new category exists
        if (params.categoryId) {
            const category = await DrugCategory.findByPk(params.categoryId);
            if (!category) {
                throw new HttpError("The specified category for update does not exist.", 400);
            }
        }
        
        const updatedDrug = await drug.update(params);
        return updatedDrug;
    } catch (error) {
        if (error instanceof HttpError) throw error;
        console.error("Error updating drug:", error);
        throw new HttpError("Failed to update drug.", 500);
    }
};

/**
 * @description Delete a drug entry.
 * @param {string} drugId - The ID of the drug to delete.
 * @returns {Promise<{ message: string }>} A success message.
 */
export const deleteDrugService = async (drugId: string): Promise<{ message: string }> => {
    try {
        const drug = await getDrugByIdService(drugId); // Reuse getById to check existence
        await drug.destroy();
        return { message: "Drug deleted successfully." };
    } catch (error) {
        if (error instanceof HttpError) throw error;
        console.error("Error deleting drug:", error);
        throw new HttpError("Failed to delete drug.", 500);
    }
};
