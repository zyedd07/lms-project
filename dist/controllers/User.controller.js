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
exports.deleteUser = exports.updateUser = exports.getAllUsers = exports.getUser = exports.loginUser = exports.getLoggedInUser = exports.createUser = void 0;
const httpError_1 = __importDefault(require("../utils/httpError"));
const User_service_1 = require("../services/User.service"); // Added updateUserService, deleteUserService
const createUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password, phone } = req.body;
        if (!name || !email || !password || !phone) {
            throw new httpError_1.default("Please provide all required fields", 400);
        }
        const newUser = yield (0, User_service_1.createUserService)({ name, email, password, phone });
        res.status(201).json(newUser);
    }
    catch (error) {
        next(error);
    }
});
exports.createUser = createUser;
const getLoggedInUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated.' });
        }
        // req.user is populated by the 'isAuth' middleware from the token payload
        return res.status(200).json({
            message: 'User profile fetched successfully',
            user: {
                id: req.user.id,
                email: req.user.email,
                role: req.user.role,
                phone: req.user.phone, // Assuming username is also in your token payload
                // Add any other user properties you want to send to the frontend
            }
        });
    }
    catch (error) {
        console.error("Error fetching logged-in user profile:", error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
});
exports.getLoggedInUser = getLoggedInUser;
const loginUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            throw new httpError_1.default("Please provide both email and password", 400);
        }
        const response = yield (0, User_service_1.loginUserService)({ email, password });
        res.status(200).json(response);
    }
    catch (error) {
        next(error);
    }
});
exports.loginUser = loginUser;
// Controller to get a single user by email (existing functionality)
const getUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const email = req.params.email;
        const user = yield (0, User_service_1.getUsersService)(email);
        res.status(200).json(user);
    }
    catch (error) {
        next(error);
    }
});
exports.getUser = getUser;
const getAllUsers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Calling getUsersService without an email parameter fetches all users
        const users = yield (0, User_service_1.getUsersService)();
        res.status(200).json({ success: true, data: users });
    }
    catch (error) {
        console.error("Error in getAllUsers:", error);
        next(new httpError_1.default("Failed to fetch all users", 500)); // Pass error to Express error handler
    }
});
exports.getAllUsers = getAllUsers;
const updateUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params; // Get user ID from URL parameters
        const updates = req.body; // Get update data from request body
        // Basic validation for updates
        if (Object.keys(updates).length === 0) {
            throw new httpError_1.default("No update data provided", 400);
        }
        // Call the update service with the user ID and the updates
        const updatedUser = yield (0, User_service_1.updateUserService)(id, updates);
        res.status(200).json({ success: true, message: "User updated successfully", data: updatedUser });
    }
    catch (error) {
        console.error("Error in updateUser:", error);
        next(error); // Pass the error to the Express error handler
    }
});
exports.updateUser = updateUser;
const deleteUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params; // Get user ID from URL parameters
        // Call the delete service with the user ID
        yield (0, User_service_1.deleteUserService)(id);
        res.status(200).json({ success: true, message: "User deleted successfully" });
    }
    catch (error) {
        console.error("Error in deleteUser:", error);
        next(error); // Pass the error to the Express error handler
    }
});
exports.deleteUser = deleteUser;
