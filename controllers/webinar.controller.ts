// src/controllers/webinar.controller.ts

import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth"; // Assuming AuthenticatedRequest is defined here
import HttpError from "../utils/httpError";
import { Role } from "../utils/constants"; // Assuming Role enum is defined here

import {
    createWebinarService,
    getAllWebinarsService,
    getWebinarByIdService,
    updateWebinarService,
    deleteWebinarService,
} from "../services/webinar.service"; // Import your webinar services

import {
    WebinarInput, // For create and update request bodies
    GetAllWebinarServiceParams, // For query parameters for getting all webinars
    GetWebinarFilters // For pagination filters
} from "../utils/types"; // Import types from your utils/types file


/**
 * Controller to create a new webinar.
 * Accessible only by ADMIN role.
 */
export const createWebinarController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role;
        if (role !== Role.ADMIN) {
            throw new HttpError('Unauthorized: Only admins can create webinars', 403);
        }

        const {
            title,
            speaker,
            date,
            time,
            imageUrl,
            isLive,
            jitsiRoomName
        }: WebinarInput = req.body;

        // Basic validation
        if (!title || !speaker || !date || !time || !jitsiRoomName) {
            throw new HttpError('Please provide title, speaker, date, time, and jitsiRoomName', 400);
        }

        const newWebinar = await createWebinarService({
            title,
            speaker,
            date,
            time,
            imageUrl,
            isLive,
            jitsiRoomName
        });

        res.status(201).json({
            success: true,
            message: 'Webinar created successfully',
            data: newWebinar
        });
    } catch (error) {
        next(error); // Pass error to the error handling middleware
    }
};

/**
 * Controller to get all webinars.
 * Can apply filters and pagination.
 */
export const getAllWebinarsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { isLive, limit, offset } = req.query;

        // Prepare parameters for the service
        const params: GetAllWebinarServiceParams = {};
        if (isLive !== undefined) {
            params.isLive = String(isLive).toLowerCase() === 'true';
        }

        // Prepare filters for pagination
        const filters: GetWebinarFilters = {};
        if (limit) {
            filters.limit = parseInt(limit as string, 10);
        }
        if (offset) {
            filters.offset = parseInt(offset as string, 10);
        }

        const webinars = await getAllWebinarsService(params, filters);

        res.status(200).json({
            success: true,
            data: webinars
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to get a single webinar by its ID.
 */
export const getWebinarByIdController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        if (!id) {
            throw new HttpError('Webinar ID is required in URL parameters', 400);
        }

        const webinar = await getWebinarByIdService(id);

        if (!webinar) {
            throw new HttpError('Webinar not found', 404);
        }

        res.status(200).json({
            success: true,
            data: webinar
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to update an existing webinar.
 * Accessible only by ADMIN role.
 */
export const updateWebinarController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role;
        if (role !== Role.ADMIN) {
            throw new HttpError('Unauthorized: Only admins can update webinars', 403);
        }

        const { id } = req.params;
        if (!id) {
            throw new HttpError('Webinar ID is required in URL parameters', 400);
        }

        const updateData: Partial<WebinarInput> = req.body;

        // Ensure at least one field is provided for update
        if (Object.keys(updateData).length === 0) {
            throw new HttpError('No update data provided', 400);
        }

        const updatedWebinar = await updateWebinarService(id, updateData);

        if (!updatedWebinar) {
            throw new HttpError('Webinar not found or no changes applied', 404);
        }

        res.status(200).json({
            success: true,
            message: 'Webinar updated successfully',
            data: updatedWebinar
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to delete a webinar by its ID.
 * Accessible only by ADMIN role.
 */
export const deleteWebinarController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role;
        if (role !== Role.ADMIN) {
            throw new HttpError('Unauthorized: Only admins can delete webinars', 403);
        }

        const { id } = req.params;
        if (!id) {
            throw new HttpError('Webinar ID is required in URL parameters', 400);
        }

        const response = await deleteWebinarService(id);

        res.status(200).json({
            success: true,
            ...response // Contains { message: 'Webinar deleted successfully' }
        });
    } catch (error) {
        next(error);
    }
};
