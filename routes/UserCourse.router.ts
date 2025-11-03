import express from 'express';
import * as UserCourseController from '../controllers/UserCourse.controller';
import isAuth, { authorizeAdmin } from '../middleware/auth';

const router = express.Router();

// Route to enroll a user in a course
router.post('/enroll', isAuth, UserCourseController.enrollInCourse);

// Route to get all courses for a specific user
router.get('/user/:userId/courses', isAuth, UserCourseController.getUserCourses);

// Route to remove a user's enrollment from a course
router.delete('/unenroll', isAuth, UserCourseController.unenrollFromCourse);

// --- NEW ROUTE ---
// Route to update the status of an enrollment (e.g., 'active', 'completed', 'dropped')
// The frontend will send { userId, courseId, status } in the request body.
router.put('/status', isAuth, authorizeAdmin, UserCourseController.updateEnrollmentStatus);


export default router;
