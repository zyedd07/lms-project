"use strict";
// src/controllers/webinar.controller.ts
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
exports.getJitsiDetailsController = exports.deleteWebinarController = exports.updateWebinarController = exports.getWebinarByIdController = exports.getAllWebinarsController = exports.createWebinarController = void 0;
const httpError_1 = __importDefault(require("../utils/httpError"));
const constants_1 = require("../utils/constants"); // Assuming Role enum is defined here
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const webinar_model_1 = __importDefault(require("../models/webinar.model"));
const webinar_services_1 = require("../services/webinar.services");
const types_1 = require("../utils/types");
// --- IMPORTANT: CONFIGURE YOUR JITSI AS A SERVICE (JaaS) CREDENTIALS ---
// These values MUST be set as environment variables on your Render deployment.
// For local development, you'd typically use a .env file and 'dotenv' package.
const JITSI_JAS_APP_ID = process.env.JITSI_JAS_APP_ID;
const JITSI_JAS_API_KEY_ID = process.env.JITSI_JAS_API_KEY_ID;
const JITSI_JAS_PRIVATE_KEY = process.env.JITSI_JAS_PRIVATE_KEY;
// CRITICAL CHECK: Ensure JaaS credentials are loaded at runtime
if (!JITSI_JAS_APP_ID || !JITSI_JAS_API_KEY_ID || !JITSI_JAS_PRIVATE_KEY) {
    console.error("CRITICAL ERROR: Jitsi JaaS credentials (APP_ID, API_KEY_ID, PRIVATE_KEY) are not loaded from environment variables.");
    console.error("Please set them correctly on Render or in your local .env file.");
    // In a production app, you might want to throw an error here or prevent the app from starting:
    // process.exit(1);
}
const JITSI_JAS_BASE_URL = 'https://8x8.vc/'; // The base URL for 8x8 JaaS
/**
 * Helper function to generate a Jitsi JWT.
 * @param {string} roomName - The specific Jitsi room name (from webinar.jitsiRoomName).
 * @param {string} userId - The unique ID of the user joining the meeting.
 * @param {string} userName - The display name of the user.
 * @param {string} userEmail - The email of the user.
 * @param {boolean} isModerator - True if the user should have moderator privileges.
 * @returns {string} The signed JWT.
 */
const generateJitsiJwt = (roomName, userId, userName, userEmail, isModerator = false) => {
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const expiration = now + (60 * 60); // Token valid for 1 hour (adjust lifetime as needed)
    const payload = {
        iss: "chat", // Issuer for Jitsi (usually 'chat' for JaaS)
        aud: "jitsi", // Audience
        exp: expiration, // Expiration time (seconds since epoch)
        nbf: now, // Not Before time
        iat: now, // Issued At time
        sub: JITSI_JAS_APP_ID, // Your JaaS App ID
        context: {
            features: {
                livestreaming: true, // As specified in your provided code
                outbound_call: false,
                sip_outbound_call: false,
                transcription: false,
                recording: false, // Set to true if you want to allow recording for this user/room
            },
            user: {
                hidden_from_recorder: false,
                moderator: isModerator, // Set to true for hosts/presenters
                name: userName, // Use the provided userName (will be email)
                id: userId,
                avatar: '', // Optional URL to user's avatar image
                email: userEmail,
            },
        },
        room: roomName, // The specific Jitsi room name for this webinar
    };
    const token = jsonwebtoken_1.default.sign(payload, JITSI_JAS_PRIVATE_KEY, {
        algorithm: 'RS256', // Algorithm directly in options
        header: {
            kid: JITSI_JAS_API_KEY_ID,
            alg: 'RS256' // alg MUST be in header too for some JWT libraries/implementations
        }
    });
    return token;
};
/**
 * Controller to create a new webinar.
 * Accessible only by ADMIN role.
 */
const createWebinarController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (role !== constants_1.Role.ADMIN) {
            throw new httpError_1.default('Unauthorized: Only admins can create webinars', 403);
        }
        const { title, speaker, date, time, imageUrl, status, jitsiRoomName, price } = req.body;
        // Basic validation for required fields
        if (!title || !speaker || !date || !time || !jitsiRoomName || price === undefined || price === null) {
            throw new httpError_1.default('Please provide title, speaker, date, time, jitsiRoomName, and price.', 400);
        }
        // Optional validation for status if it's provided and needs to be one of the enum values
        if (status && !Object.values(types_1.WebinarStatus).includes(status)) {
            throw new httpError_1.default(`Invalid status value. Must be one of "${Object.values(types_1.WebinarStatus).join(', ')}".`, 400);
        }
        const newWebinar = yield (0, webinar_services_1.createWebinarService)({
            title,
            speaker,
            date,
            time,
            imageUrl,
            status,
            jitsiRoomName,
            price
        });
        res.status(201).json({
            success: true,
            message: 'Webinar created successfully',
            data: newWebinar
        });
    }
    catch (error) {
        next(error);
    }
});
exports.createWebinarController = createWebinarController;
/**
 * Controller to get all webinars.
 * Can apply filters (e.g., by status) and pagination.
 */
