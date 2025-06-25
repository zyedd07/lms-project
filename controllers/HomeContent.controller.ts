import { Request, Response, NextFunction } from 'express';
import * as homeContentService from '../services/HomeContent.service';
import { UpdateHomeContentParams } from '../services/HomeContent.service';
import HttpError from '../utils/httpError';
import multer from 'multer'; // Keep the default import for the function

// --- Multer Configuration for handling image uploads in memory ---
const storage = multer.memoryStorage();
export const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB file size limit per image
});


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
 * @description Controller to update text-based fields of the home content.
 */
export const updateHomeContent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const params: UpdateHomeContentParams = req.body;
        if (Object.keys(params).length === 0) {
            throw new HttpError("No update data provided.", 400);
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

/**
 * @description Controller to handle the upload of new slider images.
 * This will replace all existing slider images.
 */
export const uploadSliderImages = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // FIX: Use the namespaced `multer.File` type provided by the declaration shim
        const files = req.files as multer.File[]; 
        if (!files || files.length === 0) {
            throw new HttpError("No image files were uploaded.", 400);
        }
        
        const updatedContent = await homeContentService.uploadSliderImagesService(files);
        res.status(200).json({
            success: true,
            message: "Slider images uploaded and updated successfully.",
            data: updatedContent
        });
    } catch (error) {
        next(error);
    }
};
