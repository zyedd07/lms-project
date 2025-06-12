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
exports.loginAdmin = exports.createAdminController = void 0;
const httpError_1 = __importDefault(require("../utils/httpError"));
const Admin_service_1 = require("../services/Admin.service");
const constants_1 = require("../utils/constants"); // <-- Ensure RoleValue is imported
const createAdminController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (role !== constants_1.Role.ADMIN) {
            throw new httpError_1.default('Unauthorized', 403);
        }
        const { name, email, password } = req.body;
        if (!email || !password || !name) {
            throw new httpError_1.default("Please provide name, email and password", 400);
        }
        const newAdmin = yield (0, Admin_service_1.createAdminService)({ name, email, password });
        res.status(201).json(newAdmin);
    }
    catch (error) {
        next(error);
    }
});
exports.createAdminController = createAdminController;
const loginAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { email, password } = req.body;
        console.log(`[AdminController] Attempting login for email: ${email}`); // LOG 1
        if (!email || !password) {
            throw new httpError_1.default("Please provide both email and password", 400);
        }
        const response = yield (0, Admin_service_1.loginAdminService)({ email, password });
        console.log(`[AdminController] Response from loginAdminService:`, response); // LOG 2
        console.log(`[AdminController] User Role from service response:`, (_a = response.user) === null || _a === void 0 ? void 0 : _a.role); // LOG 3
        console.log(`[AdminController] Role.STUDENT value:`, constants_1.Role.STUDENT); // LOG 4
        // --- ROLE-BASED ACCESS CONTROL AT LOGIN ---
        // Using 'as RoleValue' for type safety in comparison
        if (response.user && response.user.role === constants_1.Role.STUDENT) {
            console.log(`[AdminController] Detected student role. Denying access.`); // LOG 5
            throw new httpError_1.default('Student accounts do not have access to the admin panel.', 403);
        }
        else {
            console.log(`[AdminController] Role is not student, or user object is missing. Allowing login.`); // LOG 6
        }
        // --- END ROLE-BASED ACCESS CONTROL ---
        res.status(200).json(response);
    }
    catch (error) {
        console.error(`[AdminController] Login error caught:`, error); // LOG 7
        if (error instanceof httpError_1.default) {
            console.error(`[AdminController] Sending HttpError: Status ${error.statusCode}, Message: ${error.message}`); // LOG 8
        }
        next(error);
    }
});
exports.loginAdmin = loginAdmin;
