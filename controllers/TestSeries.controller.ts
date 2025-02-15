import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import HttpError from "../utils/httpError";
import { createTestSeriesService, getAllTestSeriesService, updateTestSeriesService, deleteTestSeriesService } from "../services/TestSeries.service";
import { Role } from "../utils/constants";


export const createTestSeriesController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role;
        if (role !== Role.ADMIN && role !== Role.TEACHER) {
            throw new HttpError("Unauthorized", 403);
        }
        const { name, description } = req.body;
        if (!name) {
            throw new HttpError("Name is required", 400);
        }
        const newTestSeries = await createTestSeriesService({
            name,
            description,
            createdBy: req.user.id,
        });
        res.status(201).json(newTestSeries);
    } catch (error) {
        next(error);
    }
};


export const getTestSeriesController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const testSeriesList = await getAllTestSeriesService({});
        res.status(200).json({
            success: true,
            data: testSeriesList,
        });
    } catch (error) {
        next(error);
    }
};


export const updateTestSeriesController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const role = req.user?.role;
        if (role !== Role.ADMIN && role !== Role.TEACHER) {
            throw new HttpError("Unauthorized", 403);
        }
        const updatedTestSeries = await updateTestSeriesService(id, { name, description });
        res.status(200).json({
            success: true,
            data: updatedTestSeries,
        });
    } catch (error) {
        next(error);
    }
};


export const deleteTestSeriesController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const role = req.user?.role;
        if (role !== Role.ADMIN && role !== Role.TEACHER) {
            throw new HttpError("Unauthorized", 403);
        }
        const response = await deleteTestSeriesService(id);
        res.status(200).json({
            success: true,
            ...response,
        });
    } catch (error) {
        next(error);
    }
};
