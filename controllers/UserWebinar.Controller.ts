import { Request, Response, NextFunction } from 'express';
import * as UserWebinarService from '../services/userWebinar.service'; // Assuming your webinar service is here
import { WebinarEnrollmentStatus } from '../utils/types'; // Import the enum for type checking

/**
 * Controller function to handle enrolling a user in a webinar.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The Express next middleware function.
 */
export const enrollInWebinar = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, webinarId } = req.body;

        // Validate required fields
        if (!userId || !webinarId) {
            return res.status(400).json({ success: false, message: 'User ID and Webinar ID are required.' });
        }

        // Call the service function to enroll the user
        const enrollment = await UserWebinarService.enrollUserInWebinar({ userId, webinarId });

        // Respond with success message and the new enrollment data
        res.status(201).json({ success: true, message: 'User enrolled in webinar successfully.', data: enrollment });
    } catch (error) {
        // Pass any errors to the next middleware (error handler)
        next(error);
    }
};

/**
 * Controller function to handle fetching all webinars a user is enrolled in.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The Express next middleware function.
 */
export const getUserWebinars = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params; // Assuming userId comes from URL params

        // Call the service function to get enrolled webinars
        const webinars = await UserWebinarService.getEnrolledWebinarsForUser({ userId });

        // Respond with success and the list of webinars
        res.status(200).json({ success: true, data: webinars });
    } catch (error) {
        // Pass any errors to the next middleware (error handler)
        next(error);
    }
};

/**
 * Controller function to handle unenrolling a user from a webinar.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The Express next middleware function.
 */
export const unenrollFromWebinar = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, webinarId } = req.body;

        // Validate required fields
        if (!userId || !webinarId) {
            return res.status(400).json({ success: false, message: 'User ID and Webinar ID are required.' });
        }

        // Call the service function to unenroll the user
        await UserWebinarService.unenrollUserFromWebinar({ userId, webinarId });

        // Respond with success message
        res.status(200).json({ success: true, message: 'User unenrolled from webinar successfully.' });
    } catch (error)
    {
        // Pass any errors to the next middleware (error handler)
        next(error);
    }
};

/**
 * Controller function to handle updating the enrollment status of a user in a webinar.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The Express next middleware function.
 */
export const updateWebinarEnrollmentStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, webinarId, status } = req.body;

        // Validate required fields
        if (!userId || !webinarId || !status) {
            return res.status(400).json({ success: false, message: 'User ID, Webinar ID, and a new status are required.' });
        }

        // Optional: Validate if the provided status is a valid enum value
        if (!Object.values(WebinarEnrollmentStatus).includes(status as WebinarEnrollmentStatus)) {
            return res.status(400).json({ success: false, message: `Invalid status provided. Must be one of: ${Object.values(WebinarEnrollmentStatus).join(', ')}` });
        }

        // Call the service function to update the enrollment status
        const updatedEnrollment = await UserWebinarService.updateWebinarEnrollmentStatus({ userId, webinarId, status });

        // Respond with success message and the updated enrollment data
        res.status(200).json({ success: true, message: 'Webinar enrollment status updated successfully.', data: updatedEnrollment });
    } catch (error) {
        // Pass any errors to the next middleware (error handler)
        next(error);
    }
};
