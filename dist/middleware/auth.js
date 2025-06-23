"use strict";
// middleware/auth.ts
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
exports.authorizeAdmin = exports.isAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Middleware to authenticate a user using a JWT token.
 * It verifies the token and attaches the decoded user payload to req.user.
 */
const isAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
    if (!token) {
        console.log("isAuth: No token provided.");
        return res.status(401).json({ message: 'No token provided, authorization denied.' });
    }
    try {
        // --- CRITICAL FIX: Cast to JwtUserPayload imported from utils/types ---
        const decoded = jsonwebtoken_1.default.verify(token, process.env.SECRET_KEY);
        // req.user now correctly receives the JwtUserPayload type
        req.user = decoded;
        console.log("isAuth: Token successfully verified. User:", req.user.email, "Role:", req.user.role);
        next();
    }
    catch (err) {
        console.error("isAuth: Token verification failed:", err);
        if (err instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({ message: 'Invalid or expired token.' });
        }
        if (err instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(401).json({ message: 'Invalid token.' });
        }
        return res.status(401).json({ message: 'Authentication failed.' });
    }
});
exports.isAuth = isAuth;
/**
 * Middleware to authorize access only to users with the 'admin' role.
 * This middleware should be used AFTER the isAuth middleware.
 */
// This is already exported by 'export const authorizeAdmin = ...'
const authorizeAdmin = (req, res, next) => {
    if (!req.user) {
        console.log("authorizeAdmin: User not authenticated (req.user is missing).");
        return res.status(401).json({ message: 'Authentication required for this action.' });
    }
    if (req.user.role !== 'admin') {
        console.log(`authorizeAdmin: Access denied for user ${req.user.email} with role ${req.user.role}.`);
        return res.status(403).json({ message: 'Access denied: Administrator role required.' });
    }
    console.log(`authorizeAdmin: Admin access granted for ${req.user.email}.`);
    next();
};
exports.authorizeAdmin = authorizeAdmin;
exports.default = exports.isAuth;
