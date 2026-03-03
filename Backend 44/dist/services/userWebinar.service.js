"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateWebinarEnrollmentStatus = exports.unenrollUserFromWebinar = exports.getEnrolledWebinarsForUser = exports.enrollUserInWebinar = void 0;
const UserWebinar_model_1 = __importDefault(require("../models/UserWebinar.model"));
const webinar_model_1 = __importDefault(require("../models/webinar.model"));
const httpError_1 = __importDefault(require("../utils/httpError"));
/**
 * Enrolls a user in a specific webinar.
 * Throws an HttpError if the user is already enrolled.
 * @param {EnrollInWebinarServiceParams} { userId, webinarId } - The user ID and webinar ID.
 * @returns {Promise<UserWebinar>} The newly created user webinar enrollment record.
 */
const enrollUserInWebinar = (_a) => __awaiter(void 0, [_a], void 0, function* ({ userId, webinarId }) {
    // Check if the enrollment already exists
    const existingEnrollment = yield UserWebinar_model_1.default.findOne({
        where: { userId, webinarId }
    });
    if (existingEnrollment) {
        throw new httpError_1.default("User is already enrolled in this webinar.", 409); // 409 Conflict
    }
    // The status will default to 'active' or similar based on the UserWebinar model definition.
    const newEnrollment = yield UserWebinar_model_1.default.create({ userId, webinarId });
    return newEnrollment;
});
exports.enrollUserInWebinar = enrollUserInWebinar;
/**
 * Retrieves all webinars a specific user is enrolled in.
 * Includes details of the webinar from the Webinar model.
 * @param {GetUserEnrolledWebinarsParams} { userId } - The ID of the user.
 * @returns {Promise<UserWebinar[]>} A list of user webinar enrollment records with associated webinar details.
 */
const getEnrolledWebinarsForUser = (_a) => __awaiter(void 0, [_a], void 0, function* ({ userId }) {
    const enrollments = yield UserWebinar_model_1.default.findAll({
        where: { userId },
        include: [{
                model: webinar_model_1.default,
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
});
exports.getEnrolledWebinarsForUser = getEnrolledWebinarsForUser;
/**
 * Unenrolls a user from a specific webinar.
 * Throws an HttpError if the enrollment record is not found.
 * @param {UnenrollFromWebinarServiceParams} { userId, webinarId } - The user ID and webinar ID.
 * @returns {Promise<boolean>} True if the unenrollment was successful.
 */
const unenrollUserFromWebinar = (_a) => __awaiter(void 0, [_a], void 0, function* ({ userId, webinarId }) {
    const result = yield UserWebinar_model_1.default.destroy({
        where: { userId, webinarId }
    });
    if (result === 0) {
        throw new httpError_1.default("Webinar enrollment record not found.", 404);
    }
    return true;
});
exports.unenrollUserFromWebinar = unenrollUserFromWebinar;
/**
 * Updates the status of an existing webinar enrollment for a user.
 * Throws an HttpError if the enrollment record is not found.
 * @param {UpdateWebinarEnrollmentStatusParams} { userId, webinarId, status } - The user ID, webinar ID, and new status.
 * @returns {Promise<UserWebinar>} The updated user webinar enrollment record.
 */
const updateWebinarEnrollmentStatus = (_a) => __awaiter(void 0, [_a], void 0, function* ({ userId, webinarId, status }) {
    const enrollment = yield UserWebinar_model_1.default.findOne({
        where: { userId, webinarId }
    });
    if (!enrollment) {
        throw new httpError_1.default("Webinar enrollment record not found.", 404);
    }
    enrollment.status = status;
    yield enrollment.save();
    return enrollment;
});
exports.updateWebinarEnrollmentStatus = updateWebinarEnrollmentStatus;
