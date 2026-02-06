import express from 'express';
import * as TestController from '../controllers/Test.controller';
import isAuth from '../middleware/auth';

const router = express.Router();

// Create a new Test for a given TestSeries (Admin/Teacher only)
router.post('/create', isAuth, TestController.createTestController);

// Get all Tests for a specific TestSeries (e.g., /api/tests?testSeriesId=uuid)
router.get('/', isAuth, TestController.getTestsByTestSeriesController);

// Get a single Test by ID (with eligibility info if student)
router.get('/:id', isAuth, TestController.getTestController);

// Update a Test by ID (Admin/Teacher only)
router.put('/:id', isAuth, TestController.updateTestController);

// Delete a Test by ID (Admin/Teacher only)
router.delete('/:id', isAuth, TestController.deleteTestController);

export default router;