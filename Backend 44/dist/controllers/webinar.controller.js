"use strict";
// src/controllers/webinar.controller.ts
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJitsiDetailsController = exports.deleteWebinarController = exports.updateWebinarController = exports.getWebinarByIdController = exports.getAllWebinarsController = exports.createWebinarController = void 0;
const httpError_1 = __importDefault(require("../utils/httpError"));
const constants_1 = require("../utils/constants");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const webinar_model_1 = __importDefault(require("../models/webinar.model")); // Ensure correct model import
const fs = __importStar(require("fs")); // Import Node.js File System module
const path = __importStar(require("path")); // Import Node.js Path module
const webinar_services_1 = require("../services/webinar.services");
const types_1 = require("../utils/types");
// --- IMPORTANT: CONFIGURE YOUR JITSI AS A SERVICE (JaaS) CREDENTIALS ---
// These values MUST be set as environment variables on your Render deployment.
const JITSI_JAS_APP_ID = process.env.JITSI_JAS_APP_ID;
const JITSI_JAS_API_KEY_ID = process.env.JITSI_JAS_API_KEY_ID;
// Define the path to your Jitsi private key file.
// In production on Render, this is where your "Secret File" will be mounted.
// For local development, adjust `path.join` if your file is somewhere else relative to `dist/controllers`.
const JITSI_PRIVATE_KEY_FILE_PATH = process.env.NODE_ENV === 'production'
    ? '/etc/secrets/jitsi_private_key.pem' // Render's default path for Secret Files
    : path.join(__dirname, '..', '..', 'jitsi_private_key.pem'); // Common local dev path if file is in project root
