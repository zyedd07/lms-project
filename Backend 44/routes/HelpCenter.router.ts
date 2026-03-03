import express from 'express';
import * as HelpCenterController from '../controllers/HelpCenter.controller';
import isAuth, { authorizeAdmin } from '../middleware/auth'; // Assuming you have these auth middlewares

const router = express.Router();

// PUBLIC ROUTE: Anyone can fetch the help center content
router.get('/', HelpCenterController.getAllHelpSections);

// ADMIN-ONLY ROUTES: Only authenticated admins can create, update, or delete sections
router.post('/', isAuth, authorizeAdmin, HelpCenterController.createHelpSection);
router.put('/:id', isAuth, authorizeAdmin, HelpCenterController.updateHelpSection);
router.delete('/:id', isAuth, authorizeAdmin, HelpCenterController.deleteHelpSection);

export default router;
