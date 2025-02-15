import express from 'express';
import * as QuestionController from '../controllers/Question.controller';
import isAuth from '../middleware/auth';

const router = express.Router();

router.post('/create', isAuth, QuestionController.createQuestionController);
router.get('/', QuestionController.getQuestionsController);
router.put('/:id', isAuth, QuestionController.updateQuestionController);
router.delete('/:id', isAuth, QuestionController.deleteQuestionController);

export default router;
