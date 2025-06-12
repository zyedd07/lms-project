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
exports.loginAdminService = exports.createAdminService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const Admin_model_1 = __importDefault(require("../models/Admin.model"));
const httpError_1 = __importDefault(require("../utils/httpError"));
const createAdminService = (_a) => __awaiter(void 0, [_a], void 0, function* ({ name, email, password }) {
    try {
        const salt = yield bcryptjs_1.default.genSalt(10);
        const passwordHash = yield bcryptjs_1.default.hash(password, salt);
        const newAdmin = yield Admin_model_1.default.create({
            name,
            email,
            password: passwordHash,
            // If you create admin users via this service, and want to assign a role:
            // role: Role.ADMIN, // Example: explicitly set default role for new admins
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
        console.log(`[AdminService] Searching for admin with email: ${email}`); // LOG 9
        const admin = yield Admin_model_1.default.findOne({ where: { email } });
        if (!admin) {
            console.log(`[AdminService] Admin not found for email: ${email}`); // LOG 10
            throw new httpError_1.default("Invalid credentials", 401);
        }
        console.log(`[AdminService] Admin found. ID: ${admin.get("id")}, Name: ${admin.get("name")}`); // LOG 11
        console.log(`[AdminService] Admin's role from DB (raw): ${admin.get("role")}`); // LOG 12
        const isPasswordMatch = yield bcryptjs_1.default.compare(password, admin.get("password"));
        if (!isPasswordMatch) {
            console.log(`[AdminService] Password mismatch for email: ${email}`); // LOG 13
            throw new httpError_1.default("Invalid password", 400);
        }
        console.log(`[AdminService] Password matched for email: ${email}`); // LOG 14
        const SECRET_KEY = process.env.SECRET_KEY || 'cleanclean';
        const userRole = admin.get("role");
        console.log(`[AdminService] userRole (after casting to RoleValue): ${userRole}`); // LOG 15
        console.log(`[AdminService] Type of userRole: ${typeof userRole}`); // LOG 16
        const userSessionData = {
            id: admin.get("id"),
            name: admin.get("name"),
            email: admin.get("email"),
            role: userRole
        };
        console.log(`[AdminService] userSessionData before JWT:`, userSessionData); // LOG 17
        const token = jsonwebtoken_1.default.sign(userSessionData, SECRET_KEY, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
        console.log(`[AdminService] Token generated. Returning response.`); // LOG 18
        return {
            user: userSessionData,
            token,
            role: userRole
        };
    }
    catch (error) {
        console.error(`[AdminService] Service error caught:`, error); // LOG 19
        throw error;
    }
});
exports.loginAdminService = loginAdminService;
