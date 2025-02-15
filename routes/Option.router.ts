import express from 'express';
import * as OptionController from '../controllers/Option.controller';
import isAuth from '../middleware/auth';

const router = express.Router();

router.post('/create', isAuth, OptionController.createOptionController);
router.get('/', OptionController.getOptionsController);
router.put('/:id', isAuth, OptionController.updateOptionController);
router.delete('/:id', isAuth, OptionController.deleteOptionController);

export default router;
