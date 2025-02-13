import express from 'express';
import * as TeacherController from '../controllers/Teacher.controller';
import isAuth from '../middleware/auth';

const router = express.Router();

router.post('/create', isAuth, TeacherController.createTeacher);
router.post('/login', TeacherController.loginTeacher);
router.get('/', isAuth, TeacherController.getTeachersController);

export default router;