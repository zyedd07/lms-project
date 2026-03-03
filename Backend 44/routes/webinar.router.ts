// src/routes/webinar.router.ts

import { Router } from 'express';
import {
  createWebinarController,
  getAllWebinarsController,
  getWebinarByIdController,
  updateWebinarController,
  deleteWebinarController,
  // --- NEW: Import the Jitsi details controller ---
  getJitsiDetailsController,
} from '../controllers/webinar.controller'; // Ensure this path is correct relative to your router file
import isAuth from '../middleware/auth'; // Assuming isAuth middleware exists and handles authentication/authorization

const router = Router();

// Routes for Webinars

// POST /api/webinars/create - Create a new webinar (Admin only)
router.post('/create', isAuth, createWebinarController);

// GET /api/webinars - Get all webinars (Accessible to all roles, possibly with filters)
router.get('/', getAllWebinarsController);

// GET /api/webinars/:id - Get a single webinar by ID (Accessible to all roles)
router.get('/:id', getWebinarByIdController);

// PUT /api/webinars/:id - Update a webinar by ID (Admin only)
router.put('/:id', isAuth, updateWebinarController);

// DELETE /api/webinars/:id - Delete a webinar by ID (Admin only)
router.delete('/:id', isAuth, deleteWebinarController);

// --- NEW ROUTE FOR JITSI DETAILS ---
// GET /api/webinars/:id/jitsi-details - Get Jitsi meeting details for a specific webinar
// It is HIGHLY RECOMMENDED to protect this endpoint with your authentication middleware (`isAuth`)
// as it provides a JWT allowing access to your JaaS meeting.
router.get('/:id/jitsi-details', isAuth, getJitsiDetailsController);

export default router;