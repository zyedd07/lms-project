import express from 'express';
import * as TeacherController from '../controllers/teacher.controller';
import isAuth, { authorizeAdmin } from '../middleware/auth';

const router = express.Router();

// This assumes you might have other teacher-specific routes in the future.

// GET a specific teacher's page permissions
router.get('/:userId/permissions', isAuth, authorizeAdmin, TeacherController.getTeacherPermissions);

// PUT (update) a specific teacher's page permissions
router.put('/:userId/permissions', isAuth, authorizeAdmin, TeacherController.updateTeacherPermissions);


export default router;
