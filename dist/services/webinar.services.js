"use strict";
// src/services/webinar.service.ts
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
exports.deleteWebinarService = exports.updateWebinarService = exports.getAllWebinarsService = exports.getWebinarByIdService = exports.createWebinarService = void 0;
const webinar_model_1 = __importDefault(require("../models/webinar.model")); // Import your Webinar model
const httpError_1 = __importDefault(require("../utils/httpError")); // Assuming HttpError is defined in this path
/**
 * Creates a new webinar in the database.
 * @param params The data for the new webinar.
 * @returns A promise that resolves to the newly created Webinar instance (typed as any).
 * @throws {HttpError} If a webinar with the same Jitsi room name already exists.
 */
const createWebinarService = (params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Ensure jitsiRoomName is unique before creation
        const existingWebinar = yield webinar_model_1.default.findOne({ where: { jitsiRoomName: params.jitsiRoomName } });
        if (existingWebinar) {
            throw new httpError_1.default('Webinar with this Jitsi room name already exists.', 400);
        }
        const newWebinar = yield webinar_model_1.default.create(Object.assign(Object.assign({}, params), { 
            // Ensure status is correctly set, defaulting to 'upcoming' if not provided
            status: params.status || 'upcoming', 
            // Ensure price is a number, defaulting to 0 if not provided or invalid
            price: typeof params.price === 'number' ? params.price : 0 }));
        return newWebinar;
    }
    catch (error) {
        console.error("Error in createWebinarService:", error);
        throw error; // Re-throw the HttpError or any other caught error
    }
});
exports.createWebinarService = createWebinarService;
/**
 * Fetches a single webinar by its ID.
 * @param id The UUID of the webinar to fetch.
 * @returns A promise that resolves to a Webinar instance (typed as any) or null if not found.
 */
const getWebinarByIdService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const webinar = yield webinar_model_1.default.findByPk(id); // Explicitly cast to 'any'
        if (!webinar) {
            return null;
        }
        return webinar;
    }
    catch (error) {
        console.error(`Error in getWebinarByIdService (ID: ${id}):`, error);
        throw error;
    }
});
exports.getWebinarByIdService = getWebinarByIdService;
/**
 * Fetches all webinars from the database.
 * @param params Optional parameters for filtering by status.
 * @param filters Optional pagination filters (limit, offset).
 * @returns A promise that resolves to an array of Webinar instances (typed as any).
 */
const getAllWebinarsService = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (params = {}, filters) {
    try {
        let whereClause = {};
        // Filter by status if provided in params
        if (params.status) {
            whereClause.status = params.status;
        }
        const webinars = yield webinar_model_1.default.findAll({
            where: whereClause,
            limit: filters === null || filters === void 0 ? void 0 : filters.limit,
            offset: filters === null || filters === void 0 ? void 0 : filters.offset,
            // include: [], // Add includes if you have associations (e.g., with Speakers or Categories)
        });
        return webinars;
    }
    catch (error) {
        console.error("Error in getAllWebinarsService:", error);
        throw error;
    }
});
exports.getAllWebinarsService = getAllWebinarsService;
/**
 * Updates an existing webinar in the database.
 * @param id The UUID of the webinar to update.
 * @param params The data to update the webinar with.
 * @returns A promise that resolves to the updated Webinar instance (typed as any) or null if not found.
 * @throws {HttpError} If the webinar is not found or if the Jitsi room name is already in use.
 */
const updateWebinarService = (id, params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const webinar = yield webinar_model_1.default.findByPk(id); // Explicitly cast to 'any'
        if (!webinar) {
            throw new httpError_1.default('Webinar not found', 404);
        }
        // Check if jitsiRoomName is being updated and if it's unique to another webinar
        if (params.jitsiRoomName && params.jitsiRoomName !== webinar.jitsiRoomName) {
            const existingWebinarWithSameRoomName = yield webinar_model_1.default.findOne({
                where: { jitsiRoomName: params.jitsiRoomName }
            });
            if (existingWebinarWithSameRoomName && existingWebinarWithSameRoomName.id !== webinar.id) {
                throw new httpError_1.default('Jitsi room name already in use by another webinar.', 400);
            }
        }
        // Prepare data for update, ensuring price is handled correctly
        const dataToUpdate = Object.assign({}, params);
        if (typeof params.price === 'string') {
            dataToUpdate.price = parseFloat(params.price); // Convert string price to number if it came as string
        }
        else if (typeof params.price === 'number') {
            dataToUpdate.price = params.price;
        }
        yield webinar.update(dataToUpdate);
        return webinar;
    }
    catch (error) {
        console.error(`Error in updateWebinarService (ID: ${id}):`, error);
        throw error;
    }
});
exports.updateWebinarService = updateWebinarService;
/**
 * Deletes a webinar from the database by its ID.
 * @param id The UUID of the webinar to delete.
 * @returns A promise that resolves to an object indicating success.
 * @throws {HttpError} If the webinar is not found.
 */
const deleteWebinarService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deletedRowCount = yield webinar_model_1.default.destroy({ where: { id } });
        if (deletedRowCount === 0) {
            throw new httpError_1.default('Webinar not found', 404);
        }
        return { message: 'Webinar deleted successfully' };
    }
    catch (error) {
        console.error(`Error in deleteWebinarService (ID: ${id}):`, error);
        throw error;
    }
});
exports.deleteWebinarService = deleteWebinarService;
