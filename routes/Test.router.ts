import express from 'express';
import * as TestController from '../controllers/Test.controller';
import isAuth from '../middleware/auth';

const router = express.Router();

// Create a new Test for a given TestSeries
router.post('/create', isAuth, TestController.createTestController);

// Get all Tests for a specific TestSeries (e.g., /api/tests?testSeriesId=uuid)
router.get('/', isAuth, TestController.getTestsByTestSeriesController);

// Get a single Test by ID (e.g., /api/tests/:id)
// Renamed from getTestByIdController to getTestController as per controller
router.get('/:id', isAuth, TestController.getTestController);

// Update a Test by ID
router.put('/:id', isAuth, TestController.updateTestController);

// Delete a Test by ID
router.delete('/:id', isAuth, TestController.deleteTestController);

export default router;
