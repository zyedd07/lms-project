import express from 'express';
import * as homeContentController from '../controllers/HomeContent.controller';
import isAuth, { authorizeAdmin } from '../middleware/auth'; // Assuming auth middleware exists

const router = express.Router();


router.get('/', homeContentController.getHomeContent);


router.put(
    '/update',
    isAuth,
    authorizeAdmin,
    homeContentController.updateHomeContent
);

export default router;