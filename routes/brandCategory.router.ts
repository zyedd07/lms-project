// src/routes/brandCategory.router.ts
import express from 'express';
import * as BrandCategoryController from '../controllers/brandCategoryController'; // Ensure correct import path for the controller
import isAuth from '../middleware/auth'; // Assuming isAuth middleware is used for admin authentication

const router = express.Router();

router.post('/create', isAuth, BrandCategoryController.createBrandCategoryController);
router.get('/', BrandCategoryController.getAllBrandCategoriesController); // Often public, or adjust isAuth as needed
router.get('/:id', BrandCategoryController.getBrandCategoryByIdController); // Often public, or adjust isAuth as needed
router.put('/:id', isAuth, BrandCategoryController.updateBrandCategoryController);
router.delete('/:id', isAuth, BrandCategoryController.deleteBrandCategoryController);

export default router;