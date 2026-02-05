import express from 'express';
import * as UserTestAttemptController from '../controllers/Usertestattempt.controller';
import isAuth from '../middleware/auth';

const router = express.Router();

// ===== USER ROUTES =====

// Check if the current user can take a specific test
router.get('/eligibility/:testId', isAuth, UserTestAttemptController.checkTestEligibilityController);

// Mark that the user has started a test (call this when user clicks "Start Test")
router.post('/start/:testId', isAuth, UserTestAttemptController.startTestAttemptController);

// Mark that the user has completed a test (call this when user submits the test)
router.post('/complete/:testId', isAuth, UserTestAttemptController.completeTestAttemptController);

// Get current user's test attempt history
// Optional query param: ?testId=uuid (to get attempts for a specific test)
router.get('/my-attempts', isAuth, UserTestAttemptController.getMyTestAttemptsController);

// ===== ADMIN/TEACHER ROUTES =====

// Admin grants additional attempts to a user
// Body: { userId, testId, additionalAttempts, reason? }
router.post('/grant', isAuth, UserTestAttemptController.grantTestAttemptsController);

// Admin resets test attempts for a user (sets attempts back to default or custom value)
// Body: { userId, testId, newAllowedAttempts?, reason? }
router.post('/reset', isAuth, UserTestAttemptController.resetTestAttemptsController);

// Admin/Teacher gets all users' attempt status for a specific test
router.get('/test/:testId/status', isAuth, UserTestAttemptController.getTestAttemptsStatusController);

// Admin/Teacher gets a specific user's test attempt history
// Optional query param: ?testId=uuid
router.get('/user/:userId', isAuth, UserTestAttemptController.getUserTestAttemptsController);

export default router;