// User.router.ts
import express from 'express';
import * as UserController from '../controllers/User.controller'; // Ensure this path is correct

// Import your authentication middleware
import isAuth from '../middleware/auth';

import { authorizeAdmin } from '../middleware/auth';

const router = express.Router();

router.post('/create', UserController.createUser);
router.post('/login', UserController.loginUser);
router.get('/:email', UserController.getUser); // To get a single user by email.
                                             // Consider if this route should be authenticated,
              
router.get('/', isAuth, authorizeAdmin, UserController.getAllUsers);

router.put('/:id', isAuth, authorizeAdmin, UserController.updateUser);

router.delete('/:id', isAuth, authorizeAdmin, UserController.deleteUser);

export default router;
