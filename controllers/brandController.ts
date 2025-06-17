// src/controllers/brandController.ts

import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import HttpError from "../utils/httpError";
import { Role } from "../utils/constants";
import {
    createBrandService,
    getBrandByIdService,
    getAllBrandsService,
    updateBrandService,
    deleteBrandService
} from "../services/brandService";
import { GetAllBrandServiceParams } from "../utils/types"; // Import the type for query parameters

export const createBrandController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role;
        if (role !== Role.ADMIN) {
            throw new HttpError('Unauthorized: Only admins can create brands.', 403);
        }

        // Removed 'name' from destructuring
        const { contents, brandCategoryId, companyId, availability, recommended_by_vets } = req.body;

        // Removed 'name' from the validation check
        if (!brandCategoryId || !companyId || !availability) {
            throw new HttpError('Please provide brand category ID, company ID, and availability.', 400);
        }

        const newBrand = await createBrandService({
            // Removed 'name' from the service call
            contents,
            brandCategoryId,
            companyId,
            availability,
            recommended_by_vets
        });

        res.status(201).json({
            success: true,
            message: "Brand created successfully.",
            data: newBrand
        });
    } catch (error) {
        next(error);
    }
};

export const getBrandByIdController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        if (!id) {
            throw new HttpError('Brand ID is required in URL parameters.', 400);
        }

        const brand = await getBrandByIdService(id);
        res.status(200).json({
            success: true,
            data: brand
        });
    } catch (error) {
        next(error);
    }
};

export const getAllBrandsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Removed 'name' from destructuring query parameters
        const { id, brandCategoryId, companyId, recommended_by_vets, availability, limit, offset } = req.query;

        const params: GetAllBrandServiceParams = {
            id: id as string,
            // Removed 'name' from params object
            brandCategoryId: brandCategoryId as string,
            companyId: companyId as string,
            // Convert recommended_by_vets to boolean if present
            recommended_by_vets: typeof recommended_by_vets === 'string' ? recommended_by_vets === 'true' : undefined,
            availability: availability as string,
            limit: limit ? parseInt(limit as string) : undefined,
            offset: offset ? parseInt(offset as string) : undefined,
        };

        const brands = await getAllBrandsService(params);
        res.status(200).json({
            success: true,
            data: brands
        });
    } catch (error) {
        next(error);
    }
};

export const updateBrandController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role;
        if (role !== Role.ADMIN) {
            throw new HttpError('Unauthorized: Only admins can update brands.', 403);
        }

        const { id } = req.params;
        // Removed 'name' from destructuring body
        const { contents, brandCategoryId, companyId, availability, recommended_by_vets } = req.body;

        if (!id) {
            throw new HttpError('Brand ID is required in URL parameters.', 400);
        }

        // Removed 'name' from the update fields check
        if (!contents && !brandCategoryId && !companyId && !availability && recommended_by_vets === undefined) {
            throw new HttpError('Please provide at least one field to update.', 400);
        }

        const updatedBrand = await updateBrandService(id, {
            // Removed 'name' from the service call
            contents,
            brandCategoryId,
            companyId,
            availability,
            recommended_by_vets
        });

        res.status(200).json({
            success: true,
            message: "Brand updated successfully.",
            data: updatedBrand
        });
    } catch (error) {
        next(error);
    }
};

export const deleteBrandController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role;
        if (role !== Role.ADMIN) {
            throw new HttpError('Unauthorized: Only admins can delete brands.', 403);
        }

        const { id } = req.params;
        if (!id) {
            throw new HttpError('Brand ID is required in URL parameters.', 400);
        }

        const response = await deleteBrandService(id);
        res.status(200).json({
            success: true,
            ...response
        });
    } catch (error) {
        next(error);
    }
};