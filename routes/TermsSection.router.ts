import express from 'express';
import * as TermsSectionController from '../controllers/TermsSection.controller';
import isAuth, { authorizeAdmin } from '../middleware/auth'; // Assuming you have these auth middlewares

const router = express.Router();

// PUBLIC ROUTE: Anyone can fetch the Terms of Service sections
router.get('/', TermsSectionController.getAllTermsSections);

// ADMIN-ONLY ROUTES: Only authenticated admins can create, update, or delete sections
router.post('/', isAuth, authorizeAdmin, TermsSectionController.createTermsSection);
router.put('/:id', isAuth, authorizeAdmin, TermsSectionController.updateTermsSection);
router.delete('/:id', isAuth, authorizeAdmin, TermsSectionController.deleteTermsSection);

export default router;
