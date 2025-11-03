"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateWebinarEnrollmentStatus = exports.unenrollFromWebinar = exports.getUserWebinars = exports.enrollInWebinar = void 0;
const UserWebinarService = __importStar(require("../services/userWebinar.service")); // Assuming your webinar service is here
const types_1 = require("../utils/types"); // Import the enum for type checking
/**
 * Controller function to handle enrolling a user in a webinar.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The Express next middleware function.
 */
const enrollInWebinar = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, webinarId } = req.body;
        // Validate required fields
        if (!userId || !webinarId) {
            return res.status(400).json({ success: false, message: 'User ID and Webinar ID are required.' });
        }
        // Call the service function to enroll the user
        const enrollment = yield UserWebinarService.enrollUserInWebinar({ userId, webinarId });
        // Respond with success message and the new enrollment data
        res.status(201).json({ success: true, message: 'User enrolled in webinar successfully.', data: enrollment });
    }
    catch (error) {
        // Pass any errors to the next middleware (error handler)
        next(error);
    }
});
exports.enrollInWebinar = enrollInWebinar;
/**
 * Controller function to handle fetching all webinars a user is enrolled in.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The Express next middleware function.
 */
const getUserWebinars = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params; // Assuming userId comes from URL params
        // Call the service function to get enrolled webinars
        const webinars = yield UserWebinarService.getEnrolledWebinarsForUser({ userId });
        // Respond with success and the list of webinars
        res.status(200).json({ success: true, data: webinars });
    }
    catch (error) {
        // Pass any errors to the next middleware (error handler)
        next(error);
    }
});
exports.getUserWebinars = getUserWebinars;
/**
 * Controller function to handle unenrolling a user from a webinar.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The Express next middleware function.
 */
const unenrollFromWebinar = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, webinarId } = req.body;
        // Validate required fields
        if (!userId || !webinarId) {
            return res.status(400).json({ success: false, message: 'User ID and Webinar ID are required.' });
        }
        // Call the service function to unenroll the user
        yield UserWebinarService.unenrollUserFromWebinar({ userId, webinarId });
        // Respond with success message
        res.status(200).json({ success: true, message: 'User unenrolled from webinar successfully.' });
    }
    catch (error) {
        // Pass any errors to the next middleware (error handler)
        next(error);
    }
});
exports.unenrollFromWebinar = unenrollFromWebinar;
/**
 * Controller function to handle updating the enrollment status of a user in a webinar.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The Express next middleware function.
 */
const updateWebinarEnrollmentStatus = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, webinarId, status } = req.body;
        // Validate required fields
        if (!userId || !webinarId || !status) {
            return res.status(400).json({ success: false, message: 'User ID, Webinar ID, and a new status are required.' });
        }
        // Optional: Validate if the provided status is a valid enum value
        if (!Object.values(types_1.WebinarEnrollmentStatus).includes(status)) {
            return res.status(400).json({ success: false, message: `Invalid status provided. Must be one of: ${Object.values(types_1.WebinarEnrollmentStatus).join(', ')}` });
        }
        // Call the service function to update the enrollment status
        const updatedEnrollment = yield UserWebinarService.updateWebinarEnrollmentStatus({ userId, webinarId, status });
        // Respond with success message and the updated enrollment data
        res.status(200).json({ success: true, message: 'Webinar enrollment status updated successfully.', data: updatedEnrollment });
    }
    catch (error) {
        // Pass any errors to the next middleware (error handler)
        next(error);
    }
});
exports.updateWebinarEnrollmentStatus = updateWebinarEnrollmentStatus;
