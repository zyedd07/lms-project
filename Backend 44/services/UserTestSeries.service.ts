import UserTestSeries from '../models/UserTestSeries.model';
import TestSeries from '../models/TestSeries.model';
import HttpError from '../utils/httpError';
import { EnrollmentStatus, UpdateTestSeriesEnrollmentParams } from '../utils/types';

export const enrollUserInTestSeries = async ({ userId, testSeriesId }: { userId: string, testSeriesId: string }) => {
    const existingEnrollment = await UserTestSeries.findOne({
        where: { userId, testSeriesId }
    });

    if (existingEnrollment) {
        throw new HttpError("User is already enrolled in this test series.", 409);
    }

    const newEnrollment = await UserTestSeries.create({ userId, testSeriesId });
    return newEnrollment;
};

export const getEnrolledTestSeriesForUser = async ({ userId }: { userId: string }) => {
    const enrollments = await UserTestSeries.findAll({
        where: { userId },
        include: [{
            model: TestSeries,
            attributes: ['id', 'name', 'description','price']
        }]
    });
    return enrollments;
};

export const unenrollUserFromTestSeries = async ({ userId, testSeriesId }: { userId: string, testSeriesId: string }) => {
    const result = await UserTestSeries.destroy({
        where: { userId, testSeriesId }
    });

    if (result === 0) {
        throw new HttpError("Enrollment record not found.", 404);
    }

    return true;
};

export const updateTestSeriesEnrollmentStatus = async ({ userId, testSeriesId, status }: UpdateTestSeriesEnrollmentParams) => {
    const enrollment = await UserTestSeries.findOne({
        where: { userId, testSeriesId }
    });

    if (!enrollment) {
        throw new HttpError("Enrollment record not found.", 404);
    }

    (enrollment as any).status = status;
    await enrollment.save();
    return enrollment;
};
