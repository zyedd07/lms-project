import express from 'express';
import * as CourseController from '../controllers/Course.controller';
import isAuth from '../middleware/auth';

const router = express.Router();

router.post('/create', isAuth, CourseController.createCourseController);
router.get('/', isAuth, CourseController.getCoursesController);
router.put('/:id', isAuth, CourseController.updateCourseController);
router.delete('/:id', isAuth, CourseController.deleteCourseController);
router.post('/teacher', isAuth, CourseController.courseTeacherController);
router.get('/getAssignedCourses', isAuth, CourseController.getAssignedCourseController);

export default router;