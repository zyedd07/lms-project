import express from 'express';
import * as CourseController from '../controllers/Course.controller'; // Import all controllers
import isAuth from '../middleware/auth'; // Import your authentication middleware

const router = express.Router();

router.post('/create', isAuth, CourseController.createCourseController);
router.get('/', isAuth, CourseController.getCoursesController); // Can be used for general listing/filtering
router.get('/:id', isAuth, CourseController.getCourseByIdController); // Specific course by ID
router.put('/:id', isAuth, CourseController.updateCourseController);
router.delete('/:id', isAuth, CourseController.deleteCourseController);

router.post('/teacher', isAuth, CourseController.courseTeacherController);
router.get('/getAssignedCourses', isAuth, CourseController.getAssignedCourseController);

router.post('/:courseId/contents', isAuth, CourseController.addCourseContentController);
router.put('/:courseId/contents/:contentId', isAuth, CourseController.updateCourseContentController);
router.delete('/:courseId/contents/:contentId', isAuth, CourseController.deleteCourseContentController);

export default router;
