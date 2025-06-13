// src/controllers/webinar.controller.ts

import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import HttpError from "../utils/httpError";
import { Role } from "../utils/constants";
import jwt from 'jsonwebtoken';
import Webinar from "../models/webinar.model"; // Ensure correct model import
import * as fs from 'fs'; // Import Node.js File System module
import * as path from 'path'; // Import Node.js Path module

import {
    createWebinarService,
    getAllWebinarsService,
    getWebinarByIdService,
    updateWebinarService,
    deleteWebinarService,
} from "../services/webinar.services";

import {
    WebinarInput,
    GetAllWebinarServiceParams,
    GetWebinarFilters,
    WebinarStatus
} from "../utils/types";


// --- IMPORTANT: CONFIGURE YOUR JITSI AS A SERVICE (JaaS) CREDENTIALS ---
// These values MUST be set as environment variables on your Render deployment.

const JITSI_JAS_APP_ID: string = process.env.JITSI_JAS_APP_ID as string;
const JITSI_JAS_API_KEY_ID: string = process.env.JITSI_JAS_API_KEY_ID as string;

// REMOVE THE OLD PRIVATE KEY ENV VAR DIRECTLY:
// const JITSI_JAS_PRIVATE_KEY: string = process.env.JITSI_JAS_PRIVATE_KEY as string;

// Define the path to your Jitsi private key file.
// In production on Render, this is where your "Secret File" will be mounted.
// For local development, adjust `path.join` if your file is somewhere else relative to `dist/controllers`.
const JITSI_PRIVATE_KEY_FILE_PATH = process.env.NODE_ENV === 'production'
    ? '/etc/secrets/jitsi_private_key.pem' // Render's default path for Secret Files
    : path.join(__dirname, '..', '..', 'jitsi_private_key.pem'); // Common local dev path if file is in project root

let jitsiPrivateKey: string; // Variable to hold the loaded private key content

// Load the Jitsi Private Key once when this controller file is imported.
// This ensures the key is available before any JWT generation attempts.
try {
    if (!fs.existsSync(JITSI_PRIVATE_KEY_FILE_PATH)) {
        // Fallback for local development or if the file isn't mounted as expected.
        // You might use a specific environment variable for the key locally.
        jitsiPrivateKey = process.env.JITSI_PRIVATE_KEY || ''; // Use a dedicated env var for local private key
        if (!jitsiPrivateKey) {
            // This is the error you saw previously. Now it will only show if file *and* fallback env var are missing.
            console.error("CRITICAL ERROR: Jitsi Private Key (for JWT signing) is not loaded.");
            console.error(`Attempted to load from file: ${JITSI_PRIVATE_KEY_FILE_PATH} and env var: JITSI_PRIVATE_KEY.`);
            // In a production environment, you might want to prevent the app from starting:
            // process.exit(1);
        } else {
            console.log("[Jitsi Init] Jitsi Private Key loaded from environment variable (fallback for local).");
        }
    } else {
        jitsiPrivateKey = fs.readFileSync(JITSI_PRIVATE_KEY_FILE_PATH, 'utf8');
        console.log("[Jitsi Init] Jitsi Private Key loaded successfully from secret file.");
    }
} catch (error) {
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

const JITSI_JAS_BASE_URL: string = 'https://8x8.vc/'; // The base URL for 8x8 JaaS

/**
 * Helper function to generate a Jitsi JWT.
 * @param {string} roomName - The specific Jitsi room name (from webinar.jitsiRoomName).
 * @param {string} userId - The unique ID of the user joining the meeting.
 * @param {string} userName - The display name of the user.
 * @param {string} userEmail - The email of the user.
 * @param {boolean} isModerator - True if the user should have moderator privileges.
 * @returns {string} The signed JWT.
 */
const generateJitsiJwt = (
    roomName: string,
    userId: string,
    userName: string,
    userEmail: string,
    isModerator: boolean = false
): string => {
    if (!jitsiPrivateKey) {
        // This check ensures we don't try to sign if the key failed to load
        throw new HttpError("Jitsi Private Key is not available for JWT generation.", 500);
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

    const token = jwt.sign(payload, jitsiPrivateKey, { // *** IMPORTANT: Use jitsiPrivateKey here ***
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
export const createWebinarController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role;
        if (role !== Role.ADMIN) {
            throw new HttpError('Unauthorized: Only admins can create webinars', 403);
        }

        const {
            title,
            speaker,
            date,
            time,
            imageUrl,
            status,
            jitsiRoomName,
            price
        }: WebinarInput = req.body;

        // Basic validation for required fields
        if (!title || !speaker || !date || !time || !jitsiRoomName || price === undefined || price === null) {
            throw new HttpError('Please provide title, speaker, date, time, jitsiRoomName, and price.', 400);
        }

        // Optional validation for status if it's provided and needs to be one of the enum values
        if (status && !Object.values(WebinarStatus).includes(status)) {
            throw new HttpError(`Invalid status value. Must be one of "${Object.values(WebinarStatus).join(', ')}".`, 400);
        }

        const newWebinar = await createWebinarService({
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
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to get all webinars.
 * Can apply filters (e.g., by status) and pagination.
 */
export const getAllWebinarsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { status, limit, offset } = req.query;

        // Prepare parameters for the service
        const params: GetAllWebinarServiceParams = {};
        if (status && Object.values(WebinarStatus).includes(status as WebinarStatus)) {
            params.status = status as WebinarStatus; // Filter by status if provided and valid
        }

        // Prepare filters for pagination
        const filters: GetWebinarFilters = {};
        if (limit) {
            filters.limit = parseInt(limit as string, 10);
        }
        if (offset) {
            filters.offset = parseInt(offset as string, 10);
        }

        const webinars = await getAllWebinarsService(params, filters);

        res.status(200).json({
            success: true,
            data: webinars
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to get a single webinar by its ID.
 */
export const getWebinarByIdController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        if (!id) {
            throw new HttpError('Webinar ID is required in URL parameters', 400);
        }

        const webinar = await getWebinarByIdService(id);

        if (!webinar) {
            throw new HttpError('Webinar not found', 404);
        }

        res.status(200).json({
            success: true,
            data: webinar
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to update an existing webinar.
 * Accessible only by ADMIN role.
 */
export const updateWebinarController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role;
        if (role !== Role.ADMIN) {
            throw new HttpError('Unauthorized: Only admins can update webinars', 403);
        }

        const { id } = req.params;
        if (!id) {
            throw new HttpError('Webinar ID is required in URL parameters', 400);
        }

        // Destructure all possible update fields including price and status
        const {
            title,
            speaker,
            date,
            time,
            imageUrl,
            status,
            jitsiRoomName,
            price
        }: Partial<WebinarInput> = req.body;

        const updateData: Partial<WebinarInput> = {
            title, speaker, date, time, imageUrl, status, jitsiRoomName, price
        };

        // Remove undefined values to avoid updating fields with 'undefined'
        Object.keys(updateData).forEach(key => {
            if (updateData[key as keyof Partial<WebinarInput>] === undefined) {
                delete updateData[key as keyof Partial<WebinarInput>];
            }
        });

        // Ensure at least one field is provided for update
        if (Object.keys(updateData).length === 0) {
            throw new HttpError('No update data provided', 400);
        }

        // Optional validation for status if it's provided and needs to be one of the enum values
        if (updateData.status && !Object.values(WebinarStatus).includes(updateData.status)) {
            throw new HttpError(`Invalid status value. Must be one of "${Object.values(WebinarStatus).join(', ')}".`, 400);
        }

        const updatedWebinar = await updateWebinarService(id, updateData);

        if (!updatedWebinar) {
            throw new HttpError('Webinar not found or no changes applied', 404);
        }

        res.status(200).json({
            success: true,
            message: 'Webinar updated successfully',
            data: updatedWebinar
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to delete a webinar by its ID.
 * Accessible only by ADMIN role.
 */
export const deleteWebinarController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role;
        if (role !== Role.ADMIN) {
            throw new HttpError('Unauthorized: Only admins can delete webinars', 403);
        }

        const { id } = req.params;
        if (!id) {
            throw new HttpError('Webinar ID is required in URL parameters', 400);
        }

        const response = await deleteWebinarService(id);

        res.status(200).json({
            success: true,
            ...response
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to get Jitsi meeting details for a specific webinar.
 * Fetches webinar details and generates a Jitsi JWT.
 * It's recommended to protect this endpoint with authentication.
 */
export const getJitsiDetailsController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const currentUserId = req.user?.id || 'anonymous_participant';
        const currentUserName = req.user?.email || 'Guest User';
        const currentUserEmail = req.user?.email || 'guest@example.com';
        
        const isModerator = req.user?.role === Role.ADMIN;

        const webinar = await Webinar.findByPk(id);

        if (!webinar) {
            throw new HttpError('Webinar not found.', 404);
        }

        if (webinar.status === WebinarStatus.RECORDED) {
            throw new HttpError('This webinar is already recorded and cannot be joined live.', 403);
        }

        const jitsiRoomName = webinar.jitsiRoomName;

        const jitsiJwt = generateJitsiJwt(
            jitsiRoomName,
            currentUserId,
            currentUserName,
            currentUserEmail,
            isModerator
        );

        const jitsiMeetingUrl = `${JITSI_JAS_BASE_URL}${JITSI_JAS_APP_ID}/${jitsiRoomName}?jwt=${jitsiJwt}`;

        res.json({
            success: true,
            jitsiMeetingUrl: jitsiMeetingUrl,
            jwt: jitsiJwt,
            roomName: jitsiRoomName,
            webinarTitle: webinar.title,
        });

    } catch (error) {
        next(error);
    }
};