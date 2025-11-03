// src/routes/company.router.ts
import express from 'express';
import * as CompanyController from '../controllers/companyController'; // Ensure correct import path for the controller
import isAuth from '../middleware/auth'; // Assuming isAuth middleware is used for admin authentication

const router = express.Router();

router.post('/create', isAuth, CompanyController.createCompanyController);
router.get('/', CompanyController.getAllCompaniesController); // Often public, or adjust isAuth as needed
router.get('/:id', CompanyController.getCompanyByIdController); // Often public, or adjust isAuth as needed
router.put('/:id', isAuth, CompanyController.updateCompanyController);
router.delete('/:id', isAuth, CompanyController.deleteCompanyController);

export default router;