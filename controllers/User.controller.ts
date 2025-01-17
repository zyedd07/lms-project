import { NextFunction, Request, Response } from "express";
import HttpError from "../utils/httpError";
import { createUserService, getUsersService, loginUserService } from "../services/User.service";

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password, phone } = req.body;
        if (!name || !email || !password || !phone) {
            throw new HttpError("Please provide all required fields", 400);
        }
        const newUser = await createUserService({ name, email, password, phone });
        res.status(201).json(newUser);
    } catch (error) {
        next(error);
    }
}

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            throw new HttpError("Please provide both email and password", 400);
        }
        const response = await loginUserService({ email, password });
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
}

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const email = req.params.email;
        const user = await getUsersService(email);
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
}