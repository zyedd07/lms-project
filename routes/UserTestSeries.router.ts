import express from 'express';
import * as UserTestSeriesController from '../controllers/UserTestSeries.controller';
import isAuth, { authorizeAdmin } from '../middleware/auth';

const router = express.Router();

// Enroll a user in a test series
router.post('/enroll', isAuth, UserTestSeriesController.enrollInTestSeries);

// Get all test series for a specific user
router.get('/user/:userId/testseries', isAuth, UserTestSeriesController.getUserTestSeries);

// Unenroll a user from a test series
router.delete('/unenroll', isAuth, UserTestSeriesController.unenrollFromTestSeries);

// Update the status of a test series enrollment
router.put('/status', isAuth, authorizeAdmin, UserTestSeriesController.updateEnrollmentStatus);

export default router;
