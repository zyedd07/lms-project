import express from 'express';
import * as UserController from '../controllers/User.controller'; // Ensure this path is correct

const router = express.Router();

// Existing routes
router.post('/create', UserController.createUser);
router.post('/login', UserController.loginUser);
router.get('/:email', UserController.getUser); // To get a single user by email

// --- New routes for Role Management ---

// GET all users
// This endpoint will be called by your frontend's fetchUsers function
// Example: GET /users
router.get('/', UserController.getAllUsers); 

// UPDATE a user by ID
// This endpoint will be called by your frontend's updateUserProfile function
// Example: PUT /users/:id
router.put('/:id', UserController.updateUser); 

// DELETE a user by ID
// This endpoint will be called by your frontend's deleteUser function
// Example: DELETE /users/:id
router.delete('/:id', UserController.deleteUser); 

export default router;
