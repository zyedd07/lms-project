import express from 'express';
import * as TestSeriesController from '../controllers/TestSeries.controller';
import isAuth from '../middleware/auth';

const router = express.Router();

router.post('/create', isAuth, TestSeriesController.createTestSeriesController);
router.get('/', TestSeriesController.getTestSeriesController); // Get all TestSeries (categories)
router.get('/:id', TestSeriesController.getTestSeriesByIdController); // Get a single TestSeries
router.put('/:id', isAuth, TestSeriesController.updateTestSeriesController);
router.delete('/:id', isAuth, TestSeriesController.deleteTestSeriesController);

export default router;
