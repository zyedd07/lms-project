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
exports.checkDeviceToken = void 0;
const User_model_1 = __importDefault(require("../models/User.model"));
const checkDeviceToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Verify user is authenticated (should be done by isAuth middleware before this)
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: 'User not authenticated',
                code: 'NOT_AUTHENTICATED'
            });
        }
        // Get device token from request header
        const deviceToken = req.headers['x-device-token'];
        if (!deviceToken) {
            console.log(`checkDeviceToken: No device token provided for user ${req.user.email}`);
            return res.status(401).json({
                message: 'Device token missing. Please login again.',
                code: 'DEVICE_TOKEN_MISSING',
                requiresLogin: true
            });
        }
        // Fetch user from database to get stored device token
        const user = yield User_model_1.default.findByPk(req.user.id);
        if (!user) {
            return res.status(401).json({
                message: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }
        const storedDeviceToken = user.get('deviceToken');
        // Check if device token matches
        if (!storedDeviceToken || storedDeviceToken !== deviceToken) {
            console.log(`checkDeviceToken: Device token mismatch for user ${req.user.email}`);
            console.log(`  Expected: ${storedDeviceToken}`);
            console.log(`  Received: ${deviceToken}`);
            return res.status(401).json({
                message: 'Session invalid. You have been logged in from another device.',
                code: 'DEVICE_MISMATCH',
                requiresLogin: true
            });
        }
        // Device token is valid, proceed to next middleware/controller
        console.log(`checkDeviceToken: Valid device token for user ${req.user.email}`);
        next();
    }
    catch (error) {
        console.error('checkDeviceToken error:', error);
        return res.status(500).json({
            message: 'Error verifying device',
            code: 'DEVICE_CHECK_ERROR'
        });
    }
});
exports.checkDeviceToken = checkDeviceToken;
