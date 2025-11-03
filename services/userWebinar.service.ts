import UserWebinar from '../models/UserWebinar.model';
import Webinar from '../models/webinar.model';
import HttpError from '../utils/httpError';
import {
    WebinarEnrollmentStatus,
    EnrollInWebinarServiceParams,
    UnenrollFromWebinarServiceParams,
    GetUserEnrolledWebinarsParams,
    UpdateWebinarEnrollmentStatusParams
} from '../utils/types';

/**
 * Enrolls a user in a specific webinar.
 * Throws an HttpError if the user is already enrolled.
 * @param {EnrollInWebinarServiceParams} { userId, webinarId } - The user ID and webinar ID.
 * @returns {Promise<UserWebinar>} The newly created user webinar enrollment record.
 */
export const enrollUserInWebinar = async ({ userId, webinarId }: EnrollInWebinarServiceParams) => {
    // Check if the enrollment already exists
    const existingEnrollment = await UserWebinar.findOne({
        where: { userId, webinarId }
    });

    if (existingEnrollment) {
        throw new HttpError("User is already enrolled in this webinar.", 409); // 409 Conflict
    }

    // The status will default to 'active' or similar based on the UserWebinar model definition.
    const newEnrollment = await UserWebinar.create({ userId, webinarId });
    return newEnrollment;
};

/**
 * Retrieves all webinars a specific user is enrolled in.
 * Includes details of the webinar from the Webinar model.
 * @param {GetUserEnrolledWebinarsParams} { userId } - The ID of the user.
 * @returns {Promise<UserWebinar[]>} A list of user webinar enrollment records with associated webinar details.
 */
export const getEnrolledWebinarsForUser = async ({ userId }: GetUserEnrolledWebinarsParams) => {
    const enrollments = await UserWebinar.findAll({
        where: { userId },
        include: [{
            model: Webinar,
            // FIX: Added all fields from webinar.model.ts's init block
            attributes: [
                'id',
                'title',
                'speaker',
                'date',
                'time',
                'imageUrl',
                'status',
                'jitsiRoomName',
                'price'
            ]
        }]
    });
    return enrollments;
};

/**
 * Unenrolls a user from a specific webinar.
 * Throws an HttpError if the enrollment record is not found.
 * @param {UnenrollFromWebinarServiceParams} { userId, webinarId } - The user ID and webinar ID.
 * @returns {Promise<boolean>} True if the unenrollment was successful.
 */
export const unenrollUserFromWebinar = async ({ userId, webinarId }: UnenrollFromWebinarServiceParams) => {
    const result = await UserWebinar.destroy({
        where: { userId, webinarId }
    });

    if (result === 0) {
        throw new HttpError("Webinar enrollment record not found.", 404);
    }

    return true;
};

/**
 * Updates the status of an existing webinar enrollment for a user.
 * Throws an HttpError if the enrollment record is not found.
 * @param {UpdateWebinarEnrollmentStatusParams} { userId, webinarId, status } - The user ID, webinar ID, and new status.
 * @returns {Promise<UserWebinar>} The updated user webinar enrollment record.
 */
export const updateWebinarEnrollmentStatus = async ({ userId, webinarId, status }: UpdateWebinarEnrollmentStatusParams) => {
    const enrollment = await UserWebinar.findOne({
        where: { userId, webinarId }
    });

    if (!enrollment) {
        throw new HttpError("Webinar enrollment record not found.", 404);
    }

    (enrollment as any).status = status;
    await enrollment.save();
    return enrollment;
};