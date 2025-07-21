import UserQbank from '../models/UserQbank.model';
import Qbank from '../models/QuestionBank.model';
import HttpError from '../utils/httpError';
import { EnrollInQbankServiceParams, UnenrollFromQbankServiceParams, GetUserEnrolledQbanksParams, UpdateQbankEnrollmentParams } from '../utils/types';

export const enrollUserInQbank = async ({ userId, qbankId }: EnrollInQbankServiceParams) => {
    const existingEnrollment = await UserQbank.findOne({
        where: { userId, qbankId }
    });

    if (existingEnrollment) {
        throw new HttpError("User is already enrolled in this Q-Bank.", 409);
    }

    const newEnrollment = await UserQbank.create({ userId, qbankId });
    return newEnrollment;
};

export const getEnrolledQbanksForUser = async ({ userId }: GetUserEnrolledQbanksParams) => {
    const enrollments = await UserQbank.findAll({
        where: { userId },
        include: [{
            model: Qbank,
            attributes: ['id', 'name', 'description','price','filePath']
        }]
    });
    return enrollments;
};

export const unenrollUserFromQbank = async ({ userId, qbankId }: UnenrollFromQbankServiceParams) => {
    const result = await UserQbank.destroy({
        where: { userId, qbankId }
    });

    if (result === 0) {
        throw new HttpError("Enrollment record not found.", 404);
    }

    return true;
};

export const updateQbankEnrollmentStatus = async ({ userId, qbankId, status }: UpdateQbankEnrollmentParams) => {
    const enrollment = await UserQbank.findOne({
        where: { userId, qbankId }
    });

    if (!enrollment) {
        throw new HttpError("Enrollment record not found.", 404);
    }

    (enrollment as any).status = status;
    await enrollment.save();
    return enrollment;
};
