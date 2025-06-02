import { NextFunction, Request, Response } from "express";
import HttpError from "../utils/httpError";
import { createAdminService, loginAdminService } from "../services/Admin.service";
import { AuthenticatedRequest } from "../middleware/auth";
import { Role, RoleValue } from "../utils/constants"; // <-- Ensure RoleValue is imported

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
        console.log(`[AdminController] Attempting login for email: ${email}`); // LOG 1

        if (!email || !password) {
            throw new HttpError("Please provide both email and password", 400);
        }

        const response = await loginAdminService({ email, password });
        
        console.log(`[AdminController] Response from loginAdminService:`, response); // LOG 2
        console.log(`[AdminController] User Role from service response:`, response.user?.role); // LOG 3
        console.log(`[AdminController] Role.STUDENT value:`, Role.STUDENT); // LOG 4

        // --- ROLE-BASED ACCESS CONTROL AT LOGIN ---
        // Using 'as RoleValue' for type safety in comparison
        if (response.user && response.user.role === (Role.STUDENT as RoleValue)) {
            console.log(`[AdminController] Detected student role. Denying access.`); // LOG 5
            throw new HttpError('Student accounts do not have access to the admin panel.', 403);
        } else {
            console.log(`[AdminController] Role is not student, or user object is missing. Allowing login.`); // LOG 6
        }
        // --- END ROLE-BASED ACCESS CONTROL ---

        res.status(200).json(response);
    } catch (error) {
        console.error(`[AdminController] Login error caught:`, error); // LOG 7
        if (error instanceof HttpError) {
            console.error(`[AdminController] Sending HttpError: Status ${error.statusCode}, Message: ${error.message}`); // LOG 8
        }
        next(error);
    }
}
