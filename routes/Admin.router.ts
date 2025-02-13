import express from 'express';
import * as AdminController from '../controllers/Admin.controller';
import isAuth from '../middleware/auth';

const router = express.Router();

router.post('/create', isAuth, AdminController.createAdminController);
router.post('/login', AdminController.loginAdmin);

export default router;