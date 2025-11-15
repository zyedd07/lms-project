"use strict";
// middleware/auth.ts
// Complete authentication middleware with device token verification
// Device token is OPTIONAL for admins
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
exports.authorizeTeacher = exports.authorizeAdmin = exports.refreshTokenController = exports.isAuth = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_model_1 = __importDefault(require("../models/User.model"));
// Configuration
const TOKEN_EXPIRY = '30d'; // 30 days
const REFRESH_THRESHOLD = 7 * 24 * 60 * 60; // 7 days in seconds
/**
 * Helper function to generate a new JWT token
 */
const generateToken = (payload, expiresIn = TOKEN_EXPIRY) => {
    const secretKey = process.env.SECRET_KEY;
    if (!secretKey) {
        throw new Error('SECRET_KEY is not defined in environment variables');
    }
    const tokenPayload = {
        id: payload.id,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        role: payload.role,
        profilePicture: payload.profilePicture,
        dateOfBirth: payload.dateOfBirth,
        address: payload.address,
        rollNo: payload.rollNo,
        collegeName: payload.collegeName,
        university: payload.university,
        country: payload.country
    };
    return jsonwebtoken_1.default.sign(tokenPayload, secretKey, { expiresIn });
};
exports.generateToken = generateToken;
/**
 * Check if token needs refresh (expires within 7 days)
 */
const shouldRefreshToken = (decoded) => {
    if (!decoded.exp)
        return false;
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - now;
    return timeUntilExpiry < REFRESH_THRESHOLD;
};
/**
 * Main authentication middleware with DEVICE TOKEN verification
 * Device token is OPTIONAL for admins, REQUIRED for students and teachers
 */
const isAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    const token = authHeader === null || authHeader === void 0 ? void 0 : authHeader.split(' ')[1];
    if (!token) {
        console.log("isAuth: No token provided.");
        return res.status(401).json({
            message: 'No token provided, authorization denied.',
            code: 'NO_TOKEN'
        });
    }
    try {
        const secretKey = process.env.SECRET_KEY;
        if (!secretKey) {
            throw new Error('SECRET_KEY is not defined');
        }
        // ==========================================
        // STEP 1: Verify JWT Token
        // ==========================================
        const decoded = jsonwebtoken_1.default.verify(token, secretKey);
        console.log("isAuth: Token valid for user:", decoded.email);
        // ==========================================
        // STEP 2: Fetch user from database
        // ==========================================
        const user = yield User_model_1.default.findByPk(decoded.id, {
            attributes: ['id', 'email', 'deviceToken', 'deviceId', 'role', 'status']
        });
        if (!user) {
            console.log(`isAuth: User not found: ${decoded.id}`);
            return res.status(401).json({
                message: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }
        const userRole = user.get('role');
        // ==========================================
        // STEP 3: Device Token Verification (SKIP FOR ADMINS)
        // ==========================================
        if (userRole === 'admin') {
            console.log(`isAuth: ✅ Admin user ${decoded.email} - SKIPPING device token check`);
        }
        else {
            // Device token is REQUIRED for non-admin users
            const deviceToken = req.headers['x-device-token'];
            const deviceId = req.headers['x-device-id'];
            if (!deviceToken) {
                console.log(`isAuth: No device token for user ${decoded.email}`);
                return res.status(401).json({
                    message: 'Device token missing. Please login again.',
                    code: 'DEVICE_TOKEN_MISSING',
                    requiresLogin: true
                });
            }
            // Check if user has a stored device token
            const storedDeviceToken = user.get('deviceToken');
            if (!storedDeviceToken) {
                console.log(`isAuth: No active session for user ${decoded.email}`);
                return res.status(401).json({
                    message: 'No active session. Please login again.',
                    code: 'NO_ACTIVE_SESSION',
                    requiresLogin: true
                });
            }
            // Verify device token matches
            if (storedDeviceToken !== deviceToken) {
                console.log(`isAuth: ❌ Device token mismatch for user ${decoded.email}`);
                console.log(`  Expected: ${storedDeviceToken.substring(0, 20)}...`);
                console.log(`  Received: ${deviceToken.substring(0, 20)}...`);
                return res.status(401).json({
                    message: 'Session invalid. You have been logged in from another device.',
                    code: 'DEVICE_MISMATCH',
                    requiresLogin: true
                });
            }
            // Optional: Verify device ID consistency (stricter security)
            const storedDeviceId = user.get('deviceId');
            if (storedDeviceId && deviceId && storedDeviceId !== deviceId) {
                console.log(`isAuth: ⚠️ Device ID mismatch for user ${decoded.email}`);
                return res.status(401).json({
                    message: 'Device ID mismatch. Please login again.',
                    code: 'DEVICE_MISMATCH',
                    requiresLogin: true
                });
            }
            console.log(`isAuth: ✅ Device verified for user ${decoded.email}`);
        }
        // ==========================================
        // STEP 4: Check user status
        // ==========================================
        const userStatus = user.get('status');
        if (userStatus === 'pending') {
            return res.status(403).json({
                message: 'Your account is awaiting admin approval',
                code: 'PENDING_APPROVAL'
            });
        }
        if (userStatus === 'rejected') {
            return res.status(403).json({
                message: 'Your account has been rejected',
                code: 'ACCOUNT_REJECTED'
            });
        }
        // ==========================================
        // STEP 5: Attach user to request
        // ==========================================
        req.user = decoded;
        // ==========================================
        // STEP 6: Auto-refresh token if needed (sliding window)
        // ==========================================
        if (shouldRefreshToken(decoded)) {
            console.log("isAuth: Token expiring soon. Issuing new 30-day token for:", decoded.email);
            const userPayload = {
                id: decoded.id,
                name: decoded.name,
                email: decoded.email,
                phone: decoded.phone,
                role: decoded.role,
                profilePicture: decoded.profilePicture,
                dateOfBirth: decoded.dateOfBirth,
                address: decoded.address,
                rollNo: decoded.rollNo,
                collegeName: decoded.collegeName,
                university: decoded.university,
                country: decoded.country
            };
            const newToken = (0, exports.generateToken)(userPayload);
            // Send new token in response headers
            res.setHeader('X-New-Token', newToken);
            res.setHeader('X-Token-Refreshed', 'true');
            console.log("isAuth: ✅ New 30-day token issued");
        }
        return next();
    }
    catch (err) {
        console.error("isAuth: Token verification failed:", err);
        if (err instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({
                message: 'Your session has expired. Please login again.',
                code: 'TOKEN_EXPIRED',
                requiresLogin: true
            });
        }
        if (err instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(401).json({
                message: 'Invalid token. Please login again.',
                code: 'TOKEN_INVALID',
                requiresLogin: true
            });
        }
        return res.status(401).json({
            message: 'Authentication failed.',
            code: 'AUTH_ERROR'
        });
    }
});
exports.isAuth = isAuth;
/**
 * Explicit token refresh endpoint
 * POST /api/user/refresh-token
 * Device token is OPTIONAL for admins
 */
