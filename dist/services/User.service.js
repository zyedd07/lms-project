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
exports.deleteUserService = exports.updateUserService = exports.getUsersService = exports.loginUserService = exports.createUserService = void 0;
const User_model_1 = __importDefault(require("../models/User.model"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const httpError_1 = __importDefault(require("../utils/httpError"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Assuming you have a User model with Sequelize-like methods like .update(), .destroy()
// Removed UpdateUserServiceParams interface definition as per request.
// Type assertion will handle property checks for 'user' object in updateUserService.
const createUserService = (_a) => __awaiter(void 0, [_a], void 0, function* ({ name, email, phone, password }) {
    try {
        const salt = yield bcryptjs_1.default.genSalt(10);
        const passwordHash = yield bcryptjs_1.default.hash(password, salt);
        const newUser = yield User_model_1.default.create({
            name,
            email,
            password: passwordHash,
            phone,
            role: 'student', // Default role for new sign-ups
        });
        return newUser;
    }
    catch (error) {
        throw error;
    }
});
exports.createUserService = createUserService;
const loginUserService = (_a) => __awaiter(void 0, [_a], void 0, function* ({ email, password }) {
    try {
        const user = yield User_model_1.default.findOne({
            where: { email },
        });
        if (!user) {
            throw new httpError_1.default("User does not exist", 400);
        }
        const isPasswordMatch = yield bcryptjs_1.default.compare(password, user.get("password"));
        if (!isPasswordMatch) {
            throw new httpError_1.default("Invalid password", 400);
        }
        const SECRET_KEY = process.env.SECRET_KEY || 'cleanclean';
        const userRole = user.get("role");
        const userSessionData = {
            id: user.get("id"),
            name: user.get("name"),
            email: user.get("email"),
            role: userRole,
        };
        const token = jsonwebtoken_1.default.sign(userSessionData, SECRET_KEY, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
        return {
            user: userSessionData,
            token,
        };
    }
    catch (error) {
        throw error;
    }
});
exports.loginUserService = loginUserService;
const getUsersService = (email) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (email) {
            const user = yield User_model_1.default.findOne({
                where: { email },
            });
            if (!user) {
                throw new httpError_1.default("User does not exist", 400);
            }
            return user;
        }
        else {
            const users = yield User_model_1.default.findAll(); // This fetches all users
            return users;
        }
    }
    catch (error) {
        throw error;
    }
});
exports.getUsersService = getUsersService;
// --- New Service Functions for User Management ---
/**
 * Updates a user's profile based on their ID.
 * @param id The ID of the user to update.
 * @param updates An object containing the fields to update (e.g., name, email, phone, role).
 * @returns The updated user object.
 * @throws HttpError if the user is not found or if there's a validation error.
 */
const updateUserService = (id, updates) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Explicitly assert the type of the user to include its expected properties
        // Changed `User` to `InstanceType<typeof User>` to correctly refer to the instance type.
        const user = yield User_model_1.default.findByPk(id);
        if (!user) {
            throw new httpError_1.default("User not found", 404);
        }
        // Apply updates
        // Note: For sensitive fields like 'password', you'd typically have a separate
        // dedicated service/endpoint with proper password hashing.
        if (updates.name !== undefined)
            user.name = updates.name;
        if (updates.email !== undefined)
            user.email = updates.email;
        if (updates.phone !== undefined)
            user.phone = updates.phone;
        if (updates.role !== undefined)
            user.role = updates.role;
        yield user.save(); // Save the updated user to the database
        return user;
    }
    catch (error) {
        console.error("Error in updateUserService:", error);
        throw error; // Re-throw to be caught by the controller
    }
});
exports.updateUserService = updateUserService;
/**
 * Deletes a user from the database by their ID.
 * @param id The ID of the user to delete.
 * @returns true if the user was successfully deleted.
 * @throws HttpError if the user is not found.
 */
const deleteUserService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield User_model_1.default.destroy({
            where: { id },
        });
        if (result === 0) {
            throw new httpError_1.default("User not found", 404);
        }
        return true; // Indicate successful deletion
    }
    catch (error) {
        console.error("Error in deleteUserService:", error);
        throw error; // Re-throw to be caught by the controller
    }
});
exports.deleteUserService = deleteUserService;
