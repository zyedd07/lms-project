import { Request, Response, NextFunction } from 'express';
import * as drugService from '../services/Drug.service';
import { CreateDrugParams, UpdateDrugParams } from '../utils/types';
import HttpError from '../utils/httpError';

/**
 * @description Controller to create a new drug.
 */
export const createDrug = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const params: CreateDrugParams = req.body;
        if (!params.name || !params.categoryId || !params.details) {
            throw new HttpError("Name, categoryId, and details are required fields.", 400);
        }
        const newDrug = await drugService.createDrugService(params);
        res.status(201).json({
            success: true,
            message: "Drug created successfully.",
            data: newDrug
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @description Controller to get all drugs, grouped by the first letter.
 */
export const getAllDrugsGrouped = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const groupedDrugs = await drugService.getAllDrugsGroupedService();
        res.status(200).json({
            success: true,
            message: "Drugs fetched and grouped successfully.",
            data: groupedDrugs
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @description Controller to get a single drug by its ID.
 */
export const getDrugById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { drugId } = req.params;
        if (!drugId) {
            throw new HttpError("Drug ID is required.", 400);
        }
        const drug = await drugService.getDrugByIdService(drugId);
        res.status(200).json({
            success: true,
            message: "Drug details fetched successfully.",
            data: drug
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @description Controller to update an existing drug.
 */
export const updateDrug = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { drugId } = req.params;
        const params: UpdateDrugParams = req.body;

        if (!drugId) {
            throw new HttpError("Drug ID is required.", 400);
        }
        if (Object.keys(params).length === 0) {
            throw new HttpError("No update data provided.", 400);
        }

        const updatedDrug = await drugService.updateDrugService(drugId, params);
        res.status(200).json({
            success: true,
            message: "Drug updated successfully.",
            data: updatedDrug
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @description Controller to delete a drug.
 */
export const deleteDrug = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { drugId } = req.params;
        if (!drugId) {
            throw new HttpError("Drug ID is required.", 400);
        }
        const result = await drugService.deleteDrugService(drugId);
        res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        next(error);
    }
};