const getAllWebinarsController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, limit, offset } = req.query;
        // Prepare parameters for the service
        const params = {};
        if (status && Object.values(types_1.WebinarStatus).includes(status)) {
            params.status = status; // Filter by status if provided and valid
        }
        // Prepare filters for pagination
        const filters = {};
        if (limit) {
            filters.limit = parseInt(limit, 10);
        }
        if (offset) {
            filters.offset = parseInt(offset, 10);
        }
        const webinars = yield (0, webinar_services_1.getAllWebinarsService)(params, filters);
        res.status(200).json({
            success: true,
            data: webinars
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getAllWebinarsController = getAllWebinarsController;
/**
 * Controller to get a single webinar by its ID.
 */
const getWebinarByIdController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id) {
            throw new httpError_1.default('Webinar ID is required in URL parameters', 400);
        }
        const webinar = yield (0, webinar_services_1.getWebinarByIdService)(id);
        if (!webinar) {
            throw new httpError_1.default('Webinar not found', 404);
        }
        res.status(200).json({
            success: true,
            data: webinar
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getWebinarByIdController = getWebinarByIdController;
/**
 * Controller to update an existing webinar.
 * Accessible only by ADMIN role.
 */
const updateWebinarController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (role !== constants_1.Role.ADMIN) {
            throw new httpError_1.default('Unauthorized: Only admins can update webinars', 403);
        }
        const { id } = req.params;
        if (!id) {
            throw new httpError_1.default('Webinar ID is required in URL parameters', 400);
        }
        // Destructure all possible update fields including price and status
        const { title, speaker, date, time, imageUrl, status, jitsiRoomName, price } = req.body;
        const updateData = {
            title, speaker, date, time, imageUrl, status, jitsiRoomName, price
        };
        // Remove undefined values to avoid updating fields with 'undefined'
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                delete updateData[key];
            }
        });
        // Ensure at least one field is provided for update
        if (Object.keys(updateData).length === 0) {
            throw new httpError_1.default('No update data provided', 400);
        }
        // Optional validation for status if it's provided and needs to be one of the enum values
        if (updateData.status && !Object.values(types_1.WebinarStatus).includes(updateData.status)) {
            throw new httpError_1.default(`Invalid status value. Must be one of "${Object.values(types_1.WebinarStatus).join(', ')}".`, 400);
        }
        const updatedWebinar = yield (0, webinar_services_1.updateWebinarService)(id, updateData);
        if (!updatedWebinar) {
            throw new httpError_1.default('Webinar not found or no changes applied', 404);
        }
        res.status(200).json({
            success: true,
            message: 'Webinar updated successfully',
            data: updatedWebinar
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateWebinarController = updateWebinarController;
/**
 * Controller to delete a webinar by its ID.
 * Accessible only by ADMIN role.
 */
const deleteWebinarController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (role !== constants_1.Role.ADMIN) {
            throw new httpError_1.default('Unauthorized: Only admins can delete webinars', 403);
        }
        const { id } = req.params;
        if (!id) {
            throw new httpError_1.default('Webinar ID is required in URL parameters', 400);
        }
        const response = yield (0, webinar_services_1.deleteWebinarService)(id);
        res.status(200).json(Object.assign({ success: true }, response // Contains { message: 'Webinar deleted successfully' }
        ));
    }
    catch (error) {
        next(error);
    }
});
exports.deleteWebinarController = deleteWebinarController;
/**
 * Controller to get Jitsi meeting details for a specific webinar.
 * Fetches webinar details and generates a Jitsi JWT.
 * It's recommended to protect this endpoint with authentication.
 */
const getJitsiDetailsController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { id } = req.params;
        // --- IMPORTANT: Get current authenticated user details ---
        // Assuming your 'isAuth' middleware populates req.user.
        // Use 'email' for userName as there's no 'name' field on the user object.
        const currentUserId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'anonymous_participant';
        const currentUserName = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.email) || 'Guest User'; // FIX: Changed from 'name' to 'email'
        const currentUserEmail = ((_c = req.user) === null || _c === void 0 ? void 0 : _c.email) || 'guest@example.com';
        // Logic to determine if the current user is a moderator for *this specific webinar*.
        const isModerator = ((_d = req.user) === null || _d === void 0 ? void 0 : _d.role) === constants_1.Role.ADMIN; // Example: only admins are moderators
        const webinar = yield webinar_model_1.default.findByPk(id);
        if (!webinar) {
            throw new httpError_1.default('Webinar not found.', 404);
        }
        // Optional: Add logic to restrict access based on webinar status or user's payment/registration.
        if (webinar.status === types_1.WebinarStatus.RECORDED) {
            throw new httpError_1.default('This webinar is already recorded and cannot be joined live.', 403);
        }
        // If you only want 'live' status to allow joining, add:
        // if (webinar.status !== WebinarStatus.LIVE && !isModerator) { // Allow moderators to join upcoming for setup
        //     throw new HttpError('This webinar is not currently live.', 403);
        // }
        const jitsiRoomName = webinar.jitsiRoomName;
        // Generate the JWT for this specific room and user
        const jitsiJwt = generateJitsiJwt(jitsiRoomName, currentUserId, currentUserName, currentUserEmail, isModerator);
        // Construct the full Jitsi meeting URL for the React Native SDK
        // Format: https://8x8.vc/APP_ID/ROOM_NAME?jwt=JWT_TOKEN
        const jitsiMeetingUrl = `${JITSI_JAS_BASE_URL}${JITSI_JAS_APP_ID}/${jitsiRoomName}?jwt=${jitsiJwt}`;
        res.json({
            success: true, // Standard response format
            jitsiMeetingUrl: jitsiMeetingUrl,
            jwt: jitsiJwt, // Provide JWT separately as well for clarity/alternative use
            roomName: jitsiRoomName,
            webinarTitle: webinar.title,
        });
    }
    catch (error) {
        next(error); // Pass error to the error handling middleware
    }
});
exports.getJitsiDetailsController = getJitsiDetailsController;
