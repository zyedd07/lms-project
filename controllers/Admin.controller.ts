import { NextFunction, Request, Response } from "express";
import HttpError from "../utils/httpError";
import { createAdminService, loginAdminService } from "../services/Admin.service";
import { AuthenticatedRequest } from "../middleware/auth";
import { Role } from "../utils/constants";

export const createAdminController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role;
        if (role !== Role.ADMIN) {
            throw new HttpError('Unauthorized', 403);
        }
        const { name, email, password } = req.body;
        if (!email || !password || !name) {
            throw new HttpError("Please provide name, email and password", 400);
        }
        const newAdmin = await createAdminService({ name, email, password });
        res.status(201).json(newAdmin);
    } catch (error) {
        next(error);
    }
}

export const loginAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            throw new HttpError("Please provide both email and password", 400);
        }
        const response = await loginAdminService({ email, password });
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
}