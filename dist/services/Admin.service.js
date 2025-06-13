"use strict";
// src/services/Admin.service.ts
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
exports.loginAdminService = exports.createAdminService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken")); // Import SignOptions from jsonwebtoken
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const Admin_model_1 = __importDefault(require("../models/Admin.model")); // Ensure correct import path and type definition for Admin model
const httpError_1 = __importDefault(require("../utils/httpError"));
const createAdminService = (_a) => __awaiter(void 0, [_a], void 0, function* ({ name, email, password }) {
    try {
        const salt = yield bcryptjs_1.default.genSalt(10);
        const passwordHash = yield bcryptjs_1.default.hash(password, salt);
        const newAdmin = yield Admin_model_1.default.create({
            name,
            email,
            password: passwordHash,
            // role: Role.ADMIN, // Example: explicitly set default role for new admins if applicable here
        });
        return newAdmin;
    }
    catch (error) {
        throw error;
    }
});
exports.createAdminService = createAdminService;
const loginAdminService = (_a) => __awaiter(void 0, [_a], void 0, function* ({ email, password }) {
    try {
        console.log(`[AdminService] Searching for admin with email: ${email}`);
        const admin = yield Admin_model_1.default.findOne({ where: { email } });
        if (!admin) {
            console.log(`[AdminService] Admin not found for email: ${email}`);
            throw new httpError_1.default("Invalid credentials", 401);
        }
        console.log(`[AdminService] Admin found. ID: ${admin.get("id")}, Name: ${admin.get("name")}`);
        console.log(`[AdminService] Admin's role from DB (raw): ${admin.get("role")}`);
        // Casting admin.get("password") to string as bcrypt.compare expects string
        const isPasswordMatch = yield bcryptjs_1.default.compare(password, admin.get("password"));
        if (!isPasswordMatch) {
            console.log(`[AdminService] Password mismatch for email: ${email}`);
            throw new httpError_1.default("Invalid password", 400);
        }
        console.log(`[AdminService] Password matched for email: ${email}`);
        // Ensure SECRET_KEY is always a string. If process.env.SECRET_KEY is undefined, 'cleanclean' is used.
        const SECRET_KEY = process.env.SECRET_KEY || 'cleanclean';
        // Ensure userRole is correctly typed based on your RoleValue enum/type
        const userRole = admin.get("role");
        console.log(`[AdminService] userRole (after casting to RoleValue): ${userRole}`);
        console.log(`[AdminService] Type of userRole: ${typeof userRole}`);
        const userSessionData = {
            id: admin.get("id"),
            name: admin.get("name"),
            email: admin.get("email"),
            role: userRole
        };
        console.log(`[AdminService] userSessionData before JWT:`, userSessionData);
        // FIX: Explicitly type the options object as SignOptions
        const jwtOptions = {
            // Calculate 7 days in seconds. You can adjust this value as needed.
            expiresIn: 604800 // 7 days in seconds (7 * 24 * 60 * 60)
        };
        const token = jsonwebtoken_1.default.sign(userSessionData, SECRET_KEY, jwtOptions);
        console.log(`[AdminService] Token generated. Returning response.`);
        return {
            user: userSessionData,
            token,
            role: userRole
        };
    }
    catch (error) {
        console.error(`[AdminService] Service error caught:`, error);
        throw error;
    }
});
exports.loginAdminService = loginAdminService;
