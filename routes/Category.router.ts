import express from 'express';
import * as CategoryController from '../controllers/Category.controller';
import isAuth from '../middleware/auth';

const router = express.Router();

router.post('/create', isAuth, CategoryController.createCategoryController);
router.get('/', CategoryController.getCategoriesController);
router.put('/:id', isAuth, CategoryController.updateCategoryController);

export default router;