const refreshTokenController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({
            message: 'Token is required for refresh.',
            code: 'NO_TOKEN'
        });
    }
    try {
        const secretKey = process.env.SECRET_KEY;
        if (!secretKey) {
            throw new Error('SECRET_KEY is not defined');
        }
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, secretKey);
        console.log("Token refresh requested for user:", decoded.email);
        // Fetch user to check role and device token
        const user = yield User_model_1.default.findByPk(decoded.id, {
            attributes: ['id', 'email', 'deviceToken', 'deviceId', 'role']
        });
        if (!user) {
            return res.status(401).json({
                message: 'User not found',
                code: 'USER_NOT_FOUND',
                requiresLogin: true
            });
        }
        const userRole = user.get('role');
        // ==========================================
        // VERIFY DEVICE TOKEN FOR REFRESH (SKIP FOR ADMINS)
        // ==========================================
        if (userRole === 'admin') {
            console.log(`Refresh: Admin user ${decoded.email} - SKIPPING device token check`);
        }
        else {
            const deviceToken = req.headers['x-device-token'];
            if (!deviceToken) {
                return res.status(401).json({
                    message: 'Device token required for refresh',
                    code: 'DEVICE_TOKEN_MISSING',
                    requiresLogin: true
                });
            }
            const storedDeviceToken = user.get('deviceToken');
            if (!storedDeviceToken || storedDeviceToken !== deviceToken) {
                console.log(`Refresh: Device mismatch for ${decoded.email}`);
                return res.status(401).json({
                    message: 'Session invalid. Logged in from another device.',
                    code: 'DEVICE_MISMATCH',
                    requiresLogin: true
                });
            }
        }
        // Update last login time
        yield user.update({
            lastLoginAt: new Date()
        });
        // Generate new token
        const userPayload = {
            id: decoded.id,
            name: decoded.name,
            email: decoded.email,
            phone: decoded.phone,
            role: decoded.role,
            profilePicture: decoded.profilePicture,
            dateOfBirth: decoded.dateOfBirth,
            address: decoded.address,
            rollNo: decoded.rollNo,
            collegeName: decoded.collegeName,
            university: decoded.university,
            country: decoded.country
        };
        const newToken = (0, exports.generateToken)(userPayload);
        console.log("Token refreshed successfully for:", decoded.email);
        return res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            token: newToken,
            user: userPayload
        });
    }
    catch (error) {
        console.error("Token refresh error:", error);
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({
                message: 'Token has expired. Please login again.',
                code: 'TOKEN_EXPIRED',
                requiresLogin: true
            });
        }
        return res.status(401).json({
            message: 'Invalid token. Cannot refresh.',
            code: 'INVALID_TOKEN',
            requiresLogin: true
        });
    }
});
exports.refreshTokenController = refreshTokenController;
/**
 * Admin role authorization middleware
 * Use after isAuth middleware
 */
const authorizeAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            message: 'Authentication required for this action.',
            code: 'NOT_AUTHENTICATED'
        });
    }
    if (req.user.role !== 'admin') {
        console.log(`authorizeAdmin: Access denied for ${req.user.email} (${req.user.role})`);
        return res.status(403).json({
            message: 'Access denied: Administrator role required.',
            code: 'INSUFFICIENT_PERMISSIONS'
        });
    }
    console.log(`authorizeAdmin: ✅ Admin access granted for ${req.user.email}`);
    next();
};
exports.authorizeAdmin = authorizeAdmin;
/**
 * Teacher role authorization middleware
 * Use after isAuth middleware
 */
const authorizeTeacher = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            message: 'Authentication required for this action.',
            code: 'NOT_AUTHENTICATED'
        });
    }
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        console.log(`authorizeTeacher: Access denied for ${req.user.email} (${req.user.role})`);
        return res.status(403).json({
            message: 'Access denied: Teacher role required.',
            code: 'INSUFFICIENT_PERMISSIONS'
        });
    }
    console.log(`authorizeTeacher: ✅ Teacher access granted for ${req.user.email}`);
    next();
};
exports.authorizeTeacher = authorizeTeacher;
exports.default = exports.isAuth;
