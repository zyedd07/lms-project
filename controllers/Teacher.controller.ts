import { NextFunction, Request, Response } from "express";
import { createTeacherService, loginTeacherService } from "../services/Teacher.service";
import exp from "constants";

export const createTeacher = async (req: Request, res: Response, next: NextFunction) => {
    try {
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