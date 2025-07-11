import express from 'express';
import * as UserWebinarController from '../controllers/UserWebinar.Controller'; // Assuming your webinar controller is here
import isAuth, { authorizeAdmin } from '../middleware/auth'; // Assuming your auth middleware is here

const router = express.Router();

router.post('/enroll', isAuth, UserWebinarController.enrollInWebinar);

router.get('/user/:userId/webinars', isAuth, UserWebinarController.getUserWebinars);

router.delete('/unenroll', isAuth, UserWebinarController.unenrollFromWebinar);

router.put('/status', isAuth, authorizeAdmin, UserWebinarController.updateWebinarEnrollmentStatus);


export default router;
