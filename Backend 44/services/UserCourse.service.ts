import UserCourse from '../models/UserCourse.model';
import Course from '../models/Course.model';
import HttpError from '../utils/httpError';
// Import the necessary types from your types file
import { EnrollmentStatus, EnrollInCourseServiceParams, UnenrollFromCourseServiceParams, GetUserEnrolledCoursesParams, UpdateEnrollmentStatusParams } from '../utils/types';

export const enrollUserInCourse = async ({ userId, courseId }: EnrollInCourseServiceParams) => {
    // Check if the enrollment already exists
    const existingEnrollment = await UserCourse.findOne({
        where: { userId, courseId }
    });

    if (existingEnrollment) {
        throw new HttpError("User is already enrolled in this course.", 409); // 409 Conflict
    }

    // The status will default to 'active' based on the model definition.
    const newEnrollment = await UserCourse.create({ userId, courseId });
    return newEnrollment;
};

export const getEnrolledCoursesForUser = async ({ userId }: GetUserEnrolledCoursesParams) => {
    const enrollments = await UserCourse.findAll({
        where: { userId },
        include: [{
            model: Course,
            attributes: ['id', 'name', 'description','price','contents'] // Use 'name' to match your Course model
        }]
    });
    return enrollments;
};

export const unenrollUserFromCourse = async ({ userId, courseId }: UnenrollFromCourseServiceParams) => {
    const result = await UserCourse.destroy({
        where: { userId, courseId }
    });

    if (result === 0) {
        throw new HttpError("Enrollment record not found.", 404);
    }

    return true;
};

/**
 * Updates the status of an existing enrollment.
 * @param userId The ID of the user.
 * @param courseId The ID of the course.
 * @param status The new status ('active', 'completed', or 'dropped').
 */
export const updateEnrollmentStatus = async ({ userId, courseId, status }: UpdateEnrollmentStatusParams) => {
    const enrollment = await UserCourse.findOne({
        where: { userId, courseId }
    });

    if (!enrollment) {
        throw new HttpError("Enrollment record not found.", 404);
    }

    // FIX: Cast the generic model instance to 'any' to allow property access.
    // This resolves the "Property 'status' does not exist" error.
    (enrollment as any).status = status;
    await enrollment.save();
    return enrollment;
};
