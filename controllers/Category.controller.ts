import { NextFunction, Request, Response } from "express";
import HttpError from "../utils/httpError";
import { createCategoryService, deleteCategoryService, getCategoriesService, updateCategoryService } from "../services/Categories.service";
import { AuthenticatedRequest } from "../middleware/auth";
import { Role } from "../utils/constants";

export const createCategoryController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role;
        if (role !== Role.ADMIN) {
            throw new HttpError('Unauthorized', 403);
        }
        const { name, description, imageUrl } = req.body;
        if (!name) {
            throw new HttpError('Name is required', 400);
        }
        const newCategory = await createCategoryService({ name, description, imageUrl });
        res.status(201).json({
            success: true,
            data: newCategory
        });
    } catch (error) {
        next(error);
    }
}

export const getCategoriesController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, id } = req.query;
        const categories = await getCategoriesService({ name: name as string, id: id as string });
        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        next(error);
    }
}

export const updateCategoryController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role;
        if (role !== Role.ADMIN) {
            throw new HttpError('Unauthorized', 403);
        }
        const { name, description, imageUrl } = req.body;
        const { id } = req.params;
        if (!id) {
            throw new HttpError('Category ID is required', 400);
        }
        const updatedCategory = await updateCategoryService(id, { name, description, imageUrl });
        res.status(200).json({
            success: true,
            ...updatedCategory
        });
    } catch (error) {
        next(error);
    }
}

export const deleteCategoryController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        if (!id) {
            throw new HttpError('Category ID is required', 400);
        }
        const response = await deleteCategoryService(id);
        res.status(200).json({
            success: true,
            ...response
        });
    } catch (error) {
        next(error);
    }
}