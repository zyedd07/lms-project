// User.router.ts
import express from 'express';
import * as UserController from '../controllers/User.controller'; // Ensure this path is correct

// Import your authentication middleware
import isAuth from '../middleware/auth';

// Import your authorization middleware (assuming you have one, or define it)
// If authorizeAdmin is also in auth.ts as a named export:
// import isAuth, { authorizeAdmin } from '../middleware/auth';
// If it's in a separate file:
import { authorizeAdmin } from '../middleware/authorizeAdmin'; // <-- Adjust path if needed

const router = express.Router();

// Existing routes (might need authentication too, depending on your app's logic)
router.post('/create', UserController.createUser);
router.post('/login', UserController.loginUser);
router.get('/:email', UserController.getUser); // To get a single user by email.
                                             // Consider if this route should be authenticated,
                                             // e.g., only logged-in users can view profiles.
                                             // If so: router.get('/:email', isAuth, UserController.getUser);

// --- New routes for Role Management (Require Authentication and Admin Authorization) ---

// GET all users
// This endpoint will be called by your frontend's fetchUsers function
// It requires authentication (isAuth) and administrator role (authorizeAdmin)
router.get('/', isAuth, authorizeAdmin, UserController.getAllUsers);

// UPDATE a user by ID
// This endpoint will be called by your frontend's updateUserProfile function
// It requires authentication (isAuth) and administrator role (authorizeAdmin)
router.put('/:id', isAuth, authorizeAdmin, UserController.updateUser);

// DELETE a user by ID
// This endpoint will be called by your frontend's deleteUser function
// It requires authentication (isAuth) and administrator role (authorizeAdmin)
router.delete('/:id', isAuth, authorizeAdmin, UserController.deleteUser);

export default router;
