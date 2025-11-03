import express from 'express';
import * as UserQbankController from '../controllers/UserQbank.controller';
import isAuth, { authorizeAdmin } from '../middleware/auth';

const router = express.Router();

// Enroll a user in a Q-Bank
router.post('/enroll', isAuth, UserQbankController.enrollInQbank);

// Get all Q-Banks for a specific user
router.get('/user/:userId/qbanks', isAuth, UserQbankController.getUserQbanks);

// Unenroll a user from a Q-Bank
router.delete('/unenroll', isAuth, UserQbankController.unenrollFromQbank);

// Update the status of a Q-Bank enrollment
router.put('/status', isAuth, authorizeAdmin, UserQbankController.updateEnrollmentStatus);

export default router;
