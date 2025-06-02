import { NextFunction, Request, Response } from "express";
import HttpError from "../utils/httpError";
import { createAdminService, loginAdminService } from "../services/Admin.service";
import { AuthenticatedRequest } from "../middleware/auth";
import { Role } from "../utils/constants"; // Make sure Role constant is correctly defined here

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

        // Assuming loginAdminService returns an object like { token: string, user: { role: string, ... } }
        const response = await loginAdminService({ email, password });

        // --- NEW: ROLE-BASED ACCESS CONTROL AT LOGIN ---
        // Check if the user object exists in the response and if their role is 'student'
        if (response.user && response.user.role === Role.STUDENT) {
            throw new HttpError('Student accounts do not have access to the admin panel.', 403);
        }
        // --- END ROLE-BASED ACCESS CONTROL ---

        res.status(200).json(response);
    } catch (error) {
        // If an HttpError is thrown (like the 403 for student), it will be caught here and passed to next()
        next(error);
    }
}
