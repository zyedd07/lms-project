import express from 'express';
import * as TestController from '../controllers/Test.controller';
import isAuth from '../middleware/auth';

const router = express.Router();

router.post('/create', isAuth, TestController.createTestController);
router.get('/:id', isAuth, TestController.getTestController);
router.put('/:id', isAuth, TestController.updateTestController);
router.delete('/:id', isAuth, TestController.deleteTestController);
router.get('/', isAuth, TestController.getTestsByTestSeriesController); 

export default router;