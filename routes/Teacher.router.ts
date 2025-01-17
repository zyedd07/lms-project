import express from 'express';
import * as TeacherController from '../controllers/Teacher.controller';

const router = express.Router();

router.post('/create', TeacherController.createTeacher);
router.post('/login', TeacherController.loginTeacher);

export default router;