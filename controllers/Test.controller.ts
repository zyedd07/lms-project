import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import HttpError from "../utils/httpError";
import { createTestService, getTestByIdService, updateTestService, deleteTestService, getTestsByTestSeriesService } from "../services/Test.service";
import { Role } from "../utils/constants";

export const createTestController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const role = req.user?.role;
    if (role !== Role.ADMIN && role !== Role.TEACHER) {
      throw new HttpError("Unauthorized", 403);
    }
    const { testSeriesId, name, description } = req.body;
    if (!testSeriesId || !name) {
      throw new HttpError("TestSeries ID and test name are required", 400);
    }
    const newTest = await createTestService({ testSeriesId, name, description });
    res.status(201).json(newTest);
  } catch (error) {
    next(error);
  }
};

export const getTestController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const test = await getTestByIdService(id);
    res.status(200).json({ success: true, data: test });
  } catch (error) {
    next(error);
  }
};

export const updateTestController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const role = req.user?.role;
    if (role !== Role.ADMIN && role !== Role.TEACHER) {
      throw new HttpError("Unauthorized", 403);
    }
    const result = await updateTestService(id, { name, description });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const deleteTestController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const role = req.user?.role;
    if (role !== Role.ADMIN && role !== Role.TEACHER) {
      throw new HttpError("Unauthorized", 403);
    }
    const result = await deleteTestService(id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getTestsByTestSeriesController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { testSeriesId } = req.query;
    if (!testSeriesId) {
      throw new HttpError("TestSeries ID is required", 400);
    }
    const tests = await getTestsByTestSeriesService(testSeriesId as string);
    res.status(200).json({ success: true, data: tests });
  } catch (error) {
    next(error);
  }
};
