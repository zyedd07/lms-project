// src/controllers/brandCategoryController.ts

import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import HttpError from "../utils/httpError";
import { Role } from "../utils/constants";
import {
    createBrandCategoryService,
    getBrandCategoryByIdService,
    getAllBrandCategoriesService,
    updateBrandCategoryService,
    deleteBrandCategoryService
} from "../services/brandCategoryService"; // Ensure correct import path

export const createBrandCategoryController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role;
        if (role !== Role.ADMIN) {
            throw new HttpError('Unauthorized: Only admins can create brand categories.', 403);
        }

        const { name } = req.body; // Only 'name' is expected for creation
        if (!name) {
            throw new HttpError('Please provide the brand category name.', 400);
        }

        const newBrandCategory = await createBrandCategoryService({ name });
        res.status(201).json({
            success: true,
            message: "Brand category created successfully.",
            data: newBrandCategory
        });
    } catch (error) {
        next(error);
    }
};

export const getBrandCategoryByIdController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        if (!id) {
            throw new HttpError('Brand Category ID is required in URL parameters.', 400);
        }

        const brandCategory = await getBrandCategoryByIdService(id);
        res.status(200).json({
            success: true,
            data: brandCategory
        });
    } catch (error) {
        next(error);
    }
};

export const getAllBrandCategoriesController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const brandCategories = await getAllBrandCategoriesService();
        res.status(200).json({
            success: true,
            data: brandCategories
        });
    } catch (error) {
        next(error);
    }
};

export const updateBrandCategoryController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role;
        if (role !== Role.ADMIN) {
            throw new HttpError('Unauthorized: Only admins can update brand categories.', 403);
        }

        const { id } = req.params;
        const { name } = req.body; // Only 'name' is expected for update
        if (!id) {
            throw new HttpError('Brand Category ID is required in URL parameters.', 400);
        }
        if (!name) { // Only name can be updated as per the model
            throw new HttpError('Please provide the new brand category name.', 400);
        }

        const updatedBrandCategory = await updateBrandCategoryService(id, { name });
        res.status(200).json({
            success: true,
            message: "Brand category updated successfully.",
            data: updatedBrandCategory
        });
    } catch (error) {
        next(error);
    }
};

export const deleteBrandCategoryController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role;
        if (role !== Role.ADMIN) {
            throw new HttpError('Unauthorized: Only admins can delete brand categories.', 403);
        }

        const { id } = req.params;
        if (!id) {
            throw new HttpError('Brand Category ID is required in URL parameters.', 400);
        }

        const response = await deleteBrandCategoryService(id);
        res.status(200).json({
            success: true,
            ...response // Contains the message from the service
        });
    } catch (error) {
        next(error);
    }
};