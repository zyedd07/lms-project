// src/controllers/companyController.ts

import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import HttpError from "../utils/httpError";
import { Role } from "../utils/constants";
import {
    createCompanyService,
    getCompanyByIdService,
    getAllCompaniesService,
    updateCompanyService,
    deleteCompanyService
} from "../services/companyService";

export const createCompanyController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role;
        if (role !== Role.ADMIN) {
            throw new HttpError('Unauthorized: Only admins can create companies.', 403);
        }

        // Only destructure 'name'
        const { name } = req.body;

        if (!name) {
            throw new HttpError('Please provide company name.', 400);
        }

        const newCompany = await createCompanyService({
            name,
            // REMOVED: website, logoUrl, address
        });

        res.status(201).json({
            success: true,
            message: "Company created successfully.",
            data: newCompany
        });
    } catch (error) {
        next(error);
    }
};

export const getCompanyByIdController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        if (!id) {
            throw new HttpError('Company ID is required in URL parameters.', 400);
        }

        const company = await getCompanyByIdService(id);
        res.status(200).json({
            success: true,
            data: company
        });
    } catch (error) {
        next(error);
    }
};

export const getAllCompaniesController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // If you had query parameters for website, logoUrl, address, they'd be removed here
        const companies = await getAllCompaniesService();
        res.status(200).json({
            success: true,
            data: companies
        });
    } catch (error) {
        next(error);
    }
};

export const updateCompanyController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role;
        if (role !== Role.ADMIN) {
            throw new HttpError('Unauthorized: Only admins can update companies.', 403);
        }

        const { id } = req.params;
        // Only destructure 'name' for update
        const { name } = req.body;

        if (!id) {
            throw new HttpError('Company ID is required in URL parameters.', 400);
        }

        // Check if 'name' is provided for update
        if (!name) {
            throw new HttpError('Please provide company name to update.', 400);
        }

        const updatedCompany = await updateCompanyService(id, {
            name,
            // REMOVED: website, logoUrl, address
        });

        res.status(200).json({
            success: true,
            message: "Company updated successfully.",
            data: updatedCompany
        });
    } catch (error) {
        next(error);
    }
};

export const deleteCompanyController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role;
        if (role !== Role.ADMIN) {
            throw new HttpError('Unauthorized: Only admins can delete companies.', 403);
        }

        const { id } = req.params;
        if (!id) {
            throw new HttpError('Company ID is required in URL parameters.', 400);
        }

        const response = await deleteCompanyService(id);
        res.status(200).json({
            success: true,
            ...response
        });
    } catch (error) {
        next(error);
    }
};