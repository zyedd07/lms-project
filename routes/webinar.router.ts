// src/routes/webinar.router.ts

import { Router } from 'express';
import {
  createWebinarController,
  getAllWebinarsController,
  getWebinarByIdController,
  updateWebinarController,
  deleteWebinarController,
} from '../controllers/webinar.controller'; // Import your webinar controllers
// Changed from verifyToken, authorizeRole to isAuth
import isAuth from '../middleware/auth'; // Assuming isAuth middleware exists and handles authentication/authorization

const router = Router();

// Routes for Webinars

// POST /api/webinars - Create a new webinar (Admin only)
router.post('/create', isAuth, createWebinarController); // Using isAuth for authentication

// GET /api/webinars - Get all webinars (Accessible to all roles, possibly with filters)
router.get('/', getAllWebinarsController);

// GET /api/webinars/:id - Get a single webinar by ID (Accessible to all roles)
router.get('/:id', getWebinarByIdController);

// PUT /api/webinars/:id - Update a webinar by ID (Admin only)
router.put('/:id', isAuth, updateWebinarController); // Using isAuth for authentication

// DELETE /api/webinars/:id - Delete a webinar by ID (Admin only)
router.delete('/:id', isAuth, deleteWebinarController); // Using isAuth for authentication

export default router;
