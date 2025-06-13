"use strict";
// src/routes/webinar.router.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const webinar_controller_1 = require("../controllers/webinar.controller"); // Import your webinar controllers
// Changed from verifyToken, authorizeRole to isAuth
const auth_1 = __importDefault(require("../middleware/auth")); // Assuming isAuth middleware exists and handles authentication/authorization
const router = (0, express_1.Router)();
// Routes for Webinars
// POST /api/webinars - Create a new webinar (Admin only)
router.post('/create', auth_1.default, webinar_controller_1.createWebinarController); // Using isAuth for authentication
// GET /api/webinars - Get all webinars (Accessible to all roles, possibly with filters)
router.get('/', webinar_controller_1.getAllWebinarsController);
// GET /api/webinars/:id - Get a single webinar by ID (Accessible to all roles)
router.get('/:id', webinar_controller_1.getWebinarByIdController);
// PUT /api/webinars/:id - Update a webinar by ID (Admin only)
router.put('/:id', auth_1.default, webinar_controller_1.updateWebinarController); // Using isAuth for authentication
// DELETE /api/webinars/:id - Delete a webinar by ID (Admin only)
router.delete('/:id', auth_1.default, webinar_controller_1.deleteWebinarController); // Using isAuth for authentication
exports.default = router;
