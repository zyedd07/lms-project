import { NextFunction, Request, Response } from "express";
import { createTeacherService, getTeachersService, loginTeacherService } from "../services/Teacher.service";
import exp from "constants";
import { AuthenticatedRequest } from "../middleware/auth";
import HttpError from "../utils/httpError";
import { Role } from "../utils/constants";

export const createTeacher = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user || req.user.role !== Role.ADMIN) {
            throw new HttpError("Unauthorized", 403);
        }
        const { name, email, password, phone, expertise } = req.body;
        if (!name || !email || !password || !phone || !expertise) {
            throw new Error("Please provide all required fields");
        }
        const newTeacher = await createTeacherService({ name, email, password, phone, expertise });
        res.status(201).json(newTeacher);
    } catch (error) {
        next(error);
    }
}

export const loginTeacher = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            throw new Error("Please provide both email and password");
        }
        const response = await loginTeacherService({ email, password });
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
}

export const getTeachersController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user || req.user.role !== Role.ADMIN) {
            throw new HttpError("Unauthorized", 403);
        }
        const { name, email, expertise, phone, id } = req.query;
        const teachers = await getTeachersService({ name: name as string, email: email as string, expertise: expertise as string, phone: phone as string, id: id as string });
        res.status(200).json({
            success: true,
            data: teachers
        });
    } catch (error) {
        next(error);
    }
}