let jitsiPrivateKey; // Variable to hold the loaded private key content
// Load the Jitsi Private Key once when this controller file is imported.
// This ensures the key is available before any JWT generation attempts.
try {
    if (!fs.existsSync(JITSI_PRIVATE_KEY_FILE_PATH)) {
        // Fallback for local development or if the file isn't mounted as expected.
        // You might use a specific environment variable for the key locally.
        jitsiPrivateKey = process.env.JITSI_PRIVATE_KEY || ''; // Use a dedicated env var for local private key
        if (!jitsiPrivateKey) {
            console.error("CRITICAL ERROR: Jitsi Private Key (for JWT signing) is not loaded.");
            console.error(`Attempted to load from file: ${JITSI_PRIVATE_KEY_FILE_PATH} and env var: JITSI_PRIVATE_KEY.`);
            // In a production environment, you might want to prevent the app from starting:
            // process.exit(1);
        }
        else {
            console.log("[Jitsi Init] Jitsi Private Key loaded from environment variable (fallback for local).");
        }
    }
    else {
        jitsiPrivateKey = fs.readFileSync(JITSI_PRIVATE_KEY_FILE_PATH, 'utf8');
        console.log("[Jitsi Init] Jitsi Private Key loaded successfully from secret file.");
    }
}
catch (error) {
    console.error("[Jitsi Init] Error loading Jitsi Private Key:", error);
    // Throwing an error here prevents the application from starting if the key is missing.
    throw new Error("Failed to load Jitsi Private Key. Application cannot start.");
}
// CRITICAL CHECK for APP_ID and API_KEY_ID (these are still env vars)
if (!JITSI_JAS_APP_ID || !JITSI_JAS_API_KEY_ID) {
    console.error("CRITICAL ERROR: Jitsi JaaS credentials (APP_ID, API_KEY_ID) are not loaded from environment variables.");
    console.error("Please set them correctly on Render or in your local .env file.");
    // In a production app, you might want to throw an error here or prevent the app from starting:
    throw new Error("Missing Jitsi APP_ID or API_KEY_ID. Application cannot start.");
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
    if (!jitsiPrivateKey) {
        // This check ensures we don't try to sign if the key failed to load
        throw new httpError_1.default("Jitsi Private Key is not available for JWT generation.", 500);
    }
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
    const token = jsonwebtoken_1.default.sign(payload, jitsiPrivateKey, {
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
        // Destructure only the fields that are sent from the frontend.
        // jitsiRoomName is now generated by the service, so it's not in the request body.
        const { title, speaker, date, time, imageUrl, status, price } = req.body; // No 'jitsiRoomName' in destructuring here
        // Basic validation for required fields received from the frontend.
        if (!title || !speaker || !date || !time || price === undefined || price === null) {
            throw new httpError_1.default('Please provide title, speaker, date, time, status, and price.', 400);
        }
        // Optional validation for status if it's provided and needs to be one of the enum values
        if (status && !Object.values(types_1.WebinarStatus).includes(status)) {
            throw new httpError_1.default(`Invalid status value. Must be one of "${Object.values(types_1.WebinarStatus).join(', ')}".`, 400);
        }
        // Prepare the data object to send to the service.
        // Price needs to be parsed to a number as it might come as a string from forms.
        const webinarData = {
            title,
            speaker,
            date,
            time,
            imageUrl: imageUrl || '', // Ensure imageUrl is a string, even if empty
            status: status || types_1.WebinarStatus.UPCOMING, // Provide a default status if none is sent
            price: typeof price === 'string' ? parseFloat(price) : price
            // jitsiRoomName will be added by the service
        };
        // Pass the data to the service. The service will generate jitsiRoomName.
        const newWebinar = yield (0, webinar_services_1.createWebinarService)(webinarData);
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
        // Destructure all possible update fields
        const { title, speaker, date, time, imageUrl, status, jitsiRoomName, // Still include here for destructuring, but we'll remove it below
        price } = req.body;
        const updateData = {
            title, speaker, date, time, imageUrl, status, jitsiRoomName, price
        };
        // CRITICAL: Ensure jitsiRoomName is NEVER updated via this route
        delete updateData.jitsiRoomName;
        // Remove undefined values to avoid updating fields with 'undefined'
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                delete updateData[key];
            }
        });
        // Parse price to a number if it's provided and is a string
        if (typeof updateData.price === 'string') {
            updateData.price = parseFloat(updateData.price);
            if (isNaN(updateData.price)) {
                throw new httpError_1.default('Invalid price value provided.', 400);
            }
        }
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
        res.status(200).json(Object.assign({ success: true }, response));
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
        const webinarIdWithPrefix = req.params.id; // This will be "webinar-73837a502d49405baaf68fe02abec1ca"
        // --- CRITICAL FIX START ---
        // Strip the "webinar-" prefix to get the actual UUID
        const actualWebinarUuid = webinarIdWithPrefix.startsWith('webinar-')
            ? webinarIdWithPrefix.substring('webinar-'.length)
            : webinarIdWithPrefix; // If it doesn't start with 'webinar-', use it as is (for safety)
        // Optional: Add UUID validation here if you have a validator (e.g., 'uuid' library)
        // import { validate as isUuid } from 'uuid';
        // if (!isUuid(actualWebinarUuid)) {
        //     throw new HttpError('Invalid webinar ID format provided in URL.', 400);
        // }
        // --- CRITICAL FIX END ---
        // Now, use the `actualWebinarUuid` for your database query
        const webinar = yield webinar_model_1.default.findByPk(actualWebinarUuid);
        if (!webinar) {
            throw new httpError_1.default('Webinar not found.', 404);
        }
        // Prevent joining if the webinar is already recorded (this is good existing logic)
        if (webinar.status === types_1.WebinarStatus.RECORDED) {
            throw new httpError_1.default('This webinar is already recorded and cannot be joined live.', 403);
        }
        // Extract user details from the authenticated request or set defaults for guests
        const currentUserId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'anonymous_participant';
        const currentUserName = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.email) || 'Guest User'; // Using email as username
        const currentUserEmail = ((_c = req.user) === null || _c === void 0 ? void 0 : _c.email) || 'guest@example.com';
        // Determine if the current user is a moderator based on their role
        const isModerator = ((_d = req.user) === null || _d === void 0 ? void 0 : _d.role) === constants_1.Role.ADMIN; // Example: only admins are moderators
        const jitsiRoomName = webinar.jitsiRoomName; // This should be the pure UUID from your DB
        // Generate the JWT for the Jitsi meeting
        const jitsiJwt = generateJitsiJwt(jitsiRoomName, currentUserId, currentUserName, currentUserEmail, isModerator);
        // Construct the full Jitsi meeting URL
        const jitsiMeetingUrl = `${JITSI_JAS_BASE_URL}${JITSI_JAS_APP_ID}/${jitsiRoomName}?jwt=${jitsiJwt}`;
        res.json({
            success: true,
            jitsiMeetingUrl: jitsiMeetingUrl,
            jwt: jitsiJwt,
            roomName: jitsiRoomName,
            webinarTitle: webinar.title,
        });
    }
    catch (error) {
        // More robust error handling for UUID parsing or DB errors
        if (error instanceof httpError_1.default) {
            next(error); // Pass custom HttpErrors directly
        }
        else if (error instanceof Error && error.message.includes('invalid input syntax for type uuid')) {
            // Catch specific database errors if they indicate UUID format issues
            next(new httpError_1.default('Invalid webinar ID format provided.', 400));
        }
        else {
            console.error("Error in getJitsiDetailsController:", error); // Log unexpected errors
            next(new httpError_1.default('Internal server error when fetching Jitsi details.', 500));
        }
    }
});
exports.getJitsiDetailsController = getJitsiDetailsController;
