// routes/Result.routes.ts

import express from 'express';
import * as ResultController from '../controllers/Result.controller';
import isAuth, { authorizeAdmin } from '../middleware/auth';

const router = express.Router();


// Get my results (authenticated user's own results)
router.get('/my-results', isAuth, ResultController.getMyResultsController);

// Get user statistics
router.get('/statistics/user/:userId', isAuth, ResultController.getUserStatisticsController);

// Get all results for a specific test (Admin only)
router.get('/test/:testId', isAuth, authorizeAdmin, ResultController.getResultsByTestController);

// Get all results for a specific user
router.get('/user/:userId', isAuth, ResultController.getResultsByUserController);

// Get all results (Admin only) - This should be BEFORE /:id route
router.get('/all', isAuth, authorizeAdmin, ResultController.getAllResultsController);

// Get result by ID - This should be LAST among GET routes
router.get('/:id', isAuth, ResultController.getResultByIdController);

// Create a new result (authenticated users)
router.post('/', isAuth, ResultController.createResultController);

// Delete a result (Admin only)
router.delete('/:id', isAuth, authorizeAdmin, ResultController.deleteResultController);

export default router;