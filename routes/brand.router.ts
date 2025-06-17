// src/routes/brand.router.ts
import express from 'express';
import * as BrandController from '../controllers/brandController'; // Ensure correct import path for the controller
import isAuth from '../middleware/auth'; // Assuming isAuth middleware is used for admin authentication

const router = express.Router();

router.post('/create', isAuth, BrandController.createBrandController);
router.get('/', BrandController.getAllBrandsController); // Often public, or adjust isAuth as needed (e.g., public view)
router.get('/:id', BrandController.getBrandByIdController); // Often public, or adjust isAuth as needed
router.put('/:id', isAuth, BrandController.updateBrandController);
router.delete('/:id', isAuth, BrandController.deleteBrandController);

export default router;