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
exports.deleteWebinarController = exports.updateWebinarController = exports.getWebinarByIdController = exports.getAllWebinarsController = exports.createWebinarController = void 0;
const httpError_1 = __importDefault(require("../utils/httpError"));
const constants_1 = require("../utils/constants"); // Assuming Role enum is defined here
const webinar_services_1 = require("../services/webinar.services"); // Import your webinar services
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
        const { title, speaker, date, time, imageUrl, status, // NEW: Include status from request body
        jitsiRoomName, price // NEW: Include price from request body
         } = req.body;
        // Basic validation for required fields
        if (!title || !speaker || !date || !time || !jitsiRoomName || price === undefined || price === null) {
            throw new httpError_1.default('Please provide title, speaker, date, time, jitsiRoomName, and price.', 400);
        }
        // Optional validation for status if it's provided and needs to be one of the enum values
        if (status && !['upcoming', 'live', 'recorded'].includes(status)) {
            throw new httpError_1.default('Invalid status value. Must be one of "upcoming", "live", or "recorded".', 400);
        }
        const newWebinar = yield (0, webinar_services_1.createWebinarService)({
            title,
            speaker,
            date,
            time,
            imageUrl,
            status, // Pass status to service
            jitsiRoomName,
            price // Pass price to service
        });
        res.status(201).json({
            success: true,
            message: 'Webinar created successfully',
            data: newWebinar
        });
    }
    catch (error) {
        next(error); // Pass error to the error handling middleware
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
        if (status && ['upcoming', 'live', 'recorded'].includes(status)) {
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
        const { title, speaker, date, time, imageUrl, status, // NEW: Include status from request body
        jitsiRoomName, price // NEW: Include price from request body
         } = req.body;
        const updateData = {
            title, speaker, date, time, imageUrl, status, jitsiRoomName, price
        };
        // Fix for TS7053: Assert key as a valid key of updateData
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) { // Explicitly cast key
                delete updateData[key]; // Explicitly cast key
            }
        });
        // Ensure at least one field is provided for update
        if (Object.keys(updateData).length === 0) {
            throw new httpError_1.default('No update data provided', 400);
        }
        // Optional validation for status if it's provided and needs to be one of the enum values
        if (updateData.status && !['upcoming', 'live', 'recorded'].includes(updateData.status)) {
            throw new httpError_1.default('Invalid status value. Must be one of "upcoming", "live", or "recorded".', 400);
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
