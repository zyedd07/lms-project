import express from 'express';
import * as AdminController from '../controllers/Admin.controller';
import isAuth, { authorizeAdmin } from '../middleware/auth';


const router = express.Router();

router.post('/create', isAuth, AdminController.createAdminController);
router.post('/login',authorizeAdmin, AdminController.loginAdmin);

export default router;
