import express from 'express';
import * as QuestionController from '../controllers/Question.controller';
import isAuth from '../middleware/auth';

const router = express.Router();

// Create a new Question for a given Test
router.post('/create', isAuth, QuestionController.createQuestionController);

// Get all Questions for a specific Test (e.g., /api/questions?testId=uuid)
// Renamed from getQuestionsByTestIdController to getQuestionsController as per controller
router.get('/', isAuth, QuestionController.getQuestionsController);

// Get a single Question by ID
router.get('/:id', isAuth, QuestionController.getQuestionByIdController);

// Update a Question by ID
router.put('/:id', isAuth, QuestionController.updateQuestionController);

// Delete a Question by ID
router.delete('/:id', isAuth, QuestionController.deleteQuestionController);

export default router;
