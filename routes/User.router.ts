import express from 'express';
import * as UserController from '../controllers/User.controller';
const router = express.Router();

router.post('/create', UserController.createUser);
router.post('/login', UserController.loginUser);
router.get('/:email', UserController.getUser);

export default router;