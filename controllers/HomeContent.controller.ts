import { Request, Response, NextFunction } from 'express';
import * as homeContentService from '../services/HomeContent.service';
import { UpdateHomeContentParams } from '../utils/types';
import HttpError from '../utils/httpError';

/**
 * @description Controller to get the single home content record.
 */
export const getHomeContent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const content = await homeContentService.getHomeContentService();
        res.status(200).json({
            success: true,
            message: "Home content fetched successfully.",
            data: content
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @description Controller to update all fields of the home content, including slider image URLs.
 */
export const updateHomeContent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const params: UpdateHomeContentParams = req.body;

        // Basic validation to ensure some data is provided
        if (Object.keys(params).length === 0) {
            throw new HttpError("No update data provided.", 400);
        }

        // Optional: Add specific validation for the sliderImages array
        if (params.sliderImages && !Array.isArray(params.sliderImages)) {
            throw new HttpError("sliderImages must be an array of URLs.", 400);
        }

        const updatedContent = await homeContentService.updateHomeContentService(params);
        res.status(200).json({
            success: true,
            message: "Home content updated successfully.",
            data: updatedContent
        });
    } catch (error) {
        next(error);
    }
};

// The uploadSliderImages controller and multer configuration have been removed.