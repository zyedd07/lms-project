import { Request, Response, NextFunction } from 'express';
import * as drugCategoryService from '../services/DrugCategory.service';
import { CreateDrugCategoryParams, UpdateDrugCategoryParams } from '../utils/types';
import HttpError from '../utils/httpError';

/**
 * @description Controller to create a new drug category.
 */
export const createDrugCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const params: CreateDrugCategoryParams = req.body;
        if (!params.name || typeof params.name !== 'string' || params.name.trim() === '') {
            throw new HttpError("Category name is required and must be a non-empty string.", 400);
        }
        const newCategory = await drugCategoryService.createDrugCategoryService(params);
        res.status(201).json({
            success: true,
            message: "Drug category created successfully.",
            data: newCategory
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @description Controller to get all drug categories.
 */
export const getAllDrugCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const categories = await drugCategoryService.getAllDrugCategoriesService();
        res.status(200).json({
            success: true,
            message: "Drug categories fetched successfully.",
            data: categories
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @description Controller to update an existing drug category.
 */
export const updateDrugCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { categoryId } = req.params;
        const params: UpdateDrugCategoryParams = req.body;

        if (!categoryId) {
            throw new HttpError("Category ID is required in the URL.", 400);
        }
        if (!params.name || typeof params.name !== 'string' || params.name.trim() === '') {
            throw new HttpError("A non-empty category name is required for update.", 400);
        }

        const updatedCategory = await drugCategoryService.updateDrugCategoryService(categoryId, params);
        res.status(200).json({
            success: true,
            message: "Drug category updated successfully.",
            data: updatedCategory
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @description Controller to delete a drug category.
 */
export const deleteDrugCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { categoryId } = req.params;
        if (!categoryId) {
            throw new HttpError("Category ID is required in the URL.", 400);
        }
        const result = await drugCategoryService.deleteDrugCategoryService(categoryId);
        res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        next(error);
    }
};
