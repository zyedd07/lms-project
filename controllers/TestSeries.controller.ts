import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import HttpError from "../utils/httpError";
import { createTestSeriesService, getAllTestSeriesService, updateTestSeriesService, deleteTestSeriesService } from "../services/TestSeries.service";
import { Role } from "../utils/constants";
import Question from "../models/Question.model";
import Test from "../models/Test.model";
import TestSeries from "../models/TestSeries.model";
import TestOption from "../models/Option.model"


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

export const getFullTestSeriesController = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const testSeriesData = await TestSeries.findAll({
        include: [{
          model: Test,
          as: 'tests',
          include: [{
            model: Question,
            as: 'questions',
            include: [{
              model: TestOption,
              as: 'options'
            }]
          }]
        }]
      });
      res.status(200).json({ success: true, data: testSeriesData });
    } catch (error) {
      next(new HttpError("Error fetching full test series data", 500));
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
