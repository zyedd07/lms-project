// User.router.ts
import express from 'express';
import * as UserController from '../controllers/User.controller';
import isAuth, { authorizeAdmin } from '../middleware/auth';

const router = express.Router();

router.post('/create', UserController.createUser);
router.post('/login', UserController.loginUser);

// NEW: Endpoint to get the currently logged-in user's profile based on their token
router.get('/me', isAuth, UserController.getLoggedInUser); // <--- ADD THIS LINE

router.get('/:email', UserController.getUser);
// Consider if this route should be authenticated,
// e.g., router.get('/:email', isAuth, UserController.getUser);
// or if only admins can view other user profiles:
// router.get('/:email', isAuth, authorizeAdmin, UserController.getUser);


router.get('/', isAuth, authorizeAdmin, UserController.getAllUsers);

router.put('/:id', isAuth, authorizeAdmin, UserController.updateUser);

router.delete('/:id', isAuth, authorizeAdmin, UserController.deleteUser);

export default router;
