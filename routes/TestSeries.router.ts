import express from 'express';
import * as TestSeriesController from '../controllers/TestSeries.controller';
import isAuth from '../middleware/auth';

const router = express.Router();

router.post('/create', isAuth, TestSeriesController.createTestSeriesController);
router.get('/', TestSeriesController.getTestSeriesController);
router.put('/:id', isAuth, TestSeriesController.updateTestSeriesController);
router.delete('/:id', isAuth, TestSeriesController.deleteTestSeriesController);
router.get('/full', isAuth, TestSeriesController.getFullTestSeriesController);

export default router;