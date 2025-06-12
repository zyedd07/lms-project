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
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1]; // Extract token from "Bearer <token>"
    if (!token) {
        console.log("isAuth: No token provided."); // Log for debugging
        return res.status(401).json({ message: 'No token provided, authorization denied.' });
    }
    try {
        // Verify the token using the SECRET_KEY from environment variables
        const decoded = jsonwebtoken_1.default.verify(token, process.env.SECRET_KEY);
        req.user = decoded; // Attach the decoded user payload to the request
        console.log("isAuth: Token successfully verified. User:", req.user.email, "Role:", req.user.role); // Log success
        next(); // Proceed to the next middleware or route handler
    }
    catch (err) {
        console.error("isAuth: Token verification failed:", err); // Log the specific error
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
});
exports.isAuth = isAuth;
/**

 * Middleware to authorize access only to users with the 'admin' role.

 * This middleware should be used AFTER the isAuth middleware.

 */
const authorizeAdmin = (req, res, next) => {
    // Check if user information is available from the authentication middleware
    if (!req.user) {
        console.log("authorizeAdmin: User not authenticated (req.user is missing).");
        // This case should ideally be caught by isAuth, but good for robustness
        return res.status(401).json({ message: 'Authentication required for this action.' });
    }
    // Check if the authenticated user has the 'admin' role
    if (req.user.role !== 'admin') {
        console.log(`authorizeAdmin: Access denied for user ${req.user.email} with role ${req.user.role}.`);
        return res.status(403).json({ message: 'Access denied: Administrator role required.' });
    }
    console.log(`authorizeAdmin: Admin access granted for ${req.user.email}.`); // Log success
    next(); // User is an admin, proceed
};
exports.authorizeAdmin = authorizeAdmin;
// You can export both as named exports, or keep isAuth as default and export authorizeAdmin as named
exports.default = exports.isAuth; // Export isAuth as the default
// And export authorizeAdmin as a named export
// This allows you to import it as: import isAuth, { authorizeAdmin } from '../middleware/auth